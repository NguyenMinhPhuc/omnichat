'use server'

import { intelligentAIResponse, IntelligentAIResponseInput } from '@/ai/flows/intelligent-ai-responses'

// Note: handleDocumentIngestion is no longer needed here as logic is in CustomizationPanel.
// It can be removed in the future if no longer referenced.
export async function handleDocumentIngestion() {
    return { success: true, message: "Handled directly in client." };
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
