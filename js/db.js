// Database Operations - Firestore with LocalStorage Demo Fallback
import { isDemoMode, firestoreDb } from './firebase-config.js';

const DEMO_CONTACTS_KEY = 'dob_reminder_demo_contacts_v1';
const DEMO_SETTINGS_KEY = 'dob_reminder_demo_settings_v1';

// Seed sample contacts for initial demo
const SAMPLE_CONTACTS = [
  {
    id: 'demo_1',
    name: 'अमोल पाटील (Amol Patil)',
    dob: '1992-09-17', // Today!
    birthTime: '10:30 AM',
    birthPlace: 'पुणे',
    mobile: '9822012345',
    category: 'मित्र',
    notes: 'शालेय मित्र, इंजिनिअर',
    createdAt: new Date().toISOString()
  },
  {
    id: 'demo_2',
    name: 'राहुल शिंदे (Rahul Shinde)',
    dob: '1995-09-18', // Tomorrow!
    birthTime: '06:15 PM',
    birthPlace: 'सातारा',
    mobile: '9822198765',
    category: 'कुटुंब',
    notes: 'मावसभाऊ',
    createdAt: new Date().toISOString()
  },
  {
    id: 'demo_3',
    name: 'प्रिया कुलकर्णी (Priya Kulkarni)',
    dob: '1998-09-25', // Later this month
    birthTime: '02:45 PM',
    birthPlace: 'मुंबई',
    mobile: '9822334455',
    category: 'सहकारी',
    notes: 'ऑफिस टीम लीड',
    createdAt: new Date().toISOString()
  },
  {
    id: 'demo_4',
    name: 'सुनील जोशी (Sunil Joshi)',
    dob: '1985-10-05', // Next month
    birthTime: '09:00 AM',
    birthPlace: 'नाशिक',
    mobile: '9822556677',
    category: 'नातेवाईक',
    notes: 'काका',
    createdAt: new Date().toISOString()
  }
];

// Helper to get local demo contacts
function getLocalContacts() {
  try {
    const raw = localStorage.getItem(DEMO_CONTACTS_KEY);
    if (!raw) {
      localStorage.setItem(DEMO_CONTACTS_KEY, JSON.stringify(SAMPLE_CONTACTS));
      return SAMPLE_CONTACTS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return SAMPLE_CONTACTS;
  }
}

function saveLocalContacts(contacts) {
  localStorage.setItem(DEMO_CONTACTS_KEY, JSON.stringify(contacts));
  window.dispatchEvent(new Event('dob_contacts_updated'));
}

// ----------------------------------------------------
// Public Database API
// ----------------------------------------------------

export function subscribeToContacts(userId, callback) {
  if (isDemoMode || !firestoreDb || !userId) {
    // Return Local Contacts immediately
    callback(getLocalContacts());

    // Listen for custom event on local storage changes
    const listener = () => callback(getLocalContacts());
    window.addEventListener('dob_contacts_updated', listener);
    return () => window.removeEventListener('dob_contacts_updated', listener);
  }

  // Live Firestore Listener
  import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js').then(({ collection, query, onSnapshot, orderBy }) => {
    const contactsRef = collection(firestoreDb, 'users', userId, 'contacts');
    const q = query(contactsRef, orderBy('createdAt', 'desc'));

    return onSnapshot(q, (snapshot) => {
      const contacts = [];
      snapshot.forEach(doc => {
        contacts.push({ id: doc.id, ...doc.data() });
      });
      callback(contacts);
    }, (err) => {
      console.error('Firestore snapshot error:', err);
      // Fallback to local
      callback(getLocalContacts());
    });
  }).catch(err => {
    console.error('Error importing firestore:', err);
    callback(getLocalContacts());
  });
}

export async function addContact(userId, contactData) {
  const newContact = {
    ...contactData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (isDemoMode || !firestoreDb || !userId) {
    const contacts = getLocalContacts();
    newContact.id = 'demo_' + Date.now();
    contacts.unshift(newContact);
    saveLocalContacts(contacts);
    return newContact;
  }

  const { collection, addDoc } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
  const contactsRef = collection(firestoreDb, 'users', userId, 'contacts');
  const docRef = await addDoc(contactsRef, newContact);
  return { id: docRef.id, ...newContact };
}

export async function updateContact(userId, contactId, contactData) {
  const updatedData = {
    ...contactData,
    updatedAt: new Date().toISOString()
  };

  if (isDemoMode || !firestoreDb || !userId) {
    let contacts = getLocalContacts();
    contacts = contacts.map(c => c.id === contactId ? { ...c, ...updatedData } : c);
    saveLocalContacts(contacts);
    return true;
  }

  const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
  const contactDocRef = doc(firestoreDb, 'users', userId, 'contacts', contactId);
  await updateDoc(contactDocRef, updatedData);
  return true;
}

export async function deleteContact(userId, contactId) {
  if (isDemoMode || !firestoreDb || !userId) {
    let contacts = getLocalContacts();
    contacts = contacts.filter(c => c.id !== contactId);
    saveLocalContacts(contacts);
    return true;
  }

  const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
  const contactDocRef = doc(firestoreDb, 'users', userId, 'contacts', contactId);
  await deleteDoc(contactDocRef);
  return true;
}

export function getPreferences() {
  try {
    const raw = localStorage.getItem(DEMO_SETTINGS_KEY);
    return raw ? JSON.parse(raw) : {
      notificationTime: '09:00',
      notify1DayBefore: true,
      notifyOnBirthday: true,
      defaultTemplate: 'formal',
      darkMode: false
    };
  } catch (e) {
    return {
      notificationTime: '09:00',
      notify1DayBefore: true,
      notifyOnBirthday: true,
      defaultTemplate: 'formal',
      darkMode: false
    };
  }
}

export function savePreferences(prefs) {
  localStorage.setItem(DEMO_SETTINGS_KEY, JSON.stringify(prefs));
}
