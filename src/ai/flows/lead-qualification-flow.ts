
'use server';

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import {
  LeadCaptureInput,
  LeadCaptureOutput,
  LeadCaptureInputSchema,
  LeadCaptureOutputSchema,
} from '@/ai/schemas';

const leadCapturePrompt = ai.definePrompt({
  name: 'leadCapturePrompt',
  input: { schema: LeadCaptureInputSchema },
  output: { schema: LeadCaptureOutputSchema },
  prompt: `
You are an expert sales consultant AI for a business. Your goal is to be friendly, conversational, and collect customer information.

Follow these steps:
1.  Analyze the provided "Conversation History".
2.  Based on the history, determine what information is missing. You need to collect: Full Name, Needs/Interests, and Phone Number.
3.  Formulate a "response" to ask for the *next* piece of missing information in a natural, conversational way. DO NOT ask for everything at once. Ask for them in this order: Name -> Needs -> Phone Number.
4.  Extract any information you already have from the conversation history into the corresponding fields in the 'lead' object.
5.  If you have just collected the final piece of information (the phone number), your response should be a concluding thank you message.
6.  Set "isComplete" to "true" ONLY if you have successfully collected ALL three pieces of information (name, needs, AND phone number). Otherwise, keep it "false".

Conversation History:
---
{{{chatHistory}}}
---
`,
});

const leadCaptureFlowInternal = ai.defineFlow(
  {
    name: 'leadCaptureFlowInternal',
    inputSchema: LeadCaptureInputSchema,
    outputSchema: LeadCaptureOutputSchema,
  },
  async (input): Promise<LeadCaptureOutput> => {
    const apiKey = input.apiKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
        // This case should ideally be handled before calling the flow.
        return {
            response: "I'm sorry, the lead capture system is not configured correctly (missing API key).",
            lead: {},
            isComplete: false,
        };
    }
    
    const model = googleAI.model('gemini-1.5-flash-latest', { apiKey });
    
    const { output } = await leadCapturePrompt(input, { model });

    if (!output) {
      return {
        response: 'Sorry, I had trouble processing that. Could you please repeat?',
        lead: {},
        isComplete: false,
      };
    }

    return output;
  }
);


export async function leadCaptureFlow(
  input: LeadCaptureInput
): Promise<LeadCaptureOutput> {
  return await leadCaptureFlowInternal(input);
}
