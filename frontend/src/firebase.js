import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  FacebookAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyC_sS7B4sUof50LbM0aoBy1DWBpSYWp7qg",
  authDomain: "doceditor-4c664.firebaseapp.com",
  projectId: "doceditor-4c664",
  storageBucket: "doceditor-4c664.firebasestorage.app",
  messagingSenderId: "893235858399",
  appId: "1:893235858399:web:41280f0f056b78282f926a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Google Provider — opens official Google login page
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Facebook Provider — opens official Facebook login page
const facebookProvider = new FacebookAuthProvider();
facebookProvider.addScope('email');
facebookProvider.addScope('public_profile');

export { auth, googleProvider, facebookProvider, getRedirectResult };

export const initFirebase = () => Promise.resolve(auth);
export const getFirebaseAuth = () => Promise.resolve(auth);

// ───────────────────────────────────────────────
// Social Sign-In via Redirect (opens official pages)
// ───────────────────────────────────────────────

/**
 * Redirects to Google's official login page.
 * On return, call getFirebaseRedirectResult() to get the credential.
 */
export const firebaseSignInWithGoogle = () =>
  signInWithRedirect(auth, googleProvider);

/**
 * Redirects to Facebook's official login page.
 * On return, call getFirebaseRedirectResult() to get the credential.
 */
export const firebaseSignInWithFacebook = () =>
  signInWithRedirect(auth, facebookProvider);

/**
 * Reads the result after a redirect-based sign-in completes.
 * Returns null if no redirect happened.
 */
export const getFirebaseRedirectResult = () => getRedirectResult(auth);

// ───────────────────────────────────────────────
// Instagram OAuth (direct, without Firebase)
// ───────────────────────────────────────────────
// Instagram uses a separate OAuth flow via the Instagram Basic Display API.
// The user is redirected to Instagram's official login/authorize page.
// When they approve, Instagram redirects back to /instagram-callback with a `code`.
// The backend then exchanges the code for an access token.

export const startInstagramOAuth = () => {
  const INSTAGRAM_APP_ID = import.meta.env.VITE_INSTAGRAM_APP_ID;
  const REDIRECT_URI = encodeURIComponent(`${window.location.origin}/instagram-callback`);
  const SCOPE = 'user_profile,user_media';
  const STATE = btoa(JSON.stringify({ ts: Date.now(), origin: window.location.origin }));

  if (!INSTAGRAM_APP_ID) {
    console.warn('[Instagram OAuth] VITE_INSTAGRAM_APP_ID not set in frontend .env');
    // Open Instagram's generic login page if no app ID configured
    window.open('https://www.instagram.com/accounts/login/', '_blank', 'width=500,height=700');
    return;
  }

  const url = `https://api.instagram.com/oauth/authorize?client_id=${INSTAGRAM_APP_ID}&redirect_uri=${REDIRECT_URI}&scope=${SCOPE}&response_type=code&state=${STATE}`;
  window.location.href = url;
};

// ───────────────────────────────────────────────
// Email/Password Auth helpers
// ───────────────────────────────────────────────

export const firebaseSignInWithEmail = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

export const firebaseCreateWithEmail = async (email, password) => {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await sendEmailVerification(credential.user);
  return credential;
};

export const firebasePasswordReset = (email) =>
  sendPasswordResetEmail(auth, email);

export const firebaseSignOut = () => signOut(auth);

export const getIdToken = (firebaseUser) => firebaseUser.getIdToken(true);
