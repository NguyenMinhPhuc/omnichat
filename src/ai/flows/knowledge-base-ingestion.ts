'use server';

import { ai } from '@/ai/genkit';
import { KnowledgeBaseIngestionInputSchema, KnowledgeBaseIngestionOutputSchema, KnowledgeBaseIngestionInput, KnowledgeBaseIngestionOutput } from '@/ai/schemas';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';

// Define the flow at the top-level scope.
const knowledgeBaseIngestionFlow = ai.defineFlow(
  {
    name: 'knowledgeBaseIngestionFlow',
    inputSchema: KnowledgeBaseIngestionInputSchema,
    outputSchema: KnowledgeBaseIngestionOutputSchema,
  },
  async (input) => {
    const { userId, question, answer } = input;
    
    try {
        if (!getApps().length) {
          initializeApp();
        }
        const db = getFirestore();
        
        const knowledgeBaseCollection = db.collection('users').doc(userId).collection('knowledge_base');
        await knowledgeBaseCollection.add({
            question,
            answer,
            createdAt: FieldValue.serverTimestamp(),
        });
        
        const userDocRef = db.collection('users').doc(userId);
        await userDocRef.set({ knowledgeBaseLastUpdatedAt: FieldValue.serverTimestamp() }, { merge: true });
        
        return { success: true, message: 'Knowledge base updated successfully.' };
    } catch (error) {
        console.error("Error in knowledge base ingestion flow:", error);
        // Ensure errors are thrown so they can be caught by the caller if necessary,
        // or handled gracefully.
        const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
        return { success: false, message: errorMessage };
    }
  }
);

// The exported function now simply calls the pre-defined flow.
export async function ingestKnowledge(input: KnowledgeBaseIngestionInput): Promise<KnowledgeBaseIngestionOutput> {
    return await knowledgeBaseIngestionFlow(input);
}
