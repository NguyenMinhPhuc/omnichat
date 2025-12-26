import { runProcedure, Types } from "@/lib/mssql";
import { KnowledgeSourceEntity } from "../models/entities";

export async function listKnowledgeSources(
  userId: string
): Promise<KnowledgeSourceEntity[]> {
  const result = await runProcedure<KnowledgeSourceEntity>(
    "spKnowledgeSources_List",
    { UserId: { type: Types.NVarChar, value: userId } }
  );
  return result.recordset ?? [];
}

export async function addKnowledgeSource(
  userId: string,
  title: string,
  content: string
): Promise<KnowledgeSourceEntity> {
  const result = await runProcedure<KnowledgeSourceEntity>(
    "spKnowledgeSources_Create",
    {
      UserId: { type: Types.NVarChar, value: userId },
      Title: { type: Types.NVarChar, value: title },
      Content: { type: Types.NVarChar, value: content },
    }
  );
  return result.recordset?.[0] as KnowledgeSourceEntity;
}

export async function updateKnowledgeSource(
  id: string,
  title: string,
  content: string
): Promise<void> {
  await runProcedure("spKnowledgeSources_Update", {
    Id: { type: Types.NVarChar, value: id },
    Title: { type: Types.NVarChar, value: title },
    Content: { type: Types.NVarChar, value: content },
  });
}

export async function deleteKnowledgeSource(id: string): Promise<void> {
  await runProcedure("spKnowledgeSources_Delete", {
    Id: { type: Types.NVarChar, value: id },
  });
}
