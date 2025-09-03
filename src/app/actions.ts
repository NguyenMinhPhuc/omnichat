
'use server'

import { intelligentAIResponseFlow } from '@/ai/flows/intelligent-ai-responses';
import { IntelligentAIResponseOutput } from '@/ai/schemas';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert, getApp, App } from 'firebase-admin/app';
import { firebaseConfig } from '@/lib/firebaseConfig';
import { serviceAccount } from '@/lib/firebaseServiceAccountKey';

// Helper function to initialize Firebase Admin SDK idempotently.
const initializeDb = () => {
    if (getApps().length > 0 && getApps().find(app => app.name === '[DEFAULT]')) {
      return getFirestore();
    }
    
    // Pass config to initializeApp to ensure it connects to the correct project.
    initializeApp({
        credential: cert(serviceAccount),
        ...firebaseConfig
    });
    
    return getFirestore();
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
        const db = initializeDb();
        
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
    const db = initializeDb();
    
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
