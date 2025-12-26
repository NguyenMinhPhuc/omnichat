import { KnowledgeSourceEntity } from "../models/entities";
import * as repo from "../repositories/knowledgeSourcesRepository";

export async function list(userId: string): Promise<KnowledgeSourceEntity[]> {
  return repo.listKnowledgeSources(userId);
}

export async function create(
  userId: string,
  title: string,
  content: string
): Promise<KnowledgeSourceEntity> {
  return repo.addKnowledgeSource(userId, title, content);
}

export async function update(
  id: string,
  title: string,
  content: string
): Promise<void> {
  await repo.updateKnowledgeSource(id, title, content);
}

export async function remove(id: string): Promise<void> {
  await repo.deleteKnowledgeSource(id);
}
