'use server';
/**
 * @fileOverview An AI flow to ingest a webpage URL, extract its content,
 * and generate a title and summary.
 *
 * - ingestWebpage - A function that handles the webpage ingestion process.
 * - WebpageIngestionInputSchema - The input type for the ingestWebpage function.
 * - WebpageIngestionOutputSchema - The return type for the ingestWebpage function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { JSDOM } from 'jsdom';

// Define Zod schema for input
export const WebpageIngestionInputSchema = z.object({
  url: z.string().url().describe('The URL of the webpage to ingest.'),
  apiKey: z.string().optional().describe('The user-specific Gemini API key.'),
});
export type WebpageIngestionInput = z.infer<typeof WebpageIngestionInputSchema>;

// Define Zod schema for the output
export const WebpageIngestionOutputSchema = z.object({
  title: z.string().describe('A suitable title for the knowledge source, derived from the webpage content.'),
  content: z.string().describe('A concise summary of the key information from the webpage, formatted in Markdown.'),
});
export type WebpageIngestionOutput = z.infer<typeof WebpageIngestionOutputSchema>;


const webpageIngestionPrompt = ai.definePrompt({
  name: 'webpageIngestionPrompt',
  input: { schema: z.object({ textContent: z.string() }) },
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
  async ({ url, apiKey }) => {
    try {
      // Step 1: Fetch the webpage content
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.statusText}`);
      }
      const html = await response.text();

      // Step 2: Parse the HTML and extract readable text content
      const dom = new JSDOM(html);
      const reader = new dom.window.document.defaultView.DOMParser();
      const doc = reader.parseFromString(dom.window.document.body.innerHTML, 'text/html');
      
      // Remove script and style elements
      doc.querySelectorAll('script, style').forEach(elem => elem.remove());
      
      const textContent = doc.body.textContent || "";
      const cleanText = textContent.replace(/\s\s+/g, ' ').trim();


      // Step 3: Use the AI prompt to generate title and content
      const modelApiKey = apiKey || process.env.GEMINI_API_KEY;
       if (!modelApiKey) {
            throw new Error("API Key is missing. Please configure it in your profile or system-wide.");
       }

      const { output } = await webpageIngestionPrompt(
        { textContent: cleanText }, 
        { model: ai.model('gemini-1.5-flash-latest', { apiKey: modelApiKey }) }
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
