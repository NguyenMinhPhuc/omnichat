
'use server'

import { Document, retrieve } from 'genkit/document';
import { ai, embedder } from '@/ai/genkit';
import {
    IntelligentAIResponseInputSchema,
    IntelligentAIResponseOutputSchema,
} from '@/ai/schemas';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';
import { z } from 'zod';

// Ensure Firebase Admin is initialized
if (!getApps().length) {
  initializeApp();
}
const db = getFirestore();


// RAG Prompt for Intelligent Responses
const ragPrompt = ai.definePrompt({
    name: 'ragPrompt',
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

// Intelligent Response Flow
export const intelligentAIResponseFlow = ai.defineFlow(
  {
    name: 'intelligentAIResponseFlow',
    inputSchema: IntelligentAIResponseInputSchema,
    outputSchema: IntelligentAIResponseOutputSchema,
  },
  async ({ userId, query }) => {
    const vectorStoreCollection = db.collection('users').doc(userId).collection('vector_store');
    const vectorStoreSnapshot = await vectorStoreCollection.get();

    if (vectorStoreSnapshot.empty) {
        // Instead of returning a hardcoded message, let the AI handle it with no context.
        const { output } = await ragPrompt({ query, context: [] });
        return output!;
    }

    const documents = vectorStoreSnapshot.docs.map(doc => Document.fromObject(doc.data()));

    const relevantDocs = await retrieve({
        query,
        embedder,
        documents,
        options: { k: 5 },
    });

    const context = relevantDocs.map(doc => doc.content[0].text || '');
    
    const {output} = await ragPrompt({ query, context });
    return output!;
  }
);
