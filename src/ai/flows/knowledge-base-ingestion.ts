
'use server'

import { ai } from '@/ai/genkit';
import {
    KnowledgeBaseIngestionInput,
    KnowledgeBaseIngestionInputSchema,
    KnowledgeBaseIngestionOutput,
    KnowledgeBaseIngestionOutputSchema,
} from '@/ai/schemas';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';

// Ensure Firebase Admin is initialized
if (!getApps().length) {
  initializeApp();
}
const db = getFirestore();


// This is the exported async function that complies with 'use server'
export async function ingestKnowledge(input: KnowledgeBaseIngestionInput): Promise<KnowledgeBaseIngestionOutput> {
    // This is the internal Genkit flow, not exported
    const knowledgeBaseIngestionFlow = ai.defineFlow(
        {
            name: 'knowledgeBaseIngestionFlow',
            inputSchema: KnowledgeBaseIngestionInputSchema,
            outputSchema: KnowledgeBaseIngestionOutputSchema,
        },
        async ({ userId, question, answer }): Promise<KnowledgeBaseIngestionOutput> => {
            try {
                if (!userId || !question || !answer) {
                    return { success: false, message: "User ID, question, and answer are required." };
                }

                // Get a reference to the user's simple knowledge base collection
                const knowledgeBaseCollection = db.collection('users').doc(userId).collection('knowledge_base');
                
                // Add the new question-answer pair as a new document
                await knowledgeBaseCollection.add({
                    question,
                    answer,
                    createdAt: new Date(),
                });

                return {
                    success: true,
                    message: `Knowledge base updated successfully.`
                };

            } catch (error) {
                console.error("Error during knowledge base ingestion flow:", error);
                const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
                return { success: false, message: errorMessage };
            }
        }
    );
    
    return await knowledgeBaseIngestionFlow(input);
}
