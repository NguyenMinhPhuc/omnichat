import { runProcedure, Types } from "@/lib/mssql";

export interface ChatRecord {
  id: string;
  chatbotId: string;
  messages: any;
  isRead: boolean;
  createdAt: Date;
}

export async function list(chatbotId: string): Promise<ChatRecord[]> {
  const res = await runProcedure<ChatRecord>("spChats_ListByChatbot", {
    ChatbotId: { type: Types.NVarChar, value: chatbotId },
  });
  return (res.recordset ?? []).map((r) => ({
    ...r,
    messages: JSON.parse((r as any).messages ?? "[]"),
  }));
}

export async function create(
  chatbotId: string,
  messages: any[]
): Promise<string> {
  const res = await runProcedure<{ id: string }>("spChats_Create", {
    ChatbotId: { type: Types.NVarChar, value: chatbotId },
    Messages: { type: Types.NVarChar, value: JSON.stringify(messages ?? []) },
  });
  return res.recordset?.[0]?.id ?? "";
}

export async function appendMessage(
  chatId: string,
  message: any
): Promise<void> {
  await runProcedure("spChats_AppendMessage", {
    ChatId: { type: Types.NVarChar, value: chatId },
    Message: { type: Types.NVarChar, value: JSON.stringify(message) },
  });
}

export async function markRead(chatId: string): Promise<void> {
  await runProcedure("spChats_MarkRead", {
    ChatId: { type: Types.NVarChar, value: chatId },
  });
}
