'use server'

import { intelligentAIResponseFlow } from '@/ai/flows/intelligent-ai-responses';
import { IntelligentAIResponseOutput } from '@/ai/schemas';

interface GetAIResponseInput {
    query: string;
    userId: string;
}

/**
 * Fetches an AI response without a knowledge base context from Firestore.
 */
export async function getAIResponse({ query, userId }: GetAIResponseİnput): Promise<IntelligentAIResponseOutput> {
  try {
    // Calling the AI flow with an empty context because Firestore connection is disabled.
    const result = await intelligentAIResponseFlow({
        query,
        userId,
        context: [] // Empty context
    });
    
    return result;

  } catch (error) {
    console.error("Error getting AI response:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return { response: `Sorry, I encountered an error: ${errorMessage}` };
  }
}