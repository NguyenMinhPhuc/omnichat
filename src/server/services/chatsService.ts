import * as repo from "../repositories/chatsRepository";

export async function list(chatbotId: string) {
  return repo.list(chatbotId);
}

export async function create(chatbotId: string, messages: any[]) {
  return repo.create(chatbotId, messages);
}

export async function append(chatId: string, message: any) {
  await repo.appendMessage(chatId, message);
}

export async function markRead(chatId: string) {
  await repo.markRead(chatId);
}
