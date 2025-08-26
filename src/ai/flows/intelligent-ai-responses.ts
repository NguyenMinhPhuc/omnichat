'use server';

/**
 * @fileOverview This file defines the intelligent AI response flow for the chatbot.
 *
 * - intelligentAIResponse - A function that generates responses based on a user's uploaded documents.
 * - IntelligentAIResponseInput - The input type for the intelligentAIResponse function.
 * - IntelligentAIResponseOutput - The return type for the intelligentAIResponse function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';

// Ensure Firebase Admin is initialized
if (!getApps().length) {
  initializeApp();
}
const db = getFirestore();

const IntelligentAIResponseInputSchema = z.object({
  query: z.string().describe('The user query.'),
  userId: z.string().describe('The ID of the user to fetch the knowledge base for.'),
});
export type IntelligentAIResponseInput = z.infer<typeof IntelligentAIResponseInputSchema>;

const IntelligentAIResponseOutputSchema = z.object({
  response: z.string().describe('The chatbot response to the user query.'),
});
export type IntelligentAIResponseOutput = z.infer<typeof IntelligentAIResponseOutputSchema>;

export async function intelligentAIResponse(input: IntelligentAIResponseInput): Promise<IntelligentAIResponseOutput> {
  return intelligentAIResponseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'intelligentAIResponsePrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: { schema: z.object({
    query: z.string(),
    knowledgeBase: z.string(),
  }) },
  output: {schema: IntelligentAIResponseOutputSchema},
  prompt: `You are a chatbot that answers user queries based on the provided knowledge base.

Knowledge Base:
{{{knowledgeBase}}}

User Query: {{query}}

Response:`,
});

const intelligentAIResponseFlow = ai.defineFlow(
  {
    name: 'intelligentAIResponseFlow',
    inputSchema: IntelligentAIResponseInputSchema,
    outputSchema: IntelligentAIResponseOutputSchema,
  },
  async ({ userId, query }) => {
    const userDocRef = db.collection('users').doc(userId);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
        return { response: "Could not find user data." };
    }

    const userData = userDoc.data();
    const knowledgeBase = userData?.knowledgeBase || '';

    if (!knowledgeBase) {
        return { response: "No knowledge base has been configured for this chatbot." };
    }

    // This is the critical fix: `await` ensures we wait for the AI to respond.
    const {output} = await prompt({ query, knowledgeBase });
    return output!;
  }
);
