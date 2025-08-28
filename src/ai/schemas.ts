
import { z } from 'zod';

// Schema for knowledge base ingestion (Step 1: Text Extraction)
export const KnowledgeBaseIngestionInputSchema = z.object({
  source: z.object({
      type: z.enum(['dataUri', 'url']),
      content: z.string().describe("A file represented as a data URI or a valid URL.")
  }),
  userId: z.string().describe('The ID of the user for whom to ingest the knowledge base.'),
});
export type KnowledgeBaseIngestionInput = z.infer<typeof KnowledgeBaseIngestionInputSchema>;

// This output is now handled by the server action and doesn't need a specific schema here.

// Schema for storing the extracted text (Step 2: Vectorization & Storage)
export const StoreKnowledgeBaseInputSchema = z.object({
  text: z.string().describe('The extracted text content to be vectorized and stored.'),
  userId: z.string().describe('The ID of the user for whom to store the knowledge base.'),
});
export type StoreKnowledgeBaseInput = z.infer<typeof StoreKnowledgeBaseInputSchema>;


// Schema for intelligent AI responses
export const IntelligentAIResponseInputSchema = z.object({
  query: z.string().describe('The user query.'),
  userId: z.string().describe('The ID of the user to fetch the knowledge base for.'),
});
export type IntelligentAIResponseInput = z.infer<typeof IntelligentAIResponseInputSchema>;

export const IntelligentAIResponseOutputSchema = z.object({
  response: z.string().describe('The chatbot response to the user query.'),
});
export type IntelligentAIResponseOutput = z.infer<typeof IntelligentAIResponseOutputSchema>;
