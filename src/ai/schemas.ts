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
});
export type IntelligentAIResponseOutput = z.infer<typeof IntelligentAIResponseOutputSchema>;


// Schema for Lead Qualification
export const LeadQualificationInputSchema = z.object({
  apiKey: z.string().optional(),
  customerName: z.string().optional(),
  company: z.string().optional(),
  need: z.string().optional(),
});
export type LeadQualificationInput = z.infer<typeof LeadQualificationInputSchema>;

export const LeadQualificationOutputSchema = z.object({
  response: z.string(),
  qualification: z.string().optional(),
  inputTokens: z.number(),
  outputTokens: z.number(),
  totalTokens: z.number(),
});
export type LeadQualificationOutput = z.infer<typeof LeadQualificationOutputSchema>;
