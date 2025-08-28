
'use server'

import type { KnowledgeBaseIngestionInput, IntelligentAIResponseInput, KnowledgeBaseIngestionOutput, IntelligentAIResponseOutput } from '@/ai/schemas';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';
import { ingestKnowledge } from '@/ai/flows/knowledge-base-ingestion';
import { intelligentAIResponseFlow } from '@/ai/flows/intelligent-ai-responses';


// Ensure Firebase Admin is initialized
if (!getApps().length) {
  initializeApp();
}
const db = getFirestore();

export async function handleKnowledgeIngestion(input: KnowledgeBaseIngestionInput): Promise<KnowledgeBaseIngestionOutput> {
    try {
        // Call the new async wrapper function
        const result = await ingestKnowledge(input);
        
        // If the ingestion was successful, update the user's document timestamp
        if (result.success) {
            const userDocRef = db.collection('users').doc(input.userId);
            await userDocRef.set({ knowledgeBaseLastUpdatedAt: FieldValue.serverTimestamp() }, { merge: true });
        }
        
        return result;

    } catch (error) {
        console.error("Error handling document ingestion:", error);
        const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred during ingestion.";
        return { success: false, message: errorMessage };
    }
}


export async function getAIResponse(input: IntelligentAIResponseInput): Promise<IntelligentAIResponseOutput> {
  try {
    const result = await intelligentAIResponseFlow(input);
    // Ensure we always return a valid structure, even if the flow fails unexpectedly.
    return result || { response: "Sorry, I couldn't get a response. Please try again." };
  } catch (error) {
    console.error("Error getting AI response:", error);
    return { response: "Sorry, I encountered an error communicating with the AI service. Please try again." };
  }
}
