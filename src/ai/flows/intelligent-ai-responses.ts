'use server';

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/googleai';
import {
  IntelligentAIResponseInput,
  IntelligentAIResponseOutput,
  IntelligentAIResponseOutputSchema,
  IntelligentAIResponseInputSchema,
} from '@/ai/schemas';

// This is the exported async function that complies with 'use server'
export async function intelligentAIResponseFlow(
  input: IntelligentAIResponseInput
): Promise<IntelligentAIResponseOutput> {
  return await intelligentAIResponseFlowInternal(input);
}


// Define the prompt with a more descriptive name
const leadCaptureAndResponsePrompt = `You are a helpful and friendly AI assistant for a business. Your primary goal is to answer user questions based on the provided knowledge base.

Here is the knowledge base you should use as your primary source of information:
<knowledge_base>
{{#if context}}
{{#each context}}
---
{{{this}}}
---
{{/each}}
{{else}}
There is no information in the knowledge base. You must rely on your general knowledge.
{{/if}}
</knowledge_base>

User's query:
<query>
{{{query}}}
</query>

Follow these steps precisely:
1.  **Analyze the user's query against the provided knowledge base.** First, formulate a direct and helpful answer to the user's query using ONLY the provided knowledge base.
2.  **If and ONLY IF the knowledge base does not contain relevant information to answer the query, then you must use your general knowledge.** Do not mention that you are using general knowledge or that you are an AI.
3.  Construct your final 'response' text. It should contain your answer from the previous steps.
`;

// The internal Genkit flow is defined at the module's top-level scope.
const intelligentAIResponseFlowInternal = ai.defineFlow(
  {
    name: 'intelligentAIResponseFlowInternal',
    inputSchema: IntelligentAIResponseInputSchema,
    outputSchema: IntelligentAIResponseOutputSchema,
  },
  async (input) => {
    const {output} = await ai.generate({
        prompt: leadCaptureAndResponsePrompt,
        model: googleAI.model('gemini-1.5-flash-latest'),
        input: input,
        output: {
            schema: IntelligentAIResponseOutputSchema,
        },
    });

    if (!output) {
      // This provides a more specific error message if the AI model fails to generate output.
      return {
        response:
          "I'm sorry, the AI model failed to generate a response. Please try again.",
      };
    }
    return output;
  }
);