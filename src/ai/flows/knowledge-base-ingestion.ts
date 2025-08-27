
'use server';
/**
 * @fileOverview This flow handles the ingestion and processing of various document types
 * (text, PDF, DOCX, images) and website URLs to create a knowledge base for the chatbot.
 * It uses a multimodal AI model to extract text content, chunks it, creates embeddings,
 * and stores them in a vector store for later retrieval.
 *
 * - knowledgeBaseIngestion - The main function that processes the input and returns the extracted text.
 * - KnowledgeBaseIngestionInput - The input type for the flow.
 * - KnowledgeBaseIngestionOutput - The return type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';
import { Document, index } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { KnowledgeBaseIngestionInput, KnowledgeBaseIngestionOutput, KnowledgeBaseIngestionInputSchema, KnowledgeBaseIngestionOutputSchema } from '@/ai/schemas';


// Ensure Firebase Admin is initialized
if (!getApps().length) {
  initializeApp();
}
const db = getFirestore();

// Define the embedding model
const embedder = googleAI.embedder('text-embedding-004');

/**
 * Splits a long text into smaller chunks based on a specified chunk size and overlap.
 * This is a simplified, self-contained alternative to RecursiveCharacterTextSplitter.
 * @param text The full text to be split.
 * @param chunkSize The maximum size of each chunk.
 * @param chunkOverlap The number of characters to overlap between chunks.
 * @returns A promise that resolves to an array of text chunks.
 */
async function splitTextIntoChunks(text: string, chunkSize: number, chunkOverlap: number): Promise<string[]> {
    if (chunkOverlap >= chunkSize) {
        throw new Error("chunkOverlap must be smaller than chunkSize.");
    }

    const chunks: string[] = [];
    let i = 0;
    while (i < text.length) {
        const end = Math.min(i + chunkSize, text.length);
        chunks.push(text.substring(i, end));
        i += (chunkSize - chunkOverlap);
    }
    return chunks;
}


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
    {{{sourceToProcess}}}
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
            // 1. Let Genkit process the source URL or data URI.
            const sourceToProcess = `{{media url="${source.content}"}}`;

            // 2. Extract text from the source using the correct prompt invocation.
            const { output } = await extractionPrompt({ sourceToProcess });

            if (!output || !output.text) {
                return { success: false, message: "Could not extract any text from the source." };
            }
            const extractedContent = output.text;

            // 3. Split the extracted text into chunks
            const chunks = await splitTextIntoChunks(extractedContent, 1000, 100);

            // 4. Create Document objects for Genkit
            const documents = chunks.map(chunk => Document.fromText(chunk));

            // 5. Index the documents (creates embeddings)
            const indexedDocs = await index({
                documents,
                embedder,
            });

            // 6. Store the indexed documents (vectors) in Firestore
            const vectorStoreCollection = db.collection('users').doc(userId).collection('vector_store');
            const batch = db.batch();

            indexedDocs.forEach(doc => {
                const docRef = vectorStoreCollection.doc(); // Auto-generate ID
                batch.set(docRef, Document.toObject(doc));
            });

            await batch.commit();

            // To avoid storing large KBs in the main user doc, we'll just confirm it's updated.
            const userDocRef = db.collection('users').doc(userId);
            await userDocRef.set({ knowledgeBaseLastUpdatedAt: FieldValue.serverTimestamp() }, { merge: true });


            return {
                success: true,
                message: `Knowledge base updated successfully with ${indexedDocs.length} new text chunks.`,
                knowledgeBase: `Processed ${indexedDocs.length} chunks.`,
            };
        } catch (error) {
            console.error("Error during knowledge base ingestion flow:", error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during ingestion.";
            
            // Check for quota-related errors
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
