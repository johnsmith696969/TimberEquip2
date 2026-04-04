import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

const PUBLIC_FALLBACK_FIREBASE_CONFIG = {
  apiKey: 'AIzaSyChC_87Qt3KNzsiV9v4Nkz2kIXd9QZ60XQ',
  projectId: 'mobile-app-equipment-sales',
  appId: '1:547811102681:web:3065d1745c6b8dac4993c8',
  authDomain: 'mobile-app-equipment-sales.firebaseapp.com',
  storageBucket: 'mobile-app-equipment-sales.firebasestorage.app',
  messagingSenderId: '547811102681',
  measurementId: '',
  firestoreDatabaseId: '(default)',
} as const;

function resolveFirebaseConfigValue(value: unknown, fallback = ''): string {
  const normalized = String(value || '').trim();
  return normalized || fallback;
}

const resolvedFirebaseConfig = {
  apiKey: resolveFirebaseConfigValue(import.meta.env.VITE_FIREBASE_API_KEY, firebaseConfig.apiKey || PUBLIC_FALLBACK_FIREBASE_CONFIG.apiKey),
  projectId: resolveFirebaseConfigValue(import.meta.env.VITE_FIREBASE_PROJECT_ID, firebaseConfig.projectId || PUBLIC_FALLBACK_FIREBASE_CONFIG.projectId),
  appId: resolveFirebaseConfigValue(import.meta.env.VITE_FIREBASE_APP_ID, firebaseConfig.appId || PUBLIC_FALLBACK_FIREBASE_CONFIG.appId),
  authDomain: resolveFirebaseConfigValue(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN, firebaseConfig.authDomain || PUBLIC_FALLBACK_FIREBASE_CONFIG.authDomain),
  storageBucket: resolveFirebaseConfigValue(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET, firebaseConfig.storageBucket || PUBLIC_FALLBACK_FIREBASE_CONFIG.storageBucket),
  messagingSenderId: resolveFirebaseConfigValue(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID, firebaseConfig.messagingSenderId || PUBLIC_FALLBACK_FIREBASE_CONFIG.messagingSenderId),
  measurementId: resolveFirebaseConfigValue(import.meta.env.VITE_FIREBASE_MEASUREMENT_ID, firebaseConfig.measurementId || PUBLIC_FALLBACK_FIREBASE_CONFIG.measurementId),
  firestoreDatabaseId: resolveFirebaseConfigValue(import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID, firebaseConfig.firestoreDatabaseId || PUBLIC_FALLBACK_FIREBASE_CONFIG.firestoreDatabaseId),
};

if (!resolvedFirebaseConfig.apiKey) {
  throw new Error('Missing Firebase web API key. Provide VITE_FIREBASE_API_KEY or configure a local .firebase-web-config.local.json for environment-aware builds.');
}

export const app = initializeApp({
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
