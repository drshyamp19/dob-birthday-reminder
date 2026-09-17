// Main Application Controller
import { initializeFirebase, isDemoMode, getStoredFirebaseConfig, saveStoredFirebaseConfig, clearStoredFirebaseConfig } from './firebase-config.js';
import { getCurrentUser, onAuthStateChanged, signInWithGoogle, logOut } from './auth.js';
import { subscribeToContacts, addContact, updateContact, deleteContact, getPreferences, savePreferences } from './db.js';
import { calculateBirthdayInfo, formatMarathiDate, formatShortDate } from './birthday.js';
import { generateWishMessage, getWhatsAppLink, copyToClipboard, WISH_TEMPLATES } from './whatsapp.js';
import { requestNotificationPermission, checkAndTriggerDailyReminders, isNotificationGranted } from './notifications.js';
import { exportContactsToCSV, exportContactsToJSON, parseCSVContacts } from './export-import.js';

// Global state
let allContacts = [];
let currentTab = 'today';
let currentCategory = 'सर्व';
let searchQuery = '';
let currentSort = 'upcoming';
let activeUser = null;
let currentWhatsAppContact = null;
let contactToDeleteId = null;

// Expose switchTab globally for inline onclick
window.switchTab = (tab) => {
  currentTab = tab;
  document.querySelectorAll('.tab-btn').forEach(btn => {
    if (btn.getAttribute('data-tab') === tab) {
      btn.classList.add('active');
      btn.classList.remove('text-slate-500', 'dark:text-slate-400');
    } else {
      btn.classList.remove('active');
      btn.classList.add('text-slate-500', 'dark:text-slate-400');
    }
  });

  const sortCont = document.getElementById('sortContainer');
  if (sortCont) {
    if (tab === 'all') sortCont.classList.remove('hidden');
    else sortCont.classList.add('hidden');
  }

  renderContacts();
};

// Toast notification helper
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  const colors = {
    info: 'bg-slate-900 text-white dark:bg-white dark:text-slate-900',
    success: 'bg-emerald-600 text-white',
    warning: 'bg-amber-600 text-white',
    error: 'bg-rose-600 text-white'
  };

  toast.className = `px-4 py-3 rounded-2xl shadow-xl text-xs font-semibold flex items-center gap-2 pointer-events-auto transition-all transform duration-200 translate-y-2 opacity-0 ${colors[type] || colors.info}`;
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  });

  setTimeout(() => {
    toast.classList.add('translate-y-2', 'opacity-0');
    setTimeout(() => toast.remove(), 250);
  }, 3200);
}

// Category Badge Color
function getCategoryBadgeClass(category) {
  switch (category) {
    case 'मित्र':
      return 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    case 'कुटुंब':
      return 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
    case 'नातेवाईक':
      return 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
    case 'सहकारी':
      return 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
    default:
      return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  }
}

// Trigger Confetti
function triggerConfettiAnimation() {
  if (typeof confetti === 'function') {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  }
}

