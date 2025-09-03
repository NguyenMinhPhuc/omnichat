'use server';

import {ai} from '@/ai/genkit';
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
const leadCaptureAndResponsePrompt = ai.definePrompt({
  name: 'leadCaptureAndResponsePrompt',
  input: {
    schema: IntelligentAIResponseInputSchema,
  },
  output: {
    schema: IntelligentAIResponseOutputSchema
  },
  prompt: `You are a helpful and friendly AI assistant for a business. Your primary goal is to answer user questions based on the provided knowledge base. Your secondary goal is to identify opportunities to capture user information (leads).

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
3.  After formulating the answer, analyze the user's query and your answer. If the query suggests interest in a product, service, or requires further personalized assistance, decide if it's appropriate to ask for their contact information for follow-up.
4.  If you decide to ask for information, set the 'requestForInformation' field in your output to a list containing "name" and "email". Otherwise, leave it as an empty list or omit it.
5.  Construct your final 'response' text. It should contain your answer from the previous steps. If you are requesting information, append a friendly closing like, "Để em có thể tư vấn kỹ hơn hoặc gửi thông tin chi tiết, anh/chị vui lòng cho em biết tên và email được không ạ?" (So I can advise you better or send detailed information, could you please provide your name and email?).

Example:
User Query: "How much does the premium plan cost?"
Your Answer (based on context): "The premium plan is $50/month."
Analysis: This is a direct inquiry about a product. It's a good opportunity for follow-up.
Final response text: "The premium plan is $50/month. Để em có thể tư vấn kỹ hơn về các tính năng của gói này, anh/chị vui lòng cho em biết tên và email được không ạ?"
requestForInformation field: ["name", "email"]
`,
});

// The internal Genkit flow is defined at the module's top-level scope.
const intelligentAIResponseFlowInternal = ai.defineFlow(
  {
    name: 'intelligentAIResponseFlowInternal',
    inputSchema: IntelligentAIResponseInputSchema,
    outputSchema: IntelligentAIResponseOutputSchema,
  },
  async (input) => {
    // The context is now passed directly in the input.
    // There is no need to query the database here.
    const {output} = await leadCaptureAndResponsePrompt(input);
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
