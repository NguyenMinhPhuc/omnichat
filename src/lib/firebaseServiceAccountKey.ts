// This file is intended for server-side use only and should not be exposed to the client.
import { initializeApp, getApps, cert, getApp, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

// IMPORTANT: The private_key is formatted as a single line with escaped newlines (\\n)
// to prevent parsing errors.
const serviceAccount = {
  type: 'service_account',
  project_id: 'omnichat-isnkq',
  private_key_id: '3145ffc8282362b5d43e2f75471d2b7d59837941',
  private_key: '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDKtPMgN/P3xMZu\nANl9N1ADgYjA+oVwPZ/vR2pA5L5fV6w7g6d7b2a7b3c2I5a6l5n7Z9Z7p3w4M5V1B7\nb2a7b3c2I5a6l5n7Z9Z7p3w4M5V1B7b2a7b3c2I5a6l5n7Z9Z7p3w4M5V1B7b2a7\nb3c2I5a6l5n7Z9Z7p3w4M5V1B7b2a7b3c2I5a6l5n7Z9Z7p3w4M5V1B7b2a7b3c2\nI5a6l5n7Z9Z7p3w4M5V1B7b2a7b3c2I5a6l5n7Z9Z7p3w4M5V1B7b2a7b3c2I5a6\nl5n7Z9Z7p3w4M5V1B7b2a7b3c2I5a6l5n7Z9Z7p3w4M5V1B7b2a7b3c2I5a6l5n7\nZ9Z7p3w4M5V1BwIDAQAB\nAoIBAQC4b6c3f6e4a3b2a1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1\na0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0\nb9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9\nc8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8\nd7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7\ne6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6\nf5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5\na4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0\n-----END PRIVATE KEY-----\n'.replace(/\\n/g, '\n'),
  client_email: 'firebase-adminsdk-h1i2j@omnichat-isnkq.iam.gserviceaccount.com',
  client_id: '114170669287340698269',
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url: 'https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-h1i2j%40omnichat-isnkq.iam.gserviceaccount.com'
};

const appName = 'firebase-admin-app';
let app: App;

if (!getApps().some((existingApp) => existingApp.name === appName)) {
  app = initializeApp({
    credential: cert(serviceAccount),
    databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
  }, appName);
} else {
  app = getApp(appName);
}

const db: Firestore = getFirestore(app);

export { db };
