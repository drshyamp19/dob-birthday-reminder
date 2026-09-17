// Firebase Configuration & Initialization
// Supports both Real Firebase (Auth + Firestore) and Local Demo Mode

const STORAGE_KEY_CONFIG = 'dob_reminder_firebase_cfg';
const STORAGE_KEY_DEMO = 'dob_reminder_demo_mode';

// Default Demo State
let firebaseApp = null;
let firebaseAuth = null;
let firestoreDb = null;
let isDemoMode = true;

// Get stored config if exists
export function getStoredFirebaseConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function saveStoredFirebaseConfig(config) {
  try {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
    localStorage.removeItem(STORAGE_KEY_DEMO);
    return true;
  } catch (e) {
    console.error('Error saving firebase config:', e);
    return false;
  }
}

export function clearStoredFirebaseConfig() {
  localStorage.removeItem(STORAGE_KEY_CONFIG);
  localStorage.setItem(STORAGE_KEY_DEMO, 'true');
}

export async function initializeFirebase() {
  const config = getStoredFirebaseConfig();

  if (config && config.apiKey && config.projectId) {
    try {
      // Dynamic import Firebase SDK v10 from gstatic CDN
      const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js');
      const { getAuth } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');
      const { getFirestore } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');

      firebaseApp = initializeApp(config);
      firebaseAuth = getAuth(firebaseApp);
      firestoreDb = getFirestore(firebaseApp);
      isDemoMode = false;

      console.log('🔥 Connected to Live Firebase successfully!');
      return { app: firebaseApp, auth: firebaseAuth, db: firestoreDb, isDemo: false };
    } catch (err) {
      console.warn('Firebase init failed, switching to Demo Mode:', err);
      isDemoMode = true;
    }
  } else {
    isDemoMode = true;
    console.log('ℹ️ Running in Demo Mode (Local Storage). Connect Firebase anytime in Settings.');
  }

  return { app: null, auth: null, db: null, isDemo: true };
}

export { firebaseApp, firebaseAuth, firestoreDb, isDemoMode };
