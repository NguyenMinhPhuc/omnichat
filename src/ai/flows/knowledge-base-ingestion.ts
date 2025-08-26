'use server';
/**
 * @fileOverview A knowledge base ingestion AI agent.
 *
 * - knowledgeBaseIngestion - A function that handles the knowledge base ingestion process.
 * - KnowledgeBaseIngestionInput - The input type for the knowledgeBaseIngestion function.
 * - KnowledgeBaseIngestionOutput - The return type for the knowledgeBaseIngestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const KnowledgeBaseIngestionInputSchema = z.object({
  documentDataUri: z
    .string()
    .describe(
      "A document, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type KnowledgeBaseIngestionInput = z.infer<typeof KnowledgeBaseIngestionInputSchema>;

const KnowledgeBaseIngestionOutputSchema = z.object({
  success: z.boolean().describe('Whether the document was successfully ingested.'),
  message: z.string().describe('A message indicating the result of the ingestion attempt.'),
});
export type KnowledgeBaseIngestionOutput = z.infer<typeof KnowledgeBaseIngestionOutputSchema>;

export async function knowledgeBaseIngestion(input: KnowledgeBaseIngestionInput): Promise<KnowledgeBaseIngestionOutput> {
  return knowledgeBaseIngestionFlow(input);
}

const knowledgeBaseIngestionPrompt = ai.definePrompt({
  name: 'knowledgeBaseIngestionPrompt',
  input: {schema: KnowledgeBaseIngestionInputSchema},
  output: {schema: KnowledgeBaseIngestionOutputSchema},
  prompt: `You are an expert system designed to ingest knowledge base documents.

  You will receive a document as a data URI. Your task is to process this document and store its content in a suitable format for later retrieval.
  Once you ingest this document return a success message.
  Document: {{media url=documentDataUri}}`,
});

const knowledgeBaseIngestionFlow = ai.defineFlow(
  {
    name: 'knowledgeBaseIngestionFlow',
    inputSchema: KnowledgeBaseIngestionInputSchema,
    outputSchema: KnowledgeBaseIngestionOutputSchema,
  },
  async input => {
    try {
      const {output} = await knowledgeBaseIngestionPrompt(input);
      return output!;
    } catch (error: any) {
      console.error('Error ingesting document:', error);
      return {
        success: false,
        message: `Document ingestion failed: ${error.message || 'Unknown error'}`,
      };
    }
  }
);
