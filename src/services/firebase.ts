import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, doc, getDocFromServer } from 'firebase/firestore';
import { FirestoreErrorInfo, OperationType } from '../types/stock';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || '(default)',
};

export const isLiveFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== 'MY_FIREBASE_API_KEY' &&
  firebaseConfig.projectId
);

let primaryApp: FirebaseApp | null = null;
let primaryAuth: Auth | null = null;
let primaryDb: Firestore | null = null;

const SECONDARY_APP_NAME = 'StockLineSecondaryUserCreator';

if (isLiveFirebaseConfigured) {
  primaryApp = getApps().find((a) => a.name === '[DEFAULT]') || initializeApp(firebaseConfig);
  primaryAuth = getAuth(primaryApp);
  primaryDb = getFirestore(primaryApp, firebaseConfig.firestoreDatabaseId);
}

export const app = primaryApp;
export const auth = primaryAuth;
export const db = primaryDb;

export function getSecondaryAuth(): Auth | null {
  if (!isLiveFirebaseConfigured) return null;
  const existingSecondary = getApps().find((a) => a.name === SECONDARY_APP_NAME);
  const secondaryApp = existingSecondary || initializeApp(firebaseConfig, SECONDARY_APP_NAME);
  return getAuth(secondaryApp);
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const currentUser = primaryAuth?.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    authInfo: {
      userId: currentUser?.uid ?? null,
      email: currentUser?.email ?? null,
      emailVerified: currentUser?.emailVerified ?? null,
      isAnonymous: currentUser?.isAnonymous ?? null,
      tenantId: currentUser?.tenantId ?? null,
      providerInfo:
        currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function validateFirestoreConnection(): Promise<void> {
  if (!isLiveFirebaseConfigured || !primaryDb) return;
  try {
    await getDocFromServer(doc(primaryDb, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is currently offline or unreachable.');
    }
  }
}
