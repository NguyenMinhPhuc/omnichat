'use server'

import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';
import { intelligentAIResponseFlow } from '@/ai/flows/intelligent-ai-responses';
import type { KnowledgeBaseIngestionInput, IntelligentAIResponseOutput, KnowledgeBaseIngestionOutput } from '@/ai/schemas';

// Ensure Firebase Admin is initialized only when needed.
const initializeDb = () => {
    if (!getApps().length) {
      initializeApp();
    }
    return getFirestore();
}

export async function handleKnowledgeIngestion(input: KnowledgeBaseIngestionInput): Promise<KnowledgeBaseIngestionOutput> {
    try {
        const db = initializeDb();
        const { userId, question, answer } = input;

        if (!userId || !question || !answer) {
            return { success: false, message: "User ID, question, and answer are required." };
        }

        const knowledgeBaseCollection = db.collection('users').doc(userId).collection('knowledge_base');
        
        await knowledgeBaseCollection.add({
            question,
            answer,
            createdAt: FieldValue.serverTimestamp(),
        });
        
        const userDocRef = db.collection('users').doc(userId);
        await userDocRef.set({ knowledgeBaseLastUpdatedAt: FieldValue.serverTimestamp() }, { merge: true });
        
        return { success: true, message: `Knowledge base updated successfully.` };

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

export async function getAIResponse({ query, userId }: GetAIResponseInput): Promise<IntelligentAIResponseOutput> {
  try {
    const db = initializeDb();
    // 1. Fetch context from Firestore
    const knowledgeBaseCollection = db
      .collection('users')
      .doc(userId)
      .collection('knowledge_base');
    const knowledgeSnapshot = await knowledgeBaseCollection.get();
    
    let context: string[] = [];
    if (!knowledgeSnapshot.empty) {
      knowledgeSnapshot.docs.forEach(doc => {
        const data = doc.data();
        context.push(`Q: ${data.question}\nA: ${data.answer}`);
      });
    }

    // 2. Call the AI flow with the fetched context
    const result = await intelligentAIResponseFlow({
        query,
        userId,
        context
    });
    
    return result || { response: "Sorry, I couldn't get a response. Please try again." };

  } catch (error) {
    console.error("Error getting AI response:", error);
    return { response: "Sorry, I encountered an error communicating with the AI service. Please try again." };
  }
}