// -------------------------------------------------------------
// Render Cards Function
// -------------------------------------------------------------
function renderContacts() {
  const container = document.getElementById('contactsContainer');
  const emptyState = document.getElementById('emptyState');
  if (!container) return;

  // Process contacts with birthday engine
  const processed = allContacts.map(c => {
    const info = calculateBirthdayInfo(c.dob);
    return { ...c, birthdayInfo: info };
  });

  // Update Stats counts
  let todayCount = 0;
  let tomorrowCount = 0;
  let monthCount = 0;
  const todayNames = [];

  processed.forEach(c => {
    if (c.birthdayInfo.status === 'today') {
      todayCount++;
      todayNames.push(c.name);
    } else if (c.birthdayInfo.status === 'tomorrow') {
      tomorrowCount++;
    }
    if (c.birthdayInfo.status === 'this_month' || c.birthdayInfo.status === 'today' || c.birthdayInfo.status === 'tomorrow') {
      monthCount++;
    }
  });

  document.getElementById('statTodayCount').innerText = todayCount;
  document.getElementById('statTomorrowCount').innerText = tomorrowCount;
  document.getElementById('statMonthCount').innerText = monthCount;
  document.getElementById('statTotalCount').innerText = processed.length;

  document.getElementById('tabBadgeToday').innerText = todayCount;
  document.getElementById('tabBadgeTomorrow').innerText = tomorrowCount;
  document.getElementById('tabBadgeMonth').innerText = monthCount;
  document.getElementById('tabBadgeAll').innerText = processed.length;

  // Show/hide Today's celebration hero banner
  const heroBanner = document.getElementById('todayCelebrationBanner');
  const heroNames = document.getElementById('todayCelebrationNames');
  if (heroBanner && heroNames) {
    if (todayCount > 0) {
      heroBanner.classList.remove('hidden');
      heroNames.innerText = `आज ${todayNames.join(', ')} यांचा वाढदिवस आहे! मनःपूर्वक शुभेच्छा 🎉💐`;
    } else {
      heroBanner.classList.add('hidden');
    }
  }

  // Filter by Tab
  let filtered = processed.filter(c => {
    if (currentTab === 'today') return c.birthdayInfo.status === 'today';
    if (currentTab === 'tomorrow') return c.birthdayInfo.status === 'tomorrow';
    if (currentTab === 'this_month') return c.birthdayInfo.status === 'this_month' || c.birthdayInfo.status === 'today' || c.birthdayInfo.status === 'tomorrow';
    return true; // 'all'
  });

  // Filter by Category
  if (currentCategory !== 'सर्व') {
    filtered = filtered.filter(c => (c.category || 'इतर') === currentCategory);
  }

  // Filter by Search Query
  if (searchQuery.trim().length > 0) {
    const q = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(c => {
      const nameMatch = (c.name || '').toLowerCase().includes(q);
      const mobileMatch = (c.mobile || '').includes(q);
      const dobMatch = (c.dob || '').includes(q);
      const placeMatch = (c.birthPlace || '').toLowerCase().includes(q);
      const notesMatch = (c.notes || '').toLowerCase().includes(q);
      return nameMatch || mobileMatch || dobMatch || placeMatch || notesMatch;
    });
  }

  // Sorting
  if (currentTab === 'all') {
    if (currentSort === 'upcoming') {
      filtered.sort((a, b) => a.birthdayInfo.daysRemaining - b.birthdayInfo.daysRemaining);
    } else if (currentSort === 'name') {
      filtered.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'mr'));
    } else if (currentSort === 'age') {
      filtered.sort((a, b) => b.birthdayInfo.currentAge - a.birthdayInfo.currentAge);
    }
  } else {
    // Default upcoming sort
    filtered.sort((a, b) => a.birthdayInfo.daysRemaining - b.birthdayInfo.daysRemaining);
  }

  // Render HTML
  container.innerHTML = '';
  if (filtered.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');

  filtered.forEach(contact => {
    const info = contact.birthdayInfo;
    const card = document.createElement('div');
    card.className = 'contact-card glass-card rounded-3xl p-5 flex flex-col justify-between space-y-4 border border-slate-200 dark:border-slate-800';

    // Countdown Badge
    let countdownBadge = '';
    if (info.status === 'today') {
      countdownBadge = `<span class="pulse-badge px-3 py-1 rounded-full text-xs font-black bg-rose-500 text-white shadow-md shadow-rose-500/30">🎂 आज वाढदिवस!</span>`;
    } else if (info.status === 'tomorrow') {
      countdownBadge = `<span class="px-3 py-1 rounded-full text-xs font-black bg-amber-500 text-white shadow-md shadow-amber-500/30">⏰ उद्या वाढदिवस</span>`;
    } else {
      countdownBadge = `<span class="px-3 py-1 rounded-full text-xs font-bold bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-300 border border-brand-200 dark:border-brand-800/60">${info.daysRemaining} दिवस बाकी</span>`;
    }

    const marathiDob = formatMarathiDate(contact.dob);
    const catClass = getCategoryBadgeClass(contact.category || 'इतर');

    card.innerHTML = `
      <div class="space-y-3">
        <!-- Card Top Bar -->
        <div class="flex items-start justify-between gap-2">
          <div>
            <div class="flex items-center gap-2">
              <h3 class="text-base font-extrabold text-slate-900 dark:text-slate-100">${contact.name}</h3>
            </div>
            <div class="flex items-center gap-2 mt-1">
              <span class="text-xs px-2.5 py-0.5 rounded-md font-semibold border ${catClass}">${contact.category || 'इतर'}</span>
              ${info.zodiac.name ? `<span class="text-xs text-slate-500 dark:text-slate-400">${info.zodiac.icon} ${info.zodiac.name}</span>` : ''}
            </div>
          </div>
          <div>${countdownBadge}</div>
        </div>

        <!-- Details Grid -->
        <div class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
          <div class="flex items-center justify-between">
            <span class="text-slate-400">📅 जन्मतारीख:</span>
            <span class="font-bold text-slate-800 dark:text-slate-200">${marathiDob}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-slate-400">🎂 वय:</span>
            <span class="font-bold text-slate-800 dark:text-slate-200">${info.currentAge} वर्षे पूर्ण ${info.status !== 'today' ? `(${info.turningAge} वे वर्ष)` : ''}</span>
          </div>
          ${contact.birthPlace || contact.birthTime ? `
            <div class="flex items-center justify-between">
              <span class="text-slate-400">📍 स्थळ/वेळ:</span>
              <span class="font-medium text-slate-700 dark:text-slate-300">${contact.birthPlace || ''} ${contact.birthTime ? `(${contact.birthTime})` : ''}</span>
            </div>
          ` : ''}
          ${contact.mobile ? `
            <div class="flex items-center justify-between">
              <span class="text-slate-400">📱 मोबाईल:</span>
              <a href="tel:${contact.mobile}" class="font-bold text-brand-600 dark:text-brand-400 hover:underline num-font">${contact.mobile}</a>
            </div>
          ` : ''}
          ${contact.notes ? `
            <div class="pt-1 border-t border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 italic">
              📝 ${contact.notes}
            </div>
          ` : ''}
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
        <!-- WhatsApp Wish Button -->
        <button data-action="whatsapp" data-id="${contact.id}" class="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-600/20 transition">
          <span>📱 WhatsApp</span>
        </button>

        <!-- Call Button -->
        ${contact.mobile ? `
          <a href="tel:${contact.mobile}" title="कॉल करा" class="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition">
            <i data-lucide="phone" class="w-4 h-4"></i>
          </a>
        ` : ''}

        <!-- Edit Button -->
        <button data-action="edit" data-id="${contact.id}" title="बदला" class="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition">
          <i data-lucide="edit-3" class="w-4 h-4"></i>
        </button>

        <!-- Delete Button -->
        <button data-action="delete" data-id="${contact.id}" title="काढून टाका" class="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition">
          <i data-lucide="trash-2" class="w-4 h-4"></i>
        </button>
      </div>
    `;

    container.appendChild(card);
  });

  // Re-render Lucide icons for dynamically added cards
  if (window.lucide && window.lucide.createIcons) {
    window.lucide.createIcons();
  }
}

