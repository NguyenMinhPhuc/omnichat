'use server';

import { intelligentAIResponseFlow } from '@/ai/flows/intelligent-ai-responses';
import { IntelligentAIResponseOutput } from '@/ai/schemas';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import type { ScenarioItem } from '@/components/ScenarioEditor';
import { serviceAccount } from '@/lib/serviceAccount';

let db: Firestore;

/**
 * Initializes Firebase Admin SDK and returns a Firestore instance.
 * Ensures that initialization only happens once.
 */
function getDb() {
  if (getApps().length === 0) {
    try {
      initializeApp({
        credential: cert({
            projectId: serviceAccount.project_id,
            clientEmail: serviceAccount.client_email,
            // Replace escaped newlines with actual newlines
            privateKey: serviceAccount.private_key.replace(/\\n/g, '\n'),
        }),
      });
    } catch (error: any) {
      console.error('Failed to initialize Firebase Admin SDK:', error.message);
      throw new Error(`Firebase Admin SDK initialization failed: ${error.message}`);
    }
  }
  // Initialize db only after the app has been initialized.
  if (!db) {
     db = getFirestore();
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

    // Attempt to fetch user's knowledge base if DB is available
    if (firestore) {
      const userDocRef = firestore.collection('users').doc(userId);
      const userDoc = await userDocRef.get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        if (userData && userData.knowledgeBase) {
          context = [userData.knowledgeBase];
        }
      }
    }

    // Calling the AI flow
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
    const firestore = getDb();
    if (!firestore) {
        return { success: false, message: "Database connection not available." };
    }
    if (!userId) {
        return { success: false, message: "User ID is required." };
    }

    try {
        const userDocRef = firestore.collection('users').doc(userId);
        await userDocRef.update({ scenario });
        return { success: true, message: "Scenario updated successfully." };
    } catch (error) {
        console.error("Error updating scenario:", error);
        const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
        return { success: false, message: `Failed to update scenario: ${errorMessage}` };
    }
}
