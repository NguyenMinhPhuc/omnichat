'use server';

import { intelligentAIResponseFlow } from '@/ai/flows/intelligent-ai-responses';
import { IntelligentAIResponseOutput } from '@/ai/schemas';
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import type { ScenarioItem } from '@/components/ScenarioEditor';

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
 * If a knowledge base exists for the user, it's retrieved and passed to the AI.
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
    let context: string[] = [];

    if (firestore) {
      const userDocRef = firestore.collection('users').doc(userId);
      const userDoc = await userDocRef.get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        if (userData && userData.knowledgeBase && typeof userData.knowledgeBase === 'string' && userData.knowledgeBase.trim() !== '') {
          context = [userData.knowledgeBase];
        }
      }
    }

    const result = await intelligentAIResponseFlow({
      query,
      userId,
      context,
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