// -------------------------------------------------------------
// WhatsApp Modal Handlers
// -------------------------------------------------------------
function openWhatsAppModal(contact) {
  currentWhatsAppContact = contact;
  const modal = document.getElementById('modalWhatsApp');
  const recipientText = document.getElementById('waModalRecipient');
  const textarea = document.getElementById('txtWaMessage');
  const sendBtn = document.getElementById('btnSendWhatsApp');

  if (!modal || !contact) return;

  recipientText.innerText = `${contact.name} (${contact.mobile || 'नंबर उपलब्ध नाही'})`;
  const info = calculateBirthdayInfo(contact.dob);
  const initialMsg = generateWishMessage(contact.name, info.turningAge, 'formal');
  textarea.value = initialMsg;

  sendBtn.href = getWhatsAppLink(contact.mobile, initialMsg);

  // Reset template buttons
  document.querySelectorAll('.wa-tpl-btn').forEach(btn => {
    if (btn.getAttribute('data-wa-tpl') === 'formal') {
      btn.classList.add('active', 'border-emerald-500', 'bg-emerald-50', 'text-emerald-700');
    } else {
      btn.classList.remove('active', 'border-emerald-500', 'bg-emerald-50', 'text-emerald-700');
    }
  });

  modal.classList.remove('hidden');
}

