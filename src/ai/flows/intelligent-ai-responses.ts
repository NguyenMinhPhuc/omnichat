
'use server';

import {ai} from '@/ai/genkit';
import {googleAI, GoogleAIGeminiModel} from '@genkit-ai/googleai';
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

const basePrompt = `You are a helpful and friendly AI assistant for a business. Your primary goal is to answer user questions.

Follow these steps precisely:
1.  **Analyze the user's query.**
2.  **Consult the Knowledge Base:** If a knowledge base is provided below, you MUST use it as your primary source of information to formulate a direct and helpful answer. Prioritize the specific Q&A pairs if they directly answer the user's question.
    <knowledge_base>
    {{#if knowledgeBase}}
    {{{knowledgeBase}}}
    {{else}}
    No knowledge base provided.
    {{/if}}
    </knowledge_base>
3.  **Use General Knowledge (Fallback):** If and ONLY IF the knowledge base is not provided OR does not contain relevant information to answer the query, then you must use your general knowledge. Do not mention that you are using general knowledge or that the information is not in your database.
4.  **Construct Your Response:** Formulate your final 'response' text based on the information gathered in the previous steps.
    
User's query:
<query>
{{{query}}}
</query>
`;

// The internal Genkit flow is defined at the module's top-level scope.
const intelligentAIResponseFlowInternal = ai.defineFlow(
  {
    name: 'intelligentAIResponseFlowInternal',
    inputSchema: IntelligentAIResponseInputSchema,
    outputSchema: IntelligentAIResponseOutputSchema,
  },
  async (input) => {
    // If the combined knowledge base is empty or just whitespace, don't pass it.
    const finalInput = { ...input };
    if (!finalInput.knowledgeBase || finalInput.knowledgeBase.trim() === '') {
      finalInput.knowledgeBase = undefined;
    }

    // Determine which API key to use. Fallback to environment variable.
    const apiKey = finalInput.apiKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return {
        response:
          "I'm sorry, the chatbot is not configured correctly. An API key is missing.",
      };
    }

    // Create a model instance with the specific API key for this request.
    const model = googleAI.model('gemini-1.5-flash-latest', { apiKey });

    // Define the prompt dynamically inside the flow to use the request-specific model.
    const leadCaptureAndResponsePrompt = ai.definePrompt(
      {
        name: 'leadCaptureAndResponsePrompt_dynamic', // Use a unique name to avoid conflicts
        input: { schema: IntelligentAIResponseInputSchema },
        output: { schema: IntelligentAIResponseOutputSchema },
        model: model as GoogleAIGeminiModel, // Cast to the correct type
        prompt: basePrompt,
      },
    );
      
    // Call the defined prompt directly. Genkit will handle the generation and schema enforcement.
    const {output} = await leadCaptureAndResponsePrompt(finalInput);

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