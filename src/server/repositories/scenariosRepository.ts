import { runProcedure, Types } from "@/lib/mssql";
import { ScenarioEntity } from "../models/entities";

export async function listScenarios(userId: string): Promise<ScenarioEntity[]> {
  const result = await runProcedure<ScenarioEntity>("spScenarios_List", {
    UserId: { type: Types.NVarChar, value: userId },
  });
  return result.recordset ?? [];
}

export async function replaceScenarios(
  userId: string,
  items: ScenarioEntity[]
): Promise<void> {
  const itemsJson = JSON.stringify(
    items.map((i) => ({
      id: i.id,
      question: i.question,
      answer: i.answer,
      parentId: i.parentId ?? null,
    }))
  );

  await runProcedure("spScenarios_Replace", {
    UserId: { type: Types.NVarChar, value: userId },
    ItemsJson: { type: Types.NVarChar, value: itemsJson },
  });
}
