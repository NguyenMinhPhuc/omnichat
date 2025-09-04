
'use server';

import { intelligentAIResponseFlow } from '@/ai/flows/intelligent-ai-responses';
import { IntelligentAIResponseOutput } from '@/ai/schemas';
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore, FieldValue } from 'firebase-admin/firestore';
import type { ScenarioItem } from '@/components/ScenarioEditor';
import type { KnowledgeSource } from '@/components/Dashboard';

let db: Firestore;
let adminApp: App | null = null;

/**
 * Initializes Firebase Admin SDK and returns a Firestore instance.
 * Ensures that initialization only happens once by reading from a physical JSON file.
 */
function getDb() {
  if (getApps().length === 0) {
    try {
      // Use require to directly read the JSON file. This is more robust than env variables for multi-line keys.
      const serviceAccount = require('../../serviceAccount.json');
      
      adminApp = initializeApp({
        credential: cert(serviceAccount),
      });
    } catch (error: any) {
      console.error('Failed to initialize Firebase Admin SDK:', error.message);
      throw new Error(`Firebase Admin SDK initialization failed: ${error.message}. Make sure 'serviceAccount.json' is present and correctly formatted in the root directory.`);
    }
  } else {
    adminApp = getApps()[0];
  }
  
  if (!db) {
     db = getFirestore(adminApp!);
  }
  return db;
}


/**
 * Fetches an AI response using the Genkit flow.
 * If a knowledge base or scenario exists for the user, it's retrieved and passed to the AI.
 */
export async function getAIResponse({
  query,
  userId,
}: {
  query: string;
  userId: string;
}): Promise<IntelligentAIResponseOutput> {
  try {
    const firestore = getDb();
    let knowledgeBaseParts: string[] = [];

    if (firestore) {
      const userDocRef = firestore.collection('users').doc(userId);
      const userDoc = await userDocRef.get();
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        if (userData) {
          
          // Add the general knowledgeBase if it exists and is not empty
          if (userData.knowledgeBase && userData.knowledgeBase.trim() !== '') {
            knowledgeBaseParts.push("General Information:\n" + userData.knowledgeBase);
          }

          // Add the scenario Q&A if it exists
          if (Array.isArray(userData.scenario) && userData.scenario.length > 0) {
            const scenarioText = userData.scenario
              .map((item: ScenarioItem) => `Q: ${item.question}\nA: ${item.answer}`)
              .join('\n\n');
            knowledgeBaseParts.push("Specific Q&A Scenarios:\n" + scenarioText);
          }

          // Add knowledge sources if they exist
          if (Array.isArray(userData.knowledgeSources) && userData.knowledgeSources.length > 0) {
            const sourcesText = userData.knowledgeSources
                .map((source: KnowledgeSource) => `Topic: ${source.title}\nContent:\n${source.content}`)
                .join('\n\n---\n\n');
            knowledgeBaseParts.push("General Knowledge Documents:\n" + sourcesText);
          }
        }
      }
    }

    const combinedKnowledgeBase = knowledgeBaseParts.join('\n\n---\n\n');

    const result = await intelligentAIResponseFlow({
      query,
      userId,
      knowledgeBase: combinedKnowledgeBase,
    });

    return result;
  } catch (error) {
    console.error('Error getting AI response:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unexpected error occurred.';
    return {
      response: `Sorry, I encountered an error: ${errorMessage}`,
    };
  }
}

/**
 * Updates the user's chatbot scenario script in Firestore.
 */
export async function updateScenario(userId: string, scenario: ScenarioItem[]): Promise<{ success: boolean; message: string }> {
    if (!userId) {
        return { success: false, message: "User ID is required." };
    }

    try {
        const firestore = getDb();
        const userDocRef = firestore.collection('users').doc(userId);
        await userDocRef.update({ scenario });
        return { success: true, message: "Scenario updated successfully." };
    } catch (error) {
        console.error("Error updating scenario:", error);
        const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
        return { success: false, message: `Failed to update scenario: ${errorMessage}` };
    }
}


/**
 * Adds a new knowledge source for a user.
 */
export async function addKnowledgeSource(userId: string, source: Omit<KnowledgeSource, 'id'>): Promise<{ success: boolean; message: string; newSource?: KnowledgeSource }> {
    if (!userId) {
        return { success: false, message: "User ID is required." };
    }

    try {
        const firestore = getDb();
        const userDocRef = firestore.collection('users').doc(userId);
        const newId = firestore.collection('users').doc().id; // Generate a new unique ID
        const newSource: KnowledgeSource = { ...source, id: newId };

        await userDocRef.update({
            knowledgeSources: FieldValue.arrayUnion(newSource)
        });

        return { success: true, message: "Knowledge source added.", newSource };
    } catch (error) {
        console.error("Error adding knowledge source:", error);
        const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
        return { success: false, message: `Failed to add knowledge source: ${errorMessage}` };
    }
}

/**
 * Updates an existing knowledge source for a user.
 */
export async function updateKnowledgeSource(userId: string, updatedSource: KnowledgeSource): Promise<{ success: boolean; message: string }> {
    if (!userId || !updatedSource.id) {
        return { success: false, message: "User ID and source ID are required." };
    }

    try {
        const firestore = getDb();
        const userDocRef = firestore.collection('users').doc(userId);
        const userDoc = await userDocRef.get();

        if (!userDoc.exists) {
            return { success: false, message: "User not found." };
        }

        const userData = userDoc.data();
        const sources: KnowledgeSource[] = userData?.knowledgeSources || [];
        const sourceIndex = sources.findIndex(s => s.id === updatedSource.id);

        if (sourceIndex === -1) {
            return { success: false, message: "Knowledge source not found." };
        }

        sources[sourceIndex] = updatedSource;

        await userDocRef.update({ knowledgeSources: sources });

        return { success: true, message: "Knowledge source updated." };
    } catch (error) {
        console.error("Error updating knowledge source:", error);
        const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
        return { success: false, message: `Failed to update knowledge source: ${errorMessage}` };
    }
}

/**
 * Deletes a knowledge source for a user.
 */
export async function deleteKnowledgeSource(userId: string, sourceId: string): Promise<{ success: boolean; message: string }> {
    if (!userId || !sourceId) {
        return { success: false, message: "User ID and source ID are required." };
    }

    try {
        const firestore = getDb();
        const userDocRef = firestore.collection('users').doc(userId);
        const userDoc = await userDocRef.get();
        
        if (!userDoc.exists) {
            return { success: false, message: "User not found." };
        }

        const userData = userDoc.data();
        const sources: KnowledgeSource[] = userData?.knowledgeSources || [];
        const updatedSources = sources.filter(s => s.id !== sourceId);

        await userDocRef.update({ knowledgeSources: updatedSources });
        
        return { success: true, message: "Knowledge source deleted." };
    } catch (error) {
        console.error("Error deleting knowledge source:", error);
        const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
        return { success: false, message: `Failed to delete knowledge source: ${errorMessage}` };
    }
}

    
