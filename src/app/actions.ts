
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
 * Ensures that initialization only happens once, handling Next.js HMR correctly.
 */
function getDb() {
  if (getApps().length === 0) {
    try {
      const serviceAccount = require('../../serviceAccount.json');
      adminApp = initializeApp({
        credential: cert(serviceAccount),
      });
    } catch (error: any) {
      console.error('Failed to initialize Firebase Admin SDK:', error.message);
      throw new Error(`Firebase Admin SDK initialization failed: ${error.message}. Make sure 'serviceAccount.json' is present and correctly formatted in the root directory.`);
    }
  } else {
    // This ensures we get the existing app instance, crucial for HMR environments.
    adminApp = getApps()[0];
  }
  
  // Initialize Firestore instance if it hasn't been already.
  if (!db || db.app !== adminApp) {
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
    let userApiKey: string | undefined = undefined;

    if (!userId || userId.trim() === '') {
        return { response: "I'm sorry, but a valid chatbot ID was not provided." };
    }

    if (firestore) {
      const userDocRef = firestore.collection('users').doc(userId);
      const userDoc = await userDocRef.get();
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        if (userData) {
          userApiKey = userData.geminiApiKey;
          
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
      } else {
         return { response: "I'm sorry, I couldn't find the configuration for this chatbot." };
      }
    }

    const combinedKnowledgeBase = knowledgeBaseParts.join('\n\n---\n\n');

    const result = await intelligentAIResponseFlow({
      query,
      userId,
      knowledgeBase: combinedKnowledgeBase,
      apiKey: userApiKey,
    });

    // --- Start: Usage Tracking Logic ---
    if (result.totalTokens !== undefined && result.chatRequestCount !== undefined) {
      const firestore = getDb(); // Re-get db instance if needed, or ensure it's accessible
      const now = new Date();
      const monthYear = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;

      const monthlyUsageRef = firestore.collection('users').doc(userId).collection('monthlyUsage').doc(monthYear);

      try {
        await monthlyUsageRef.set({
          totalTokens: FieldValue.increment(result.totalTokens),
          inputTokens: FieldValue.increment(result.inputTokens || 0),
          outputTokens: FieldValue.increment(result.outputTokens || 0),
          chatRequests: FieldValue.increment(result.chatRequestCount),
          lastUpdated: FieldValue.serverTimestamp(),
        }, { merge: true });
      } catch (usageError) {
        console.error('Error updating monthly usage for user', userId, usageError);
        // Do not re-throw, as AI response is more critical than usage tracking
      }
    }
    // --- End: Usage Tracking Logic ---

    return result;
  } catch (error) {
    console.error('Error getting AI response:', error);

    // Check for specific quota error
    if (error instanceof Error && error.message.includes('429 Too Many Requests')) {
      return {
        response: "Xin lỗi, hiện tại tôi đang hơi quá tải một chút. Bạn vui lòng thử lại sau vài phút nhé.",
      };
    }
    
    // Generic error for other issues
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

export async function getUsersWithUsageData() {
  try {
    const firestore = getDb();
    const usersCollectionRef = firestore.collection('users');
    const usersSnapshot = await usersCollectionRef.get();

    const now = new Date();
    const monthYear = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;

    const usersWithUsagePromises = usersSnapshot.docs.map(async (userDoc) => {
      const userData = { id: userDoc.id, ...userDoc.data() };

      // Fetch current month's usage
      const monthlyUsageDocRef = userDoc.ref.collection('monthlyUsage').doc(monthYear);
      const monthlyUsageDoc = await monthlyUsageDocRef.get();

      if (monthlyUsageDoc.exists()) {
        const usageData = monthlyUsageDoc.data();
        return {
          ...userData,
          totalTokens: usageData?.totalTokens || 0,
          inputTokens: usageData?.inputTokens || 0,
          outputTokens: usageData?.outputTokens || 0,
          chatRequests: usageData?.chatRequests || 0,
        };
      } else {
        // Return user data with zero usage if no record for the current month
        return {
          ...userData,
          totalTokens: 0,
          inputTokens: 0,
          outputTokens: 0,
          chatRequests: 0,
        };
      }
    });

    const usersWithUsage = await Promise.all(usersWithUsagePromises);
    return usersWithUsage;
  } catch (error) {
    console.error("Error fetching users with monthly usage:", error);
    throw new Error("Failed to fetch users with monthly usage data.");
  }
}
    
