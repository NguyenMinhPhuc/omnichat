'use server'

import { intelligentAIResponseFlow } from '@/ai/flows/intelligent-ai-responses';
import { IntelligentAIResponseOutput } from '@/ai/schemas';
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore, FieldValue } from 'firebase-admin/firestore';

// IMPORTANT: This service account key is securely handled on the server-side.
const serviceAccount = {
  type: 'service_account',
  project_id: 'omnichat-isnkq',
  private_key_id: '3145ffc8282362b5d43e2f75471d2b7d59837941',
  private_key: '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDKtPMgN/P3xMZu\nANl9N1ADgYjA+oVwPZ/vR2pA5L5fV6w7g6d7b2a7b3c2I5a6l5n7Z9Z7p3w4M5V1B7\nb2a7b3c2I5a6l5n7Z9Z7p3w4M5V1B7b2a7b3c2I5a6l5n7Z9Z7p3w4M5V1B7b2a7\nb3c2I5a6l5n7Z9Z7p3w4M5V1B7b2a7b3c2I5a6l5n7Z9Z7p3w4M5V1B7b2a7b3c2\nI5a6l5n7Z9Z7p3w4M5V1B7b2a7b3c2I5a6l5n7Z9Z7p3w4M5V1B7b2a7b3c2I5a6\nl5n7Z9Z7p3w4M5V1B7b2a7b3c2I5a6l5n7Z9Z7p3w4M5V1BwIDAQAB\nAoIBAQC4b6c3f6e4a3b2a1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1\na0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0\nb9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9\nc8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8\nd7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7\ne6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6\nf5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0\n-----END PRIVATE KEY-----\n'.replace(/\\n/g, '\n'),
  client_email: 'firebase-adminsdk-h1i2j@omnichat-isnkq.iam.gserviceaccount.com',
  client_id: '114170669287340698269',
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url: 'https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-h1i2j%40omnichat-isnkq.iam.gserviceaccount.com'
};

let db: Firestore;

if (!getApps().length) {
  const app: App = initializeApp({
    credential: cert(serviceAccount),
  });
  db = getFirestore(app);
} else {
  // Use the existing app instance
  db = getFirestore();
}

interface KnowledgeBaseIngestionInput {
  userId: string;
  question: string;
  answer: string;
}

interface KnowledgeBaseIngestionOutput {
    success: boolean;
    message?: string;
}

/**
 * Handles the ingestion of a new question-answer pair into the user's knowledge base.
 */
export async function handleKnowledgeIngestion(input: KnowledgeBaseIngestionInput): Promise<KnowledgeBaseIngestionOutput> {
    const { userId, question, answer } = input;
    try {
        const knowledgeBaseCollection = db.collection('users').doc(userId).collection('knowledge_base');
        await knowledgeBaseCollection.add({
            question,
            answer,
            createdAt: FieldValue.serverTimestamp(),
        });
        
        const userDocRef = db.collection('users').doc(userId);
        // Update a timestamp to indicate that the knowledge base has been modified.
        // This can be used to invalidate caches if needed.
        await userDocRef.set({ knowledgeBaseLastUpdatedAt: FieldValue.serverTimestamp() }, { merge: true });
        
        return { success: true, message: 'Knowledge base updated successfully.' };
    } catch (error) {
        console.error("Error handling document ingestion:", error);
        const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred during ingestion.";
        return { success: false, message: errorMessage };
    }
}

interface GetAIResponseInput {
    query: string;
    userId: string;
}

/**
 * Fetches the knowledge base for a user and then calls the AI flow to get a response.
 */
export async function getAIResponse({ query, userId }: GetAIResponseInput): Promise<IntelligentAIResponseOutput> {
  try {
    // 1. Fetch context (knowledge base) from Firestore
    const knowledgeBaseCollection = db
      .collection('users')
      .doc(userId)
      .collection('knowledge_base');
    const knowledgeSnapshot = await knowledgeBaseCollection.orderBy('createdAt', 'desc').limit(20).get();
    
    const context: string[] = [];
    if (!knowledgeSnapshot.empty) {
      knowledgeSnapshot.docs.forEach(doc => {
        const data = doc.data();
        // Format the knowledge into a simple Q&A string for the AI
        context.push(`Q: ${data.question}\nA: ${data.answer}`);
      });
    }

    // 2. Call the AI flow with the fetched context
    const result = await intelligentAIResponseFlow({
        query,
        userId, // Passing userId in case it's needed for future AI logic
        context
    });
    
    return result;

  } catch (error) {
    console.error("Error getting AI response:", error);
    return { response: "Sorry, I encountered an error communicating with the AI service. Please check the server logs." };
  }
}
