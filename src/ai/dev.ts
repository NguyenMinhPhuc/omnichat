import { config } from 'dotenv';
config();

import { Document, retrieve } from 'genkit';
import { ai, embedder } from '@/ai/genkit';
import {
    KnowledgeBaseIngestionInputSchema,
    KnowledgeBaseIngestionOutputSchema,
    IntelligentAIResponseInputSchema,
    IntelligentAIResponseOutputSchema,
} from '@/ai/schemas';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';
import { z } from 'zod';

// Ensure Firebase Admin is initialized
if (!getApps().length) {
  initializeApp();
}
const db = getFirestore();

// Text Extraction Sub-Flow
const extractionPrompt = ai.definePrompt({
    name: 'knowledgeExtractionPrompt',
    model: 'googleai/gemini-1.5-flash-latest',
    input: { schema: z.object({ sourceToProcess: z.string() }) },
    output: { schema: z.object({ text: z.string() }) },
    prompt: `You are an expert at extracting raw text content from various sources.
    Analyze the provided document or website and extract all the meaningful text from it.
    Do not summarize. Do not add any commentary. Return only the extracted text.

    Source:
    {{media url=sourceToProcess}}
    `,
});

// Knowledge Base Ingestion Flow
ai.defineFlow(
    {
        name: 'knowledgeBaseIngestionFlow',
        inputSchema: KnowledgeBaseIngestionInputSchema,
        outputSchema: KnowledgeBaseIngestionOutputSchema,
    },
    async ({ source, userId }) => {
        try {
            let extractedText = '';

            // If the source is just text, no need for AI extraction
            if (source.type === 'text') {
                extractedText = source.content;
            } else {
                 // For data URIs and URLs, use the AI to extract text
                const { output } = await extractionPrompt({ sourceToProcess: source.content });
                if (!output || !output.text || !output.text.trim()) {
                     return { success: false, message: "Could not extract any text from the source." };
                }
                extractedText = output.text;
            }

            // Split the extracted text into chunks
            const chunks = splitTextIntoChunks(extractedText, 1000, 100);
            if (chunks.length === 0) {
                 return { success: false, message: "Failed to split the document into processable chunks." };
            }

            // Create Document objects for Genkit
            const documents = chunks.map(chunk => Document.fromText(chunk));

            // Index the documents (creates embeddings)
            const indexedDocs = await ai.embed({
                embedder,
                content: documents,
            });

            // Store the indexed documents (vectors) in Firestore
            const vectorStoreCollection = db.collection('users').doc(userId).collection('vector_store');
            const batch = db.batch();

            indexedDocs.forEach(doc => {
                const docRef = vectorStoreCollection.doc(); // Auto-generate ID
                batch.set(docRef, Document.toObject(doc));
            });

            await batch.commit();

            // This is now done in a separate action
            // const userDocRef = db.collection('users').doc(userId);
            // await userDocRef.set({ knowledgeBaseLastUpdatedAt: FieldValue.serverTimestamp() }, { merge: true });

            return {
                success: true,
                message: `Knowledge base updated successfully with ${indexedDocs.length} new text chunks.`
            };

        } catch (error) {
            console.error("Error during knowledge base ingestion flow:", error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            return { success: false, message: errorMessage };
        }
    }
);


// RAG Prompt for Intelligent Responses
const ragPrompt = ai.definePrompt({
    name: 'ragPrompt',
    model: 'googleai/gemini-1.5-flash-latest',
    input: { schema: z.object({
      query: z.string(),
      context: z.array(z.string()),
    }) },
    output: {schema: IntelligentAIResponseOutputSchema},
    prompt: `You are an intelligent AI assistant. Your task is to answer the user's query.
Prioritize using the provided context to formulate your answer.
If the context does not contain the answer or is not relevant to the query, use your general knowledge to respond.

Context:
{{#if context}}
{{#each context}}
- {{{this}}}
{{/each}}
{{else}}
No context provided.
{{/if}}

User Query:
{{{query}}}

Answer:`,
});

// Intelligent Response Flow
ai.defineFlow(
  {
    name: 'intelligentAIResponseFlow',
    inputSchema: IntelligentAIResponseInputSchema,
    outputSchema: IntelligentAIResponseOutputSchema,
  },
  async ({ userId, query }) => {
    const vectorStoreCollection = db.collection('users').doc(userId).collection('vector_store');
    const vectorStoreSnapshot = await vectorStoreCollection.get();

    if (vectorStoreSnapshot.empty) {
        return { response: "I haven't been configured with any knowledge. Please upload a document first." };
    }

    const documents = vectorStoreSnapshot.docs.map(doc => Document.fromObject(doc.data()));

    const relevantDocs = await retrieve({
        query,
        embedder,
        documents,
        options: { k: 5 },
    });

    const context = relevantDocs.map(doc => doc.content[0].text || '');
    
    const {output} = await ragPrompt({ query, context });
    return output!;
  }
);


/**
 * Splits a long text into smaller chunks based on a specified chunk size and overlap.
 */
function splitTextIntoChunks(text: string, chunkSize: number, chunkOverlap: number): string[] {
    if (chunkOverlap >= chunkSize) {
        throw new Error("chunkOverlap must be smaller than chunkSize.");
    }

    const chunks: string[] = [];
    let i = 0;
    while (i < text.length) {
        const end = Math.min(i + chunkSize, text.length);
        chunks.push(text.substring(i, end));
        i = i + chunkSize - chunkOverlap;
    }
    return chunks;
}
