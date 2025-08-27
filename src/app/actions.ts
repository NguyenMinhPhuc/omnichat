
'use server'

import { intelligentAIResponse } from '@/ai/flows/intelligent-ai-responses'
import { knowledgeBaseIngestion } from '@/ai/flows/knowledge-base-ingestion';
import type { KnowledgeBaseIngestionInput, IntelligentAIResponseInput } from '@/ai/schemas';

// Re-exporting schemas is not allowed in 'use server' files.
// Client components will import types directly from the schema file if needed.
export type {
    KnowledgeBaseIngestionInput,
    KnowledgeBaseIngestionOutput,
    IntelligentAIResponseInput,
    IntelligentAIResponseOutput,
} from '@/ai/schemas';


export async function handleDocumentIngestion(input: KnowledgeBaseIngestionInput) {
    try {
        const result = await knowledgeBaseIngestion(input);
        return result;
    } catch (error) {
        console.error("Error handling document ingestion:", error);
        return { success: false, message: "An unexpected error occurred." };
    }
}

export async function getAIResponse(input: IntelligentAIResponseInput) {
  try {
    const result = await intelligentAIResponse(input);
    return result;
  } catch (error) {
    console.error("Error getting AI response:", error);
    return { response: "Sorry, I encountered an error. Please try again." };
  }
}
