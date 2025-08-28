
'use server'

import { ai } from '@/ai/genkit';
import {
    IntelligentAIResponseInputSchema,
    IntelligentAIResponseOutput,
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
Prioritize using the provided context to formulate your answer. The context is a list of question-answer pairs.
Find the most relevant question in the context to answer the user's query.
If the context does not contain the answer or is not relevant to the query, use your general knowledge to respond.

Context (Question-Answer pairs):
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
  async ({ userId, query }): Promise<IntelligentAIResponseOutput> => {
    const knowledgeBaseCollection = db.collection('users').doc(userId).collection('knowledge_base');
    const knowledgeSnapshot = await knowledgeBaseCollection.get();

    let context: string[] = [];
    if (!knowledgeSnapshot.empty) {
        knowledgeSnapshot.docs.forEach(doc => {
            const data = doc.data();
            // Format each document into a "Q: ... A: ..." string
            context.push(`Q: ${data.question}\nA: ${data.answer}`);
        });
    }
    
    // If no context, the array will be empty, and the prompt handles it gracefully.
    const { output } = await ragPrompt({ query, context });
    return output!;
  }
);
