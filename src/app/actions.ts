
'use server';

import { intelligentAIResponseFlow } from '@/ai/flows/intelligent-ai-responses';
import { leadCaptureFlow } from '@/ai/flows/lead-qualification-flow';
import { ingestWebpage } from '@/ai/flows/webpage-ingestion-flow';
import type { WebpageIngestionInput, WebpageIngestionOutput } from '@/ai/schemas';
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore, Firestore, FieldValue, DocumentReference } from 'firebase-admin/firestore';
import type { ScenarioItem } from '@/components/ScenarioEditor';
import type { KnowledgeSource } from '@/components/Dashboard';

let db: Firestore;
let adminApp: App;

// This is the recommended way to initialize Firebase Admin SDK in a serverless environment
// It ensures the app is initialized only once.
function getDb(): Firestore {
  if (getApps().length === 0) {
    // When GOOGLE_APPLICATION_CREDENTIALS is set, initializeApp() will use it automatically.
    adminApp = initializeApp();
  } else {
    adminApp = getApps()[0];
  }
  db = getFirestore(adminApp);
  return db;
}


/**
 * Fetches an AI response using a specified Genkit flow.
 */
export async function getAIResponse({
  query,
  userId,
  flowName = 'intelligentAIResponseFlow',
  chatHistory = '',
}: {
  query: string;
  userId: string;
  flowName?: string;
  chatHistory?: string;
}): Promise<any> {
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
          
          if (userData.knowledgeBase && userData.knowledgeBase.trim() !== '') {
            knowledgeBaseParts.push("General Information:\n" + userData.knowledgeBase);
          }

          if (Array.isArray(userData.scenario) && userData.scenario.length > 0) {
            const scenarioText = userData.scenario
              .map((item: ScenarioItem) => `Q: ${item.question}\nA: ${item.answer}`)
              .join('\n\n');
            knowledgeBaseParts.push("Specific Q&A Scenarios:\n" + scenarioText);
          }

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

    let result: any;
    if (flowName === 'leadCaptureFlow') {
      result = await leadCaptureFlow({
        chatHistory,
        apiKey: userApiKey,
      });
    } else {
      result = await intelligentAIResponseFlow({
        query,
        userId,
        knowledgeBase: combinedKnowledgeBase,
        apiKey: userApiKey,
      });
    }

    return result;
  } catch (error) {
    console.error('Error getting AI response:', error);
    if (error instanceof Error && error.message.includes('429 Too Many Requests')) {
      return {
        response: "Sorry, I'm a bit overloaded at the moment. Please try again in a few minutes.",
      };
    }
    const errorMessage =
      error instanceof Error ? error.message : 'An unexpected error occurred.';
    return {
      response: `Authentication Error: Could not connect to the AI server. Please check your Gemini API Key (in your Profile page) or the system's key (if you did not provide a custom one). Ensure the API Key is valid, the Google Cloud project has billing enabled, and the Generative Language API is activated.`,
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
        const newId = firestore.collection('users').doc().id; 
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
    const now = new Date();
    const monthYear = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;

    // Step 1: Get all users
    const usersSnapshot = await firestore.collection('users').get();
    if (usersSnapshot.empty) {
      return [];
    }
    const usersData = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Step 2: Get all usage data for the current month
    const usageQuery = firestore.collection('monthlyUsage').where('monthYear', '==', monthYear);
    const usageSnapshot = await usageQuery.get();
    const usageDataMap = new Map();
    usageSnapshot.forEach(doc => {
      const data = doc.data();
      usageDataMap.set(data.userId, data);
    });
    
    // Step 3: Combine user data with their usage data
    const usersWithUsage = usersData.map(user => {
      const usageData = usageDataMap.get(user.id);
      return {
        ...user,
        totalTokens: usageData?.totalTokens || 0,
        inputTokens: usageData?.inputTokens || 0,
        outputTokens: usageData?.outputTokens || 0,
        chatRequests: usageData?.chatRequests || 0,
      };
    });
    
    return usersWithUsage;
    
  } catch (error) {
    console.error("Error fetching users with usage data:", error);
    // Throw the error to be caught by the calling component
    throw new Error("Failed to fetch users and their usage data.");
  }
}

/**
 * Fetches leads for a specific chatbot owner.
 */
export async function getLeads(userId: string) {
    if (!userId) {
        throw new Error("User ID is required.");
    }
    try {
        const firestore = getDb();
        const leadsQuery = firestore.collection('leads')
                                .where('chatbotId', '==', userId);
        const snapshot = await leadsQuery.get();
        if (snapshot.empty) {
            return [];
        }
        const leads = snapshot.docs.map(doc => {
            const data = doc.data();
            const createdAt = data.createdAt;
            return {
                id: doc.id,
                ...data,
                createdAt: createdAt && typeof createdAt.toDate === 'function' 
                    ? createdAt.toDate().toISOString() 
                    : new Date().toISOString(), 
            };
        });
        return leads;
    } catch (error) {
        console.error("Error fetching leads:", error);
        throw new Error("Failed to fetch leads.");
    }
}


/**
 * Updates the status of a specific lead.
 */
export async function updateLeadStatus(leadId: string, status: 'waiting' | 'consulted'): Promise<{ success: boolean, message: string }> {
    if (!leadId) {
        return { success: false, message: "Lead ID is required." };
    }

    try {
        const firestore = getDb();
        const leadDocRef: DocumentReference = firestore.collection('leads').doc(leadId);
        await leadDocRef.update({ status });
        return { success: true, message: "Lead status updated successfully." };
    } catch (error) {
        console.error("Error updating lead status:", error);
        const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
        return { success: false, message: `Failed to update lead status: ${errorMessage}` };
    }
}

/**
 * Ingests a webpage URL and returns a title and content summary.
 */
export async function ingestWebpageAction(
  input: WebpageIngestionInput
): Promise<{ success: boolean; data?: WebpageIngestionOutput; message?: string }> {
  try {
    // The `ingestWebpage` flow now handles API key retrieval internally,
    // so we just need to call it. `getDb()` is called implicitly inside the flow.
    const result = await ingestWebpage(input);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error in ingestWebpageAction:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message };
  }
}
