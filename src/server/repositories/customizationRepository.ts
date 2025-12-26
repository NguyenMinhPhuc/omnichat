import { runProcedure, Types } from "@/lib/mssql";

export async function getCustomization(userId: string): Promise<any | null> {
  const res = await runProcedure<{ data: string }>("spCustomization_Get", {
    UserId: { type: Types.NVarChar, value: userId },
  });
  const row = res.recordset?.[0];
  return row && row.data ? JSON.parse(row.data) : null;
}

export async function upsertCustomization(
  userId: string,
  data: any
): Promise<void> {
  const payload = JSON.stringify(data ?? {});
  await runProcedure("spCustomization_Upsert", {
    UserId: { type: Types.NVarChar, value: userId },
    Data: { type: Types.NVarChar, value: payload },
  });
}
