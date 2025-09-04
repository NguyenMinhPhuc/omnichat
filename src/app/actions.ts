'use server';

import { intelligentAIResponseFlow } from '@/ai/flows/intelligent-ai-responses';
import { IntelligentAIResponseOutput } from '@/ai/schemas';
import { initializeApp, getApps, cert, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { firebaseConfig } from '@/lib/firebaseConfig';
import type { ScenarioItem } from '@/components/ScenarioEditor';

interface GetAIResponseInput {
  query: string;
  userId: string;
}

// Initialize Firebase Admin SDK
try {
  if (!getApps().length) {
    const serviceAccount = {
      projectId: firebaseConfig.projectId,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    };
    initializeApp({
      credential: cert(serviceAccount),
    });
  }
} catch (error: any) {
  console.error('Failed to initialize Firebase Admin SDK:', error.message);
}

const db = getFirestore();

/**
 * Fetches an AI response using the Genkit flow.
 * If a knowledge base exists for the user, it's retrieved and passed to the AI.
 */
export async function getAIResponse({
  query,
  userId,
}: GetAIResponseInput): Promise<IntelligentAIResponseOutput> {
  try {
    let context: string[] = [];

    // Attempt to fetch user's knowledge base if DB is available
    if (db) {
      const userDocRef = db.collection('users').doc(userId);
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
    if (!db) {
        return { success: false, message: "Database connection not available." };
    }
    if (!userId) {
        return { success: false, message: "User ID is required." };
    }

    try {
        const userDocRef = db.collection('users').doc(userId);
        await userDocRef.update({ scenario });
        return { success: true, message: "Scenario updated successfully." };
    } catch (error) {
        console.error("Error updating scenario:", error);
        const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
        return { success: false, message: `Failed to update scenario: ${errorMessage}` };
    }
}
