import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut
} from 'firebase/auth';

// Firebase config fetched from backend so keys stay server-side
// Falls back to env vars if available, otherwise fetches from server
const firebaseConfig = {
  apiKey: "AIzaSyC_sS7B4sUof50LbM0aoBy1DWBpSYWp7qg",
  authDomain: "doceditor-4c664.firebaseapp.com",
  projectId: "doceditor-4c664",
  storageBucket: "doceditor-4c664.firebasestorage.app",
  messagingSenderId: "893235858399",
  appId: "1:893235858399:web:41280f0f056b78282f926a"
};

// Initialize immediately (synchronous)
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export { auth };

export const initFirebase = () => Promise.resolve(auth);

export const getFirebaseAuth = () => Promise.resolve(auth);

export const firebaseSignInWithEmail = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

export const firebaseCreateWithEmail = async (email, password) => {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await sendEmailVerification(credential.user);
  return credential;
};

export const firebaseSignInWithGoogle = () =>
  signInWithPopup(auth, googleProvider);

export const firebasePasswordReset = (email) =>
  sendPasswordResetEmail(auth, email);

export const firebaseSignOut = () => signOut(auth);

export const getIdToken = (firebaseUser) => firebaseUser.getIdToken(true);
