import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let isInitialized = false;

export const initFirebaseAdmin = () => {
  if (isInitialized) return;

  try {
    let serviceAccount;
    
    // First try to load from environment variable (for Render/production)
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } else {
      // Fallback to local file
      const serviceAccountPath = path.join(__dirname, '..', 'doceditor-4c664-firebase-adminsdk-fbsvc-6191fb70c7.json');
      if (fs.existsSync(serviceAccountPath)) {
        serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      }
    }

    if (serviceAccount) {
      initializeApp({
        credential: cert(serviceAccount)
      });
      isInitialized = true;
      console.log('Firebase Admin SDK initialized successfully.');
    } else {
      console.warn('Firebase Service Account JSON/ENV not found. Admin SDK will not be initialized.');
    }
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
  }
};

export const deleteUserFromFirebase = async (email) => {
  if (!isInitialized) {
    console.warn('Cannot delete from Firebase: Admin SDK not initialized');
    return false;
  }
  
  try {
    const userRecord = await getAuth().getUserByEmail(email);
    await getAuth().deleteUser(userRecord.uid);
    console.log(`Successfully deleted user with email ${email} from Firebase Auth.`);
    return true;
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.log(`User with email ${email} not found in Firebase Auth, skipping deletion.`);
      return true; // Consider it a success if they are already not there
    }
    console.error('Error deleting user from Firebase:', error);
    return false;
  }
};
