// Web Notifications & Daily Reminder Scheduler

const LAST_NOTIF_KEY = 'dob_reminder_last_notified_date';

export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    return { supported: false, granted: false };
  }

  if (Notification.permission === 'granted') {
    return { supported: true, granted: true };
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return { supported: true, granted: permission === 'granted' };
  }

  return { supported: true, granted: false };
}

export function isNotificationSupported() {
  return 'Notification' in window;
}

export function isNotificationGranted() {
  return 'Notification' in window && Notification.permission === 'granted';
}

export function showBrowserNotification(title, options = {}) {
  if (!isNotificationGranted()) return;

  const defaultOptions = {
    icon: 'assets/icons/icon-192.svg',
    badge: 'assets/icons/icon-192.svg',
    vibrate: [200, 100, 200],
    requireInteraction: false,
    ...options
  };

  try {
    if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, defaultOptions);
      });
    } else {
      new Notification(title, defaultOptions);
    }
  } catch (err) {
    console.warn('Error showing notification:', err);
  }
}

export function checkAndTriggerDailyReminders(contacts = []) {
  if (!isNotificationGranted() || !contacts || contacts.length === 0) return;

  const todayStr = new Date().toISOString().split('T')[0];
  const lastNotified = localStorage.getItem(LAST_NOTIF_KEY);

  // Avoid spamming multiple times in a single day
  if (lastNotified === todayStr) {
    return;
  }

  const { calculateBirthdayInfo } = window.BirthdayEngine || {};
  if (!calculateBirthdayInfo) return;

  const todayBirthdays = [];
  const tomorrowBirthdays = [];

  contacts.forEach(contact => {
    const info = calculateBirthdayInfo(contact.dob);
    if (info.daysRemaining === 0) {
      todayBirthdays.push(contact);
    } else if (info.daysRemaining === 1) {
      tomorrowBirthdays.push(contact);
    }
  });

  // Notify today's birthdays
  if (todayBirthdays.length > 0) {
    const names = todayBirthdays.map(c => c.name).join(', ');
    showBrowserNotification(`🎂 आज वाढदिवस आहे!`, {
      body: `आज ${names} यांचा वाढदिवस आहे. व्हॉट्सॲपवर शुभेच्छा पाठवा! 🎉`,
      tag: 'today-birthday'
    });
  }

  // Notify tomorrow's birthdays
  if (tomorrowBirthdays.length > 0) {
    const names = tomorrowBirthdays.map(c => c.name).join(', ');
    showBrowserNotification(`⏰ उद्याचा वाढदिवस स्मरण!`, {
      body: `उद्या ${names} यांचा वाढदिवस आहे 🎂. तयारी ठेवा!`,
      tag: 'tomorrow-birthday'
    });
  }

  localStorage.setItem(LAST_NOTIF_KEY, todayStr);
}
