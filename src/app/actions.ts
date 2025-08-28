
'use server'

import type { KnowledgeBaseIngestionInput, IntelligentAIResponseInput, KnowledgeBaseIngestionOutput } from '@/ai/schemas';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';

// Ensure Firebase Admin is initialized
if (!getApps().length) {
  initializeApp();
}
const db = getFirestore();
const genkitApiUrl = process.env.NEXT_PUBLIC_GENKIT_API_URL;

async function callGenkitFlow<Input, Output>(flowId: string, input: Input): Promise<Output> {
    if (!genkitApiUrl) {
        throw new Error("Genkit API URL is not configured. Please set NEXT_PUBLIC_GENKIT_API_URL.");
    }
    
    const url = `${genkitApiUrl}/flow/${flowId}?stream=false`;
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ input }),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`Error from Genkit API (${response.status}):`, errorBody);
            throw new Error(`Request to Genkit flow '${flowId}' failed with status ${response.status}`);
        }

        const result = await response.json();
        // The actual flow output is nested under the 'output' key
        return result.output;
    } catch (error) {
        console.error(`Failed to call Genkit flow '${flowId}':`, error);
        if (error instanceof Error) {
           throw new Error(`Network or API error calling Genkit: ${error.message}`);
        }
        throw new Error("An unknown error occurred while calling the Genkit flow.");
    }
}


export async function handleKnowledgeIngestion(input: KnowledgeBaseIngestionInput): Promise<KnowledgeBaseIngestionOutput> {
    try {
        const result = await callGenkitFlow<KnowledgeBaseIngestionInput, KnowledgeBaseIngestionOutput>('knowledgeBaseIngestionFlow', input);
        
        // If the ingestion was successful, update the user's document timestamp
        if (result.success) {
            const userDocRef = db.collection('users').doc(input.userId);
            await userDocRef.set({ knowledgeBaseLastUpdatedAt: FieldValue.serverTimestamp() }, { merge: true });
        }
        
        return result;

    } catch (error) {
        console.error("Error handling document ingestion:", error);
        const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred during ingestion.";
        return { success: false, message: errorMessage };
    }
}


export async function getAIResponse(input: IntelligentAIResponseInput) {
  try {
    const result = await callGenkitFlow<IntelligentAIResponseInput, { response: string }>('intelligentAIResponseFlow', input);
    return result;
  } catch (error) {
    console.error("Error getting AI response:", error);
    return { response: "Sorry, I encountered an error communicating with the AI service. Please try again." };
  }
}
