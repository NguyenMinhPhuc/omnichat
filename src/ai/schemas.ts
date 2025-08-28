
import { z } from 'zod';

// Schema for knowledge base ingestion
export const KnowledgeBaseIngestionInputSchema = z.object({
  source: z.object({ 
      type: z.enum(['dataUri', 'url']), 
      content: z.string().describe("A file represented as a data URI or a valid URL.") 
  }),
  userId: z.string().describe('The ID of the user for whom to ingest the knowledge base.'),
});
export type KnowledgeBaseIngestionInput = z.infer<typeof KnowledgeBaseIngestionInputSchema>;

export const KnowledgeBaseIngestionOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  knowledgeBase: z.string().optional(),
});
export type KnowledgeBaseIngestionOutput = z.infer<typeof KnowledgeBaseIngestionOutputSchema>;


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
