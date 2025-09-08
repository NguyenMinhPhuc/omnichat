
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminApp: App;
let db: Firestore;

// This function ensures the Firebase Admin SDK is initialized only once.
export function getAdminDb(): Firestore {
  if (getApps().length === 0) {
    // When GOOGLE_APPLICATION_CREDENTIALS is set, initializeApp() will use it automatically.
    adminApp = initializeApp();
  } else {
    adminApp = getApps()[0];
  }
  db = getFirestore(adminApp);
  return db;
}
