
'use server';
/**
 * @fileOverview This flow handles the ingestion and processing of various document types
 * (text, PDF, DOCX, images) and website URLs to create a knowledge base for the chatbot.
 * It uses a multimodal AI model to extract text content from the provided source.
 *
 * - knowledgeBaseIngestion - The main function that processes the input and returns the extracted text.
 * - KnowledgeBaseIngestionInput - The input type for the flow.
 * - KnowledgeBaseIngestionOutput - The return type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';

// Ensure Firebase Admin is initialized
if (!getApps().length) {
  initializeApp();
}
const db = getFirestore();


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

const extractionPrompt = ai.definePrompt({
    name: 'knowledgeExtractionPrompt',
    model: 'googleai/gemini-1.5-flash-latest',
    input: { schema: z.object({
        source: z.union([
            z.object({ type: z.literal('dataUri'), content: z.string() }),
            z.object({ type: z.literal('url'), content: z.string().url() }),
        ]),
    })},
    prompt: `You are an expert at extracting raw text content from various sources.
    Analyze the provided document or website and extract all the meaningful text from it.
    Do not summarize. Do not add any commentary. Return only the extracted text.
    
    Source:
    {{#if (eq source.type "dataUri")}}
        {{media url=source.content}}
    {{else}}
        Please extract the text content from the website at this URL: {{{source.content}}}
    {{/if}}
    `,
});

const knowledgeBaseIngestionFlow = ai.defineFlow(
    {
        name: 'knowledgeBaseIngestionFlow',
        inputSchema: KnowledgeBaseIngestionInputSchema,
        outputSchema: KnowledgeBaseIngestionOutputSchema,
    },
    async ({ source, userId }) => {
        try {
            const { text } = await extractionPrompt({ source });

            if (!text) {
                return { success: false, message: "Could not extract any text from the source." };
            }
            
            const userDocRef = db.collection('users').doc(userId);
            await userDocRef.set({ knowledgeBase: text }, { merge: true });

            return {
                success: true,
                message: 'Knowledge base updated successfully from the source.',
                knowledgeBase: text,
            };
        } catch (error) {
            console.error("Error during knowledge base ingestion flow:", error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during ingestion.";
            return { success: false, message: errorMessage };
        }
    }
);


export async function knowledgeBaseIngestion(input: KnowledgeBaseIngestionInput): Promise<KnowledgeBaseIngestionOutput> {
  return knowledgeBaseIngestionFlow(input);
}
