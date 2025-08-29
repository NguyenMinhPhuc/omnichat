
import { z } from 'zod';

// Schema for knowledge base ingestion
export const KnowledgeBaseIngestionInputSchema = z.object({
  question: z.string().describe("The question, keyword, or topic."),
  answer: z.string().describe("The corresponding answer or content."),
  userId: z.string().describe('The ID of the user for whom to ingest the knowledge base.'),
});
export type KnowledgeBaseIngestionInput = z.infer<typeof KnowledgeBaseIngestionInputSchema>;

export const KnowledgeBaseIngestionOutputSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
});
export type KnowledgeBaseIngestionOutput = z.infer<typeof KnowledgeBaseIngestionOutputSchema>;


// Schema for intelligent AI responses
export const IntelligentAIResponseInputSchema = z.object({
  query: z.string().describe('The user query.'),
  userId: z.string().describe('The ID of the user to fetch the knowledge base for.'),
  context: z.array(z.string()).describe('The knowledge base context.'),
});
export type IntelligentAIResponseInput = z.infer<typeof IntelligentAIResponseInputSchema>;

export const IntelligentAIResponseOutputSchema = z.object({
  response: z.string().describe('The chatbot\'s textual response to the user query.'),
  requestForInformation: z.array(z.enum(["name", "email", "phone"]))
    .optional()
    .describe('An optional list of personal information fields the chatbot should request from the user for follow-up.'),
});
export type IntelligentAIResponseOutput = z.infer<typeof IntelligentAIResponseOutputSchema>;
