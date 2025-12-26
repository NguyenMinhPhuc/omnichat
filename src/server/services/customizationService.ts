import * as repo from "../repositories/customizationRepository";

export async function get(userId: string) {
  return repo.getCustomization(userId);
}

export async function save(userId: string, data: any) {
  await repo.upsertCustomization(userId, data);
}
