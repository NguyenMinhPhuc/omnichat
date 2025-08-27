
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
import {z} from 'genkit';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';
import { Document, index } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';


// Ensure Firebase Admin is initialized
if (!getApps().length) {
  initializeApp();
}
const db = getFirestore();

// Define the embedding model
const embedder = googleAI.embedder('text-embedding-004');


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
  knowledgeBase: z.string().optional(), // This is kept for compatibility but will not be populated with large text anymore
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
            // 1. Extract text from the source
            const { text: extractedContent } = await extractionPrompt({ source });

            if (!extractedContent) {
                return { success: false, message: "Could not extract any text from the source." };
            }

            // 2. Split the extracted text into chunks
            const splitter = new RecursiveCharacterTextSplitter({
                chunkSize: 1000,
                chunkOverlap: 100,
            });
            const chunks = await splitter.splitText(extractedContent);

            // 3. Create Document objects for Genkit
            const documents = chunks.map(chunk => Document.fromText(chunk));

            // 4. Index the documents (creates embeddings)
            const indexedDocs = await index({
                documents,
                embedder,
            });

            // 5. Store the indexed documents (vectors) in Firestore
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
            return { success: false, message: errorMessage };
        }
    }
);


export async function knowledgeBaseIngestion(input: KnowledgeBaseIngestionInput): Promise<KnowledgeBaseIngestionOutput> {
  return knowledgeBaseIngestionFlow(input);
}