// -------------------------------------------------------------
// Add / Edit Contact Modal Handlers
// -------------------------------------------------------------
function openContactModal(contact = null) {
  const modal = document.getElementById('modalContact');
  const title = document.getElementById('modalContactTitle');
  const form = document.getElementById('formContact');
  if (!modal || !form) return;

  form.reset();

  if (contact) {
    title.innerText = 'माहिती बदला (Edit Contact)';
    document.getElementById('inputContactId').value = contact.id;
    document.getElementById('inputName').value = contact.name || '';
    document.getElementById('inputDob').value = contact.dob || '';
    document.getElementById('inputBirthTime').value = contact.birthTime || '';
    document.getElementById('inputBirthPlace').value = contact.birthPlace || '';
    document.getElementById('inputMobile').value = contact.mobile || '';
    document.getElementById('inputCategory').value = contact.category || 'मित्र';
    document.getElementById('inputNotes').value = contact.notes || '';
  } else {
    title.innerText = 'नवीन संपर्क माहिती जोडा';
    document.getElementById('inputContactId').value = '';
    document.getElementById('inputCategory').value = 'मित्र';
  }

  modal.classList.remove('hidden');
}

function closeContactModal() {
  const modal = document.getElementById('modalContact');
  if (modal) modal.classList.add('hidden');
}

