
'use server';
/**
 * @fileOverview This flow handles the ingestion and processing of various document types
 * (text, PDF, DOCX, images) and website URLs to create a knowledge base for the chatbot.
 * It now focuses *only* on extracting text content using a multimodal AI model.
 * The chunking and vector storage is handled by a separate server action.
 *
 * - knowledgeBaseIngestion - The main function that processes the input and returns the extracted text.
 * - KnowledgeBaseIngestionInput - The input type for the flow.
 * - KnowledgeBaseIngestionOutput - The return type for the flow, which is now just the extracted text.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { KnowledgeBaseIngestionInput, KnowledgeBaseIngestionInputSchema, KnowledgeBaseIngestionOutput, KnowledgeBaseIngestionOutputSchema } from '@/ai/schemas';


const extractionPrompt = ai.definePrompt({
    name: 'knowledgeExtractionPrompt',
    model: 'googleai/gemini-1.5-flash-latest',
    input: { schema: z.object({
        sourceToProcess: z.string(),
    })},
    output: { schema: z.object({ text: z.string() }) },
    prompt: `You are an expert at extracting raw text content from various sources.
    Analyze the provided document or website and extract all the meaningful text from it.
    Do not summarize. Do not add any commentary. Return only the extracted text.

    Source:
    {{media url=sourceToProcess}}
    `,
});

const knowledgeBaseIngestionFlow = ai.defineFlow(
    {
        name: 'knowledgeBaseIngestionFlow',
        inputSchema: KnowledgeBaseIngestionInputSchema,
        outputSchema: KnowledgeBaseIngestionOutputSchema,
    },
    async ({ source }) => {
        try {
            // 1. Extract text from the source using the AI prompt.
            const { output } = await extractionPrompt({ sourceToProcess: source.content });

            // 2. Validate extracted content
            if (!output || !output.text || !output.text.trim()) {
                return { success: false, message: "Could not extract any text from the source. The file might be empty, too large, or in an unsupported format." };
            }
            
            return {
                success: true,
                text: output.text,
            };
        } catch (error) {
            console.error("Error during knowledge base ingestion flow:", error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during ingestion.";
            
            if (/(quota|rate limit|resource has been exhausted)/i.test(errorMessage)) {
                return {
                    success: false,
                    message: "API quota exceeded. You've made too many requests in a short period. Please try again later or use a smaller document."
                };
            }

            return { success: false, message: errorMessage };
        }
    }
);


export async function knowledgeBaseIngestion(input: KnowledgeBaseIngestionInput): Promise<KnowledgeBaseIngestionOutput> {
  return knowledgeBaseIngestionFlow(input);
}
