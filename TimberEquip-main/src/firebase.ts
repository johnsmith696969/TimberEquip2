import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

const firebaseApiKey = import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey;

if (!firebaseApiKey) {
  throw new Error('Missing Firebase web API key. Provide VITE_FIREBASE_API_KEY or add apiKey to firebase-applet-config.json.');
}

const app = initializeApp({
  ...firebaseConfig,
  apiKey: firebaseApiKey,
});
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Test connection
async function testConnection() {
  try {
    await getDocFromServer(doc(db, '_test_', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();
