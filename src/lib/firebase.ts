'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Simple check if all required config values are present.
const isConfigValid = Object.values(firebaseConfig).every(value => !!value);

if (!isConfigValid) {
    const errorMessage = `Missing one or more Firebase environment variables (starting with NEXT_PUBLIC_). Please check your .env.local file and restart the server.`;
    console.error(errorMessage);
    // You might want to throw an error in development to halt execution
    if (process.env.NODE_ENV === 'development') {
        throw new Error(errorMessage);
    }
}

// Initialize Firebase
const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);

export { app, auth, db, storage };
