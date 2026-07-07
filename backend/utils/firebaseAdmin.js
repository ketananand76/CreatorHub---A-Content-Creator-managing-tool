import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let isInitialized = false;

export const initFirebaseAdmin = () => {
  if (isInitialized) return;

  try {
    // Try to load the service account JSON file
    const serviceAccountPath = path.join(__dirname, '..', 'doceditor-4c664-firebase-adminsdk-fbsvc-6191fb70c7.json');
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      isInitialized = true;
      console.log('Firebase Admin SDK initialized successfully.');
    } else {
      console.warn('Firebase Service Account JSON not found. Admin SDK will not be initialized.');
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
    const userRecord = await admin.auth().getUserByEmail(email);
    await admin.auth().deleteUser(userRecord.uid);
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
