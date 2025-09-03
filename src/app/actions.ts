'use server'

import { intelligentAIResponseFlow } from '@/ai/flows/intelligent-ai-responses';
import { IntelligentAIResponseOutput } from '@/ai/schemas';

// NOTE: Firebase Admin SDK initialization has been removed to prevent crashing.
// The app will not be able to connect to Firestore from the server-side.

interface KnowledgeBaseIngestionInput {
  userId: string;
  question: string;
  answer: string;
}

interface KnowledgeBaseIngestionOutput {
    success: boolean;
    message?: string;
}

/**
 * This function is currently a stub.
 * Server-side Firestore connection is disabled.
 */
export async function handleKnowledgeIngestion(input: KnowledgeBaseIngestionInput): Promise<KnowledgeBaseIngestionOutput> {
    console.error("handleKnowledgeIngestion is disabled due to server-side Firestore connection issues.");
    return { 
        success: false, 
        message: "Server-side functionality is currently disabled." 
    };
}

interface GetAIResponseInput {
    query: string;
    userId: string;
}

/**
 * Fetches an AI response without a knowledge base context from Firestore.
 */
export async function getAIResponse({ query, userId }: GetAIResponseInput): Promise<IntelligentAIResponseOutput> {
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
