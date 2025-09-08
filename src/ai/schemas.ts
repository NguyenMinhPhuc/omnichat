
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


// Schema for Lead Capture
export const LeadCaptureInputSchema = z.object({
  apiKey: z.string().optional(),
  chatHistory: z.string().describe('The entire conversation history between the user and the AI assistant.'),
});
export type LeadCaptureInput = z.infer<typeof LeadCaptureInputSchema>;

export const LeadCaptureOutputSchema = z.object({
    response: z.string().describe("The AI's next response to continue the conversation."),
    lead: z.object({
        customerName: z.string().optional().describe("The customer's full name."),
        phoneNumber: z.string().optional().describe("The customer's phone number."),
        needs: z.string().optional().describe("A summary of the customer's needs or interests."),
    }),
    isComplete: z.boolean().describe('Set to true only when all information (name, needs, phone number) has been collected.'),
});
export type LeadCaptureOutput = z.infer<typeof LeadCaptureOutputSchema>;

// Schema for Webpage Ingestion
export const WebpageIngestionInputSchema = z.object({
  url: z.string().url().describe('The URL of the webpage to ingest.'),
  // The userId is added to retrieve the correct API key on the server.
  userId: z.string().describe('The ID of the user performing the ingestion.'),
});
export type WebpageIngestionInput = z.infer<typeof WebpageIngestionInputSchema>;

export const WebpageIngestionOutputSchema = z.object({
  title: z.string().describe('A suitable title for the knowledge source, derived from the webpage content.'),
  content: z.string().describe('A concise summary of the key information from the webpage, formatted in Markdown.'),
});
export type WebpageIngestionOutput = z.infer<typeof WebpageIngestionOutputSchema>;
