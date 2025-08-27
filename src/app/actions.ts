'use server'

import { intelligentAIResponse, IntelligentAIResponseInput } from '@/ai/flows/intelligent-ai-responses'
import { knowledgeBaseIngestion, KnowledgeBaseIngestionInput } from '@/ai/flows/knowledge-base-ingestion';


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
