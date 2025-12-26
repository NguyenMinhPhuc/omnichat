"use server";

import { intelligentAIResponseFlow } from "@/ai/flows/intelligent-ai-responses";
import { leadCaptureFlow } from "@/ai/flows/lead-qualification-flow";
import { ingestWebpage } from "@/ai/flows/webpage-ingestion-flow";
import type {
  WebpageIngestionInput,
  WebpageIngestionOutput,
} from "@/ai/schemas";
import type { ScenarioItem } from "@/components/ScenarioEditor";
import type { KnowledgeSource } from "@/components/Dashboard";
import * as usersService from "@/server/services/usersService";
import * as scenariosService from "@/server/services/scenariosService";
import * as ksService from "@/server/services/knowledgeSourcesService";
import * as leadsService from "@/server/services/leadsService";
import { runQuery, Types } from "@/lib/mssql";

/**
 * Fetches an AI response using a specified Genkit flow.
 */
export async function getAIResponse({
  query,
  userId,
  flowName = "intelligentAIResponseFlow",
  chatHistory = "",
}: {
  query: string;
  userId: string;
  flowName?: string;
  chatHistory?: string;
}): Promise<any> {
  try {
    if (!userId || userId.trim() === "") {
      return {
        response: "I'm sorry, but a valid chatbot ID was not provided.",
      };
    }

    const user = await usersService.get(userId);
    if (!user)
      return {
        response:
          "I'm sorry, I couldn't find the configuration for this chatbot.",
      };

    let knowledgeBaseParts: string[] = [];
    const userApiKey = user.geminiApiKey ?? undefined;

    if (user.knowledgeBase && user.knowledgeBase.trim() !== "") {
      knowledgeBaseParts.push("General Information:\n" + user.knowledgeBase);
    }

    const scenarioRows = await scenariosService.list(userId);
    if (Array.isArray(scenarioRows) && scenarioRows.length > 0) {
      const scenarioText = scenarioRows
        .map((item: ScenarioItem) => `Q: ${item.question}\nA: ${item.answer}`)
        .join("\n\n");
      knowledgeBaseParts.push("Specific Q&A Scenarios:\n" + scenarioText);
    }

    const sources = await ksService.list(userId);
    if (Array.isArray(sources) && sources.length > 0) {
      const sourcesText = sources
        .map(
          (source: KnowledgeSource) =>
            `Topic: ${source.title}\nContent:\n${source.content}`
        )
        .join("\n\n---\n\n");
      knowledgeBaseParts.push("General Knowledge Documents:\n" + sourcesText);
    }

    const combinedKnowledgeBase = knowledgeBaseParts.join("\n\n---\n\n");

    let result: any;
    if (flowName === "leadCaptureFlow") {
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
    console.error("Error getting AI response:", error);
    if (
      error instanceof Error &&
      error.message.includes("429 Too Many Requests")
    ) {
      return {
        response:
          "Sorry, I'm a bit overloaded at the moment. Please try again in a few minutes.",
      };
    }
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    return {
      response: `Authentication Error: Could not connect to the AI server. Please check your Gemini API Key (in your Profile page) or the system's key (if you did not provide a custom one). Ensure the API Key is valid, the Google Cloud project has billing enabled, and the Generative Language API is activated.`,
    };
  }
}

/**
 * Updates the user's chatbot scenario script in Firestore.
 */
export async function updateScenario(
  userId: string,
  scenario: ScenarioItem[]
): Promise<{ success: boolean; message: string }> {
  if (!userId) {
    return { success: false, message: "User ID is required." };
  }

  try {
    await scenariosService.replace(userId, scenario as any);
    return { success: true, message: "Scenario updated successfully." };
  } catch (error) {
    console.error("Error updating scenario:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    return {
      success: false,
      message: `Failed to update scenario: ${errorMessage}`,
    };
  }
}

/**
 * Adds a new knowledge source for a user.
 */
export async function addKnowledgeSource(
  userId: string,
  source: Omit<KnowledgeSource, "id">
): Promise<{ success: boolean; message: string; newSource?: KnowledgeSource }> {
  if (!userId) {
    return { success: false, message: "User ID is required." };
  }

  try {
    const newSource = await ksService.create(
      userId,
      source.title,
      source.content
    );
    return { success: true, message: "Knowledge source added.", newSource };
  } catch (error) {
    console.error("Error adding knowledge source:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    return {
      success: false,
      message: `Failed to add knowledge source: ${errorMessage}`,
    };
  }
}

/**
 * Updates an existing knowledge source for a user.
 */
export async function updateKnowledgeSource(
  userId: string,
  updatedSource: KnowledgeSource
): Promise<{ success: boolean; message: string }> {
  if (!userId || !updatedSource.id) {
    return { success: false, message: "User ID and source ID are required." };
  }

  try {
    await ksService.update(
      updatedSource.id,
      updatedSource.title,
      updatedSource.content
    );
    return { success: true, message: "Knowledge source updated." };
  } catch (error) {
    console.error("Error updating knowledge source:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    return {
      success: false,
      message: `Failed to update knowledge source: ${errorMessage}`,
    };
  }
}

/**
 * Deletes a knowledge source for a user.
 */
export async function deleteKnowledgeSource(
  userId: string,
  sourceId: string
): Promise<{ success: boolean; message: string }> {
  if (!userId || !sourceId) {
    return { success: false, message: "User ID and source ID are required." };
  }

  try {
    await ksService.remove(sourceId);
    return { success: true, message: "Knowledge source deleted." };
  } catch (error) {
    console.error("Error deleting knowledge source:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    return {
      success: false,
      message: `Failed to delete knowledge source: ${errorMessage}`,
    };
  }
}

export type ListOptions = {
  search?: string | null;
  role?: string | null;
  status?: string | null;
  sortBy?: string | null;
  sortDir?: "asc" | "desc" | null;
  page?: number;
  pageSize?: number;
};

export async function getUsersWithUsageData(options: ListOptions = {}) {
  try {
    const now = new Date();
    const monthYear = `${now.getFullYear()}-${(now.getMonth() + 1)
      .toString()
      .padStart(2, "0")}`;

    const page = options.page ?? 1;
    const pageSize = options.pageSize ?? 50;
    const skip = (page - 1) * pageSize;

    // Get users from SQL with filters/sort/pagination
    const users = await usersService.list({
      search: options.search ?? null,
      role: options.role ?? null,
      status: options.status ?? null,
      sortBy: options.sortBy ?? null,
      sortDir: options.sortDir ?? null,
      skip,
      take: pageSize,
    });

    // Get usage data for current month
    const usageResult = await runQuery(
      `SELECT UserId AS userId, TotalTokens AS totalTokens, InputTokens AS inputTokens, OutputTokens AS outputTokens, ChatRequests AS chatRequests FROM dbo.MonthlyUsage WHERE MonthYear = @monthYear`,
      { monthYear: { type: Types.NVarChar, value: monthYear } }
    );
    const usageRows = usageResult.recordset || [];
    const usageMap = new Map<string, any>();
    for (const u of usageRows) usageMap.set(u.userId, u);

    const usersWithUsage = users.map((u: any) => {
      const usage = usageMap.get(u.userId) || {};
      return {
        ...u,
        totalTokens: usage.totalTokens || 0,
        inputTokens: usage.inputTokens || 0,
        outputTokens: usage.outputTokens || 0,
        chatRequests: usage.chatRequests || 0,
      };
    });

    return usersWithUsage;
  } catch (error) {
    console.error("Error fetching users with usage data:", error);
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
    const leads = await leadsService.list(userId);
    return leads.map((l) => ({
      ...l,
      createdAt: l.createdAt
        ? (l.createdAt as Date).toISOString()
        : new Date().toISOString(),
    }));
  } catch (error) {
    console.error("Error fetching leads:", error);
    throw new Error("Failed to fetch leads.");
  }
}

/**
 * Updates the status of a specific lead.
 */
export async function updateLeadStatus(
  leadId: string,
  status: "waiting" | "consulted"
): Promise<{ success: boolean; message: string }> {
  if (!leadId) {
    return { success: false, message: "Lead ID is required." };
  }

  try {
    await leadsService.updateStatus(leadId, status);
    return { success: true, message: "Lead status updated successfully." };
  } catch (error) {
    console.error("Error updating lead status:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    return {
      success: false,
      message: `Failed to update lead status: ${errorMessage}`,
    };
  }
}

/**
 * Ingests a webpage URL and returns a title and content summary.
 * This is a server action that calls the Genkit flow.
 */
export async function ingestWebpageAction(
  input: Omit<WebpageIngestionInput, "apiKey"> // The client doesn't provide the API key
): Promise<{
  success: boolean;
  data?: WebpageIngestionOutput;
  message?: string;
}> {
  try {
    // The `ingestWebpage` function (the wrapper) will handle API key retrieval internally.
    const result = await ingestWebpage(input);
    return { success: true, data: result };
  } catch (error) {
    console.error("Error in ingestWebpageAction:", error);
    const message =
      error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, message };
  }
}
