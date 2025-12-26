import { ScenarioEntity } from "../models/entities";
import * as repo from "../repositories/scenariosRepository";

export async function list(userId: string): Promise<ScenarioEntity[]> {
  return repo.listScenarios(userId);
}

export async function replace(
  userId: string,
  items: ScenarioEntity[]
): Promise<void> {
  await repo.replaceScenarios(userId, items);
}
