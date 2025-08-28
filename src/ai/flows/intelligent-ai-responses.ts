
'use server';

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import {
  IntelligentAIResponseInput,
  IntelligentAIResponseInputSchema,
  IntelligentAIResponseOutput,
  IntelligentAIResponseOutputSchema,
} from '@/ai/schemas';
import {getFirestore} from 'firebase-admin/firestore';
import {getApps, initializeApp} from 'firebase-admin/app';

// Ensure Firebase Admin is initialized
if (!getApps().length) {
  initializeApp();
}
const db = getFirestore();

// This is the exported async function that complies with 'use server'
export async function intelligentAIResponseFlow(
  input: IntelligentAIResponseInput
): Promise<IntelligentAIResponseOutput> {
  // RAG Prompt for Intelligent Responses with lead capture
  const leadCapturePrompt = ai.definePrompt({
    name: 'leadCapturePrompt',
    input: {
      schema: z.object({
        query: z.string(),
        context: z.array(z.string()),
      }),
    },
    output: {schema: IntelligentAIResponseOutputSchema},
    prompt: `You are a helpful and friendly AI assistant for a business. Your primary goal is to answer user questions. Your secondary goal is to identify opportunities to capture user information (leads).

Here is the context (knowledge base) you should use as your primary source of information:
<context>
{{#if context}}
{{#each context}}
- {{{this}}}
{{/each}}
{{else}}
No context provided. You must rely on your general knowledge.
{{/if}}
</context>

User's query:
<query>
{{{query}}}
</query>

Follow these steps precisely:
1.  **Analyze the user's query against the provided context.** First, formulate a direct and helpful answer to the user's query using ONLY the provided context.
2.  **If and ONLY IF the context does not contain relevant information to answer the query, then you must use your general knowledge.** Do not mention that you are using general knowledge.
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

  const knowledgeBaseCollection = db
    .collection('users')
    .doc(input.userId)
    .collection('knowledge_base');
  const knowledgeSnapshot = await knowledgeBaseCollection.get();

  let context: string[] = [];
  if (!knowledgeSnapshot.empty) {
    knowledgeSnapshot.docs.forEach(doc => {
      const data = doc.data();
      // Format each document into a "Q: ... A: ..." string
      context.push(`Q: ${data.question}\nA: ${data.answer}`);
    });
  }

  // If no context, the array will be empty, and the prompt handles it gracefully.
  const {output} = await leadCapturePrompt({
    query: input.query,
    context,
  });

  if (!output) {
    return {
      response:
        "I'm sorry, I had trouble generating a response. Please try again.",
    };
  }
  return output;
}