// -------------------------------------------------------------
// Event Listeners Setup
// -------------------------------------------------------------
function setupEventListeners() {
  // Theme Toggle
  const btnTheme = document.getElementById('btnThemeToggle');
  if (btnTheme) {
    btnTheme.addEventListener('click', () => {
      document.documentElement.classList.toggle('dark');
      const isDark = document.documentElement.classList.contains('dark');
      localStorage.setItem('dob_theme', isDark ? 'dark' : 'light');
    });
  }

  // Restore Theme
  if (localStorage.getItem('dob_theme') === 'dark') {
    document.documentElement.classList.add('dark');
  }

  // Confetti Button
  const btnConfetti = document.getElementById('btnTriggerConfetti');
  if (btnConfetti) {
    btnConfetti.addEventListener('click', triggerConfettiAnimation);
  }

  // Notification Button
  const btnNotif = document.getElementById('btnEnableNotif');
  if (btnNotif) {
    btnNotif.addEventListener('click', async () => {
      const res = await requestNotificationPermission();
      if (res.granted) {
        showToast('सूचना (Notifications) यशस्वीपणे चालू केल्या आहेत! 🔔', 'success');
        checkAndTriggerDailyReminders(allContacts);
      } else {
        showToast('कृपया ब्राउझर सेटिंग्जमधून Notification ची परवानगी द्या.', 'warning');
      }
    });
  }

  // Search input & clear
  const searchInput = document.getElementById('searchInput');
  const btnClearSearch = document.getElementById('btnClearSearch');
  if (searchInput && btnClearSearch) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      if (searchQuery.length > 0) {
        btnClearSearch.classList.remove('hidden');
      } else {
        btnClearSearch.classList.add('hidden');
      }
      renderContacts();
    });

    btnClearSearch.addEventListener('click', () => {
      searchInput.value = '';
      searchQuery = '';
      btnClearSearch.classList.add('hidden');
      renderContacts();
    });
  }

  // Category pills
  document.querySelectorAll('.cat-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.cat-pill').forEach(p => {
        p.classList.remove('active', 'border-brand-500', 'bg-brand-500', 'text-white');
        p.classList.add('border-slate-200', 'dark:border-slate-800', 'bg-white', 'dark:bg-slate-900', 'text-slate-600', 'dark:text-slate-300');
      });
      pill.classList.add('active', 'border-brand-500', 'bg-brand-500', 'text-white');
      pill.classList.remove('border-slate-200', 'dark:border-slate-800', 'bg-white', 'dark:bg-slate-900', 'text-slate-600', 'dark:text-slate-300');
      currentCategory = pill.getAttribute('data-category');
      renderContacts();
    });
  });

  // Sort select
  const selectSort = document.getElementById('selectSort');
  if (selectSort) {
    selectSort.addEventListener('change', (e) => {
      currentSort = e.target.value;
      renderContacts();
    });
  }

  // Add Contact Buttons
  ['btnOpenAddModalDesk', 'btnOpenAddModalMob', 'btnEmptyAdd'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', () => openContactModal(null));
  });

  // Close Contact Modal
  const btnCloseContact = document.getElementById('btnCloseContactModal');
  const btnCancelContact = document.getElementById('btnCancelContact');
  if (btnCloseContact) btnCloseContact.addEventListener('click', closeContactModal);
  if (btnCancelContact) btnCancelContact.addEventListener('click', closeContactModal);

  // Save Contact Form Submit
  const formContact = document.getElementById('formContact');
  if (formContact) {
    formContact.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('inputContactId').value;
      const contactData = {
        name: document.getElementById('inputName').value.trim(),
        dob: document.getElementById('inputDob').value,
        birthTime: document.getElementById('inputBirthTime').value.trim(),
        birthPlace: document.getElementById('inputBirthPlace').value.trim(),
        mobile: document.getElementById('inputMobile').value.trim(),
        category: document.getElementById('inputCategory').value,
        notes: document.getElementById('inputNotes').value.trim()
      };

      if (!contactData.name || !contactData.dob) {
        showToast('कृपया नाव आणि जन्मतारीख भरा!', 'warning');
        return;
      }

      try {
        const uid = activeUser ? activeUser.uid : 'demo_user_123';
        if (id) {
          await updateContact(uid, id, contactData);
          showToast('नोंद यशस्वीपणे बदलली! ✏️', 'success');
        } else {
          await addContact(uid, contactData);
          showToast('नवीन संपर्क यशस्वीपणे जतन केला! 🎉', 'success');
        }
        closeContactModal();
      } catch (err) {
        console.error('Error saving contact:', err);
        showToast('त्रुटी आली, कृपया पुन्हा प्रयत्न करा.', 'error');
      }
    });
  }

  // Contact list card action delegation (WhatsApp, Edit, Delete)
  const contactsContainer = document.getElementById('contactsContainer');
  if (contactsContainer) {
    contactsContainer.addEventListener('click', (e) => {
      const button = e.target.closest('button[data-action]');
      if (!button) return;

      const action = button.getAttribute('data-action');
      const id = button.getAttribute('data-id');
      const contact = allContacts.find(c => c.id === id);
      if (!contact) return;

      if (action === 'whatsapp') {
        openWhatsAppModal(contact);
      } else if (action === 'edit') {
        openContactModal(contact);
      } else if (action === 'delete') {
        contactToDeleteId = id;
        const modalDel = document.getElementById('modalDelete');
        const promptText = document.getElementById('txtDeletePrompt');
        if (promptText) {
          promptText.innerText = `तुम्हाला '${contact.name}' ही नोंद कायमची काढून टाकायची आहे का?`;
        }
        if (modalDel) modalDel.classList.remove('hidden');
      }
    });
  }

  // Delete Modal Actions
  const btnCancelDel = document.getElementById('btnCancelDelete');
  const btnConfirmDel = document.getElementById('btnConfirmDelete');
  const modalDel = document.getElementById('modalDelete');
  if (btnCancelDel) {
    btnCancelDel.addEventListener('click', () => modalDel.classList.add('hidden'));
  }
  if (btnConfirmDel) {
    btnConfirmDel.addEventListener('click', async () => {
      if (contactToDeleteId) {
        const uid = activeUser ? activeUser.uid : 'demo_user_123';
        await deleteContact(uid, contactToDeleteId);
        showToast('नोंद काढून टाकली.', 'info');
        modalDel.classList.add('hidden');
        contactToDeleteId = null;
      }
    });
  }

  // WhatsApp Modal Buttons
  const btnCloseWa = document.getElementById('btnCloseWaModal');
  const btnCloseWa2 = document.getElementById('btnCloseWaModal2');
  const modalWa = document.getElementById('modalWhatsApp');
  if (btnCloseWa) btnCloseWa.addEventListener('click', () => modalWa.classList.add('hidden'));
  if (btnCloseWa2) btnCloseWa2.addEventListener('click', () => modalWa.classList.add('hidden'));

  // Template switch in WhatsApp modal
  document.querySelectorAll('.wa-tpl-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.wa-tpl-btn').forEach(b => {
        b.classList.remove('active', 'border-emerald-500', 'bg-emerald-50', 'text-emerald-700');
      });
      btn.classList.add('active', 'border-emerald-500', 'bg-emerald-50', 'text-emerald-700');

      const tplKey = btn.getAttribute('data-wa-tpl');
      if (currentWhatsAppContact) {
        const info = calculateBirthdayInfo(currentWhatsAppContact.dob);
        const msg = generateWishMessage(currentWhatsAppContact.name, info.turningAge, tplKey);
        document.getElementById('txtWaMessage').value = msg;
        document.getElementById('btnSendWhatsApp').href = getWhatsAppLink(currentWhatsAppContact.mobile, msg);
      }
    });
  });

  // Sync edited textarea in WhatsApp modal with Send Link
  const txtWa = document.getElementById('txtWaMessage');
  if (txtWa) {
    txtWa.addEventListener('input', (e) => {
      if (currentWhatsAppContact) {
        document.getElementById('btnSendWhatsApp').href = getWhatsAppLink(currentWhatsAppContact.mobile, e.target.value);
      }
    });
  }

  // Copy WhatsApp Message
  const btnCopyMsg = document.getElementById('btnCopyWaMsg');
  if (btnCopyMsg) {
    btnCopyMsg.addEventListener('click', async () => {
      const text = document.getElementById('txtWaMessage').value;
      const ok = await copyToClipboard(text);
      if (ok) {
        showToast('संदेश कॉपी झाला! 📋', 'success');
      }
    });
  }

  // Settings Modal Handlers
  const modalSettings = document.getElementById('modalSettings');
  const btnOpenSettings = document.getElementById('btnOpenSettings');
  const btnCloseSettings = document.getElementById('btnCloseSettingsModal');
  if (btnOpenSettings) {
    btnOpenSettings.addEventListener('click', () => {
      const cfg = getStoredFirebaseConfig();
      const txtCfg = document.getElementById('txtFirebaseConfig');
      if (txtCfg && cfg) {
        txtCfg.value = JSON.stringify(cfg, null, 2);
      }
      modalSettings.classList.remove('hidden');
    });
  }
  if (btnCloseSettings) {
    btnCloseSettings.addEventListener('click', () => modalSettings.classList.add('hidden'));
  }

  // Save Firebase Config
  const btnSaveCfg = document.getElementById('btnSaveFirebaseCfg');
  if (btnSaveCfg) {
    btnSaveCfg.addEventListener('click', () => {
      const raw = document.getElementById('txtFirebaseConfig').value.trim();
      if (!raw) {
        showToast('कृपया Firebase Config JSON भरा.', 'warning');
        return;
      }
      try {
        const parsed = JSON.parse(raw);
        saveStoredFirebaseConfig(parsed);
        showToast('Firebase सेव्ह झाले! ॲप रीलोड होत आहे...', 'success');
        setTimeout(() => window.location.reload(), 1200);
      } catch (err) {
        showToast('अवैध JSON फॉरमॅट! कृपया अचूक कोड पेस्ट करा.', 'error');
      }
    });
  }

  // Clear Firebase Config
  const btnClearCfg = document.getElementById('btnClearFirebaseCfg');
  if (btnClearCfg) {
    btnClearCfg.addEventListener('click', () => {
      clearStoredFirebaseConfig();
      showToast('Firebase रीसेट झाले. डेमो मोड सुरू आहे.', 'info');
      setTimeout(() => window.location.reload(), 1000);
    });
  }

  // Export CSV / JSON
  const btnExpCSV = document.getElementById('btnExportCSV');
  const btnExpJSON = document.getElementById('btnExportJSON');
  if (btnExpCSV) btnExpCSV.addEventListener('click', () => exportContactsToCSV(allContacts));
  if (btnExpJSON) btnExpJSON.addEventListener('click', () => exportContactsToJSON(allContacts));

  // Import CSV
  const inputImport = document.getElementById('inputImportCSV');
  if (inputImport) {
    inputImport.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const imported = parseCSVContacts(evt.target.result);
          if (imported.length === 0) {
            showToast('फायलीमध्ये योग्य संपर्क सापडले नाहीत.', 'warning');
            return;
          }
          const uid = activeUser ? activeUser.uid : 'demo_user_123';
          for (const c of imported) {
            await addContact(uid, c);
          }
          showToast(`${imported.length} संपर्क यशस्वीपणे इम्पोर्ट झाले! 🎉`, 'success');
          modalSettings.classList.add('hidden');
        } catch (err) {
          console.error('Import error:', err);
          showToast('इम्पोर्ट करताना अडचण आली.', 'error');
        }
      };
      reader.readAsText(file);
    });
  }
}

