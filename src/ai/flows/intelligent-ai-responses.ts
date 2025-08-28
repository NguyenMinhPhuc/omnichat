
'use server';

/**
 * @fileOverview This file defines the intelligent AI response flow for the chatbot.
 * This flow uses a RAG (Retrieval-Augmented Generation) architecture.
 *
 * - intelligentAIResponse - A function that generates responses based on a user's uploaded documents.
 * - IntelligentAIResponseInput - The input type for the intelligentAIResponse function.
 * - IntelligentAIResponseOutput - The return type for the intelligentAIResponse function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';
import { Document, retrieve } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { IntelligentAIResponseInput, IntelligentAIResponseOutput, IntelligentAIResponseInputSchema, IntelligentAIResponseOutputSchema } from '@/ai/schemas';


// Ensure Firebase Admin is initialized
if (!getApps().length) {
  initializeApp();
}
const db = getFirestore();

// Define the embedding model
const embedder = googleAI.embedder('text-embedding-004');


export async function intelligentAIResponse(input: IntelligentAIResponseInput): Promise<IntelligentAIResponseOutput> {
  return intelligentAIResponseFlow(input);
}

const ragPrompt = ai.definePrompt({
    name: 'ragPrompt',
    model: 'googleai/gemini-1.5-flash-latest',
    input: { schema: z.object({
      query: z.string(),
      context: z.array(z.string()),
    }) },
    output: {schema: IntelligentAIResponseOutputSchema},
    prompt: `You are an intelligent AI assistant. Your task is to answer the user's query.
Prioritize using the provided context to formulate your answer.
If the context does not contain the answer or is not relevant to the query, use your general knowledge to respond.

Context:
{{#if context}}
{{#each context}}
- {{{this}}}
{{/each}}
{{else}}
No context provided.
{{/if}}

User Query:
{{{query}}}

Answer:`,
});

const intelligentAIResponseFlow = ai.defineFlow(
  {
    name: 'intelligentAIResponseFlow',
    inputSchema: IntelligentAIResponseInputSchema,
    outputSchema: IntelligentAIResponseOutputSchema,
  },
  async ({ userId, query }) => {
    const vectorStoreCollection = db.collection('users').doc(userId).collection('vector_store');
    const vectorStoreSnapshot = await vectorStoreCollection.get();

    if (vectorStoreSnapshot.empty) {
        return { response: "I haven't been configured with any knowledge. Please upload a document first." };
    }

    const documents = vectorStoreSnapshot.docs.map(doc => Document.fromObject(doc.data()));

    const relevantDocs = await retrieve({
        query,
        embedder,
        documents,
        options: { k: 5 }, // Retrieve the top 5 most relevant document chunks
    });

    const context = relevantDocs.map(doc => doc.content[0].text || '');
    
    const {output} = await ragPrompt({ query, context });
    return output!;
  }
);
