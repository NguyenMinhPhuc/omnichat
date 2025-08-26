'use server';
/**
 * @fileOverview This flow is deprecated and its functionality is now handled directly 
 * in the CustomizationPanel component to simplify the process. The knowledge base
 * is saved directly to Firestore from the client-side action.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const KnowledgeBaseIngestionInputSchema = z.object({
  documentDataUri: z.string(),
  userId: z.string(),
});
export type KnowledgeBaseIngestionInput = z.infer<typeof KnowledgeBaseIngestionInputSchema>;

export const KnowledgeBaseIngestionOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type KnowledgeBaseIngestionOutput = z.infer<typeof KnowledgeBaseIngestionOutputSchema>;

export async function knowledgeBaseIngestion(input: KnowledgeBaseIngestionInput): Promise<KnowledgeBaseIngestionOutput> {
  // This flow is no longer doing any AI processing, just returning a success message
  // as the logic is handled in the component.
  console.log(`Knowledge base for user ${input.userId} was updated.`);
  return {
    success: true,
    message: 'Knowledge base updated successfully.',
  };
}
