import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

function resolveFirebaseConfigValue(value: unknown, fallback = ''): string {
  const normalized = String(value || '').trim();
  return normalized || fallback;
}

const resolvedFirebaseConfig = {
  apiKey: resolveFirebaseConfigValue(import.meta.env.VITE_FIREBASE_API_KEY, firebaseConfig.apiKey),
  projectId: resolveFirebaseConfigValue(import.meta.env.VITE_FIREBASE_PROJECT_ID, firebaseConfig.projectId),
  appId: resolveFirebaseConfigValue(import.meta.env.VITE_FIREBASE_APP_ID, firebaseConfig.appId),
  authDomain: resolveFirebaseConfigValue(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN, firebaseConfig.authDomain),
  storageBucket: resolveFirebaseConfigValue(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET, firebaseConfig.storageBucket),
  messagingSenderId: resolveFirebaseConfigValue(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID, firebaseConfig.messagingSenderId),
  measurementId: resolveFirebaseConfigValue(import.meta.env.VITE_FIREBASE_MEASUREMENT_ID, firebaseConfig.measurementId || ''),
  firestoreDatabaseId: resolveFirebaseConfigValue(import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID, firebaseConfig.firestoreDatabaseId || '(default)'),
};

if (!resolvedFirebaseConfig.apiKey) {
  throw new Error('Missing Firebase web API key. Provide VITE_FIREBASE_API_KEY or add apiKey to firebase-applet-config.json.');
}

const app = initializeApp({
  apiKey: resolvedFirebaseConfig.apiKey,
  projectId: resolvedFirebaseConfig.projectId,
  appId: resolvedFirebaseConfig.appId,
  authDomain: resolvedFirebaseConfig.authDomain,
  storageBucket: resolvedFirebaseConfig.storageBucket,
  messagingSenderId: resolvedFirebaseConfig.messagingSenderId,
  measurementId: resolvedFirebaseConfig.measurementId || undefined,
});
export const db = getFirestore(app, resolvedFirebaseConfig.firestoreDatabaseId);
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