// -------------------------------------------------------------
// Initialization
// -------------------------------------------------------------
async function initApp() {
  setupEventListeners();

  // Expose BirthdayEngine for notifications module
  window.BirthdayEngine = { calculateBirthdayInfo };

  // Initialize Firebase (or Demo Mode)
  const { isDemo } = await initializeFirebase();
  const statusPill = document.getElementById('btnConnectionStatus');
  const statusText = document.getElementById('txtConnectionStatus');
  const badgeStatus = document.getElementById('badgeFirebaseStatus');

  if (!isDemo) {
    if (statusText) statusText.innerText = 'Firebase Live 🔥';
    if (statusPill) {
      statusPill.className = 'flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300';
    }
    if (badgeStatus) {
      badgeStatus.innerText = 'Firebase Live जोडले आहे';
      badgeStatus.className = 'text-xs px-2 py-0.5 rounded-md font-bold bg-emerald-200 text-emerald-800';
    }
  } else {
    if (statusText) statusText.innerText = 'डेमो मोड (स्थानिक)';
  }

  // Listen to Auth State
  onAuthStateChanged((user) => {
    activeUser = user;
    const uid = user ? user.uid : 'demo_user_123';

    // Real-time listener for contacts
    subscribeToContacts(uid, (contacts) => {
      allContacts = contacts || [];
      renderContacts();
      checkAndTriggerDailyReminders(allContacts);
    });
  });

  // Register Service Worker for PWA
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').then((reg) => {
        console.log('Service Worker Registered successfully:', reg.scope);
      }).catch((err) => {
        console.log('SW registration note:', err);
      });
    });
  }

  // Initial render with default tab
  window.switchTab('today');
}

// Start application
initApp();
