
'use server'

import { intelligentAIResponse } from '@/ai/flows/intelligent-ai-responses'
import { knowledgeBaseIngestion } from '@/ai/flows/knowledge-base-ingestion';
import type { KnowledgeBaseIngestionInput, IntelligentAIResponseInput, StoreKnowledgeBaseInput } from '@/ai/schemas';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';
import { Document } from 'genkit';
import * as genkit from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// Ensure Firebase Admin is initialized
if (!getApps().length) {
  initializeApp();
}
const db = getFirestore();

// Define the embedding model
const embedder = googleAI.embedder('text-embedding-004');


/**
 * Splits a long text into smaller chunks based on a specified chunk size and overlap.
 * @param text The full text to be split.
 * @param chunkSize The maximum size of each chunk.
 * @param chunkOverlap The number of characters to overlap between chunks.
 * @returns An array of text chunks.
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
        i += (chunkSize - chunkOverlap);
        if (i >= text.length) break;
    }
    return chunks;
}


export async function handleTextExtraction(input: KnowledgeBaseIngestionInput) {
    try {
        // Step 1: Call the simplified Genkit flow to just extract text
        const result = await knowledgeBaseIngestion(input);
        return result;
    } catch (error) {
        console.error("Error handling document ingestion:", error);
        return { success: false, message: "An unexpected error occurred during text extraction." };
    }
}

export async function storeKnowledgeBase(input: StoreKnowledgeBaseInput) {
    try {
        const { text, userId } = input;

        // Step 2: Split the extracted text into chunks
        const chunks = splitTextIntoChunks(text, 1000, 100);
        if (chunks.length === 0) {
             return { success: false, message: "Failed to split the document into processable chunks. The content might be empty." };
        }

        // Step 3: Create Document objects for Genkit
        const documents = chunks.map(chunk => Document.fromText(chunk));

        // Step 4: Index the documents (creates embeddings)
        const indexedDocs = await genkit.index({
            documents,
            embedder,
        });

        // Step 5: Store the indexed documents (vectors) in Firestore
        const vectorStoreCollection = db.collection('users').doc(userId).collection('vector_store');
        const batch = db.batch();

        indexedDocs.forEach(doc => {
            const docRef = vectorStoreCollection.doc(); // Auto-generate ID
            batch.set(docRef, Document.toObject(doc));
        });

        await batch.commit();

        // Update the main user doc to confirm it's updated.
        const userDocRef = db.collection('users').doc(userId);
        await userDocRef.set({ knowledgeBaseLastUpdatedAt: FieldValue.serverTimestamp() }, { merge: true });

        return {
            success: true,
            message: `Knowledge base updated successfully with ${indexedDocs.length} new text chunks.`
        };

    } catch (error) {
        console.error("Error during knowledge base storage:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during storage.";
        return { success: false, message: errorMessage };
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
