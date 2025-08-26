'use server';

/**
 * @fileOverview This file defines the intelligent AI response flow for the chatbot.
 *
 * - intelligentAIResponse - A function that generates responses based on uploaded documents.
 * - IntelligentAIResponseInput - The input type for the intelligentAIResponse function.
 * - IntelligentAIResponseOutput - The return type for the intelligentAIResponse function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const KnowledgeBaseSchema = z.string().describe('The knowledge base content as a string.');

const IntelligentAIResponseInputSchema = z.object({
  query: z.string().describe('The user query.'),
  knowledgeBase: KnowledgeBaseSchema,
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
  input: {schema: IntelligentAIResponseInputSchema},
  output: {schema: IntelligentAIResponseOutputSchema},
  prompt: `You are a chatbot that answers user queries based on the provided knowledge base.

Knowledge Base:
{{knowledgeBase}}

User Query: {{query}}

Response:`,
});

const intelligentAIResponseFlow = ai.defineFlow(
  {
    name: 'intelligentAIResponseFlow',
    inputSchema: IntelligentAIResponseInputSchema,
    outputSchema: IntelligentAIResponseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
