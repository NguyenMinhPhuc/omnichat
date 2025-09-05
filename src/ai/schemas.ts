import { z } from 'zod';

// Schema for intelligent AI responses
export const IntelligentAIResponseInputSchema = z.object({
  query: z.string().describe('The user query.'),
  userId: z.string().describe('The ID of the user to fetch the knowledge base for.'),
  knowledgeBase: z.string().optional().describe('The knowledge base context.'),
  apiKey: z.string().optional().describe('The user-specific Gemini API key.'),
});
export type IntelligentAIResponseInput = z.infer<typeof IntelligentAIResponseInputSchema>;

export const IntelligentAIResponseOutputSchema = z.object({
  response: z.string().describe('The chatbot\'s textual response to the user query.'),
  inputTokens: z.number().optional().describe('Number of input tokens used.'),
  outputTokens: z.number().optional().describe('Number of output tokens generated.'),
  totalTokens: z.number().optional().describe('Total tokens (input + output) used.'),
  chatRequestCount: z.number().optional().describe('Number of chat requests (should be 1 per call).'),
});
export type IntelligentAIResponseOutput = z.infer<typeof IntelligentAIResponseOutputSchema>;