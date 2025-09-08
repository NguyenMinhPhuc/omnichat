'use server';
/**
 * @fileOverview An AI flow to ingest a webpage URL, extract its content,
 * and generate a title and summary.
 *
 * - ingestWebpage - A function that handles the webpage ingestion process.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { JSDOM } from 'jsdom';
import {
  WebpageIngestionInput,
  WebpageIngestionInputSchema,
  WebpageIngestionOutput,
  WebpageIngestionOutputSchema
} from '@/ai/schemas';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getFirestore } from 'firebase-admin/firestore';
import { getApps, initializeApp } from 'firebase-admin/app';

// This is an internal schema, not exported.
const WebpageIngestionPromptInputSchema = z.object({
  textContent: z.string(),
});

// A helper function to safely get the Firebase Admin instance
function getAdminDb() {
  if (getApps().length === 0) {
    // This relies on GOOGLE_APPLICATION_CREDENTIALS being set
    initializeApp();
  }
  return getFirestore();
}

const webpageIngestionPrompt = ai.definePrompt({
  name: 'webpageIngestionPrompt',
  input: { schema: WebpageIngestionPromptInputSchema },
  output: { schema: WebpageIngestionOutputSchema },
  prompt: `
    You are an expert content analyst. Your task is to process the text content of a webpage and generate a clear, concise knowledge source from it.

    Analyze the following webpage content:
    <webpage_content>
    {{{textContent}}}
    </webpage_content>

    Based on the content, perform the following actions:
    1.  **Generate a Title:** Create a short, descriptive title that accurately reflects the main topic of the content.
    2.  **Generate Content Summary:** Write a detailed summary of the key information from the webpage. The summary should be well-structured, easy to understand, and formatted in Markdown for readability. Focus on the most important points, definitions, and conclusions.
    `,
});

// The main flow
const webpageIngestionFlow = ai.defineFlow(
  {
    name: 'webpageIngestionFlow',
    inputSchema: WebpageIngestionInputSchema,
    outputSchema: WebpageIngestionOutputSchema,
  },
  async ({ url, userId }) => {
    try {
      // Step 0: Get API Key for the user
      const firestore = getAdminDb();
      const userDocRef = firestore.collection('users').doc(userId);
      const userDoc = await userDocRef.get();

      if (!userDoc.exists()) {
        throw new Error('User not found.');
      }
      
      const userData = userDoc.data();
      const apiKey = userData?.geminiApiKey || process.env.GEMINI_API_KEY;

      if (!apiKey) {
        throw new Error("API Key is missing for this user. Please configure it in your profile or system-wide.");
      }

      // Step 1: Fetch the webpage content
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.statusText}`);
      }
      const html = await response.text();

      // Step 2: Parse the HTML and extract readable text content
      const dom = new JSDOM(html);
      
      // Remove script and style elements
      dom.window.document.querySelectorAll('script, style').forEach(elem => elem.remove());
      
      const textContent = dom.window.document.body.textContent || "";
      const cleanText = textContent.replace(/\s\s+/g, ' ').trim();

      // Step 3: Use the AI prompt to generate title and content
      const { output } = await webpageIngestionPrompt(
        { textContent: cleanText }, 
        { model: ai.model('gemini-1.5-flash-latest', { apiKey }) }
      );

      if (!output) {
        throw new Error('The AI model failed to generate a response.');
      }
      
      return output;

    } catch (error) {
      console.error('Error in webpageIngestionFlow:', error);
      const message = error instanceof Error ? error.message : 'An unknown error occurred during webpage ingestion.';
      // We re-throw the error to be handled by the caller, which can then display it to the user.
      throw new Error(message);
    }
  }
);


// Exported async function to be called from server components/actions
export async function ingestWebpage(input: WebpageIngestionInput): Promise<WebpageIngestionOutput> {
  return await webpageIngestionFlow(input);
}
