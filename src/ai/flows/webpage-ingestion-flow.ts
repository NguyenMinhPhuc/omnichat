
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
import { getAdminDb } from '@/lib/firebase-admin';
import { googleAI } from '@genkit-ai/googleai';

// This is an internal schema, not exported.
const WebpageIngestionPromptInputSchema = z.object({
  textContent: z.string(),
});

const webpageIngestionPrompt = ai.definePrompt({
  name: 'webpageIngestionPrompt',
  input: { schema: WebpageIngestionPromptInputSchema },
  output: { schema: WebpageIngestionOutputSchema },
  prompt: `
    You are an expert content analyst. Your task is to process the text content of a webpage and generate a clear, concise knowledge source from it.

    **Important:** The generated title and summary MUST be in the same language as the original webpage content. Do not translate the content.

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
  async ({ url, apiKey }) => {
    // Step 1: Fetch the webpage content with a browser-like User-Agent
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
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
    
    // Define the model dynamically with the provided API key
    const model = googleAI.model('gemini-1.5-flash-latest', { apiKey });

    // Step 3: Use the AI prompt to generate title and content
    const { output } = await webpageIngestionPrompt(
      { textContent: cleanText }, 
      { model } // Pass the dynamically created model instance
    );

    if (!output) {
      throw new Error('The AI model failed to generate a response.');
    }
    
    return output;
  }
);


// Exported async function to be called from server components/actions
export async function ingestWebpage(input: WebpageIngestionInput): Promise<WebpageIngestionOutput> {
   try {
      // Step 0: Get API Key for the user. This logic is now outside the flow.
      const firestore = getAdminDb();
      const userDocRef = firestore.collection('users').doc(input.userId);
      const userDoc = await userDocRef.get();

      if (!userDoc.exists) {
        throw new Error('User not found.');
      }
      
      const userData = userDoc.data();
      const apiKey = userData?.geminiApiKey || process.env.GEMINI_API_KEY;

      if (!apiKey) {
        throw new Error("API Key is missing for this user. Please configure it in your profile or system-wide.");
      }

      // Now call the flow with all the necessary data, including the API key
      return await webpageIngestionFlow({ ...input, apiKey });

    } catch (error) {
      console.error('Error in ingestWebpage function:', error);
      const message = error instanceof Error ? error.message : 'An unknown error occurred during webpage ingestion.';
      // We re-throw the error to be handled by the caller, which can then display it to the user.
      throw new Error(message);
    }
}
