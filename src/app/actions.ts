
'use server'

import { intelligentAIResponse } from '@/ai/flows/intelligent-ai-responses'
import { knowledgeBaseIngestion } from '@/ai/flows/knowledge-base-ingestion';
import { z } from 'zod';

// Schema for knowledge base ingestion
export const KnowledgeBaseIngestionInputSchema = z.object({
  source: z.union([
      z.object({ type: z.literal('dataUri'), content: z.string().describe("A file represented as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'.") }),
      z.object({ type: z.literal('url'), content: z.string().url().describe('A valid URL to a website to scrape.') }),
  ]),
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


export async function handleDocumentIngestion(input: KnowledgeBaseIngestionInput) {
    try {
        const result = await knowledgeBaseIngestion(input);
        return result;
    } catch (error) {
        console.error("Error handling document ingestion:", error);
        return { success: false, message: "An unexpected error occurred." };
    }
}

export async function getAIResponse(input: IntelligentAIResponseInput) {
  try {
    const result = await intelligentAIResponse(input);
    return result;
  } catch (error) {
    console.error("Error getting AI response:", error);
    return { response: "Sorry, I encountered an error. Please try again." };
  }
}
