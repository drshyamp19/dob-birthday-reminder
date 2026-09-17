// Firebase Authentication & Demo User Management
import { isDemoMode, firebaseAuth } from './firebase-config.js';

let currentUser = null;
let authListeners = [];

export function getCurrentUser() {
  if (isDemoMode || !firebaseAuth) {
    return {
      uid: 'demo_user_123',
      displayName: 'स्थानिक युजर (Demo User)',
      email: 'demo@example.com',
      photoURL: null,
      isDemo: true
    };
  }
  return currentUser;
}

export function onAuthStateChanged(callback) {
  authListeners.push(callback);

  if (isDemoMode || !firebaseAuth) {
    callback(getCurrentUser());
    return () => {
      authListeners = authListeners.filter(cb => cb !== callback);
    };
  }

  import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js').then(({ onAuthStateChanged: firebaseOnAuth }) => {
    firebaseOnAuth(firebaseAuth, (user) => {
      currentUser = user;
      callback(user);
    });
  });

  return () => {
    authListeners = authListeners.filter(cb => cb !== callback);
  };
}

export async function signInWithGoogle() {
  if (isDemoMode || !firebaseAuth) {
    alert('सध्या ॲप डेमो मोडमध्ये आहे. लाईव्ह Google लॉगिनसाठी Settings मधून Firebase Config जोडा.');
    return getCurrentUser();
  }

  const { GoogleAuthProvider, signInWithPopup } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(firebaseAuth, provider);
  return result.user;
}

export async function signInWithEmail(email, password) {
  if (isDemoMode || !firebaseAuth) {
    alert('सध्या ॲप डेमो मोडमध्ये आहे. लाईव्ह लॉगिनसाठी Settings मधून Firebase Config जोडा.');
    return getCurrentUser();
  }

  const { signInWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');
  const result = await signInWithEmailAndPassword(firebaseAuth, email, password);
  return result.user;
}

export async function signUpWithEmail(email, password, displayName) {
  if (isDemoMode || !firebaseAuth) {
    alert('सध्या ॲप डेमो मोडमध्ये आहे. लाईव्ह रजिस्ट्रेशनसाठी Settings मधून Firebase Config जोडा.');
    return getCurrentUser();
  }

  const { createUserWithEmailAndPassword, updateProfile } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');
  const result = await createUserWithEmailAndPassword(firebaseAuth, email, password);
  if (displayName) {
    await updateProfile(result.user, { displayName });
  }
  return result.user;
}

export async function logOut() {
  if (isDemoMode || !firebaseAuth) {
    console.log('Demo user logged out');
    return true;
  }

  const { signOut } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');
  await signOut(firebaseAuth);
  return true;
}
