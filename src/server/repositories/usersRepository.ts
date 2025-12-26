import { runProcedure, Types } from "@/lib/mssql";
import { UserEntity } from "../models/entities";

export async function listUsers(): Promise<UserEntity[]> {
  const result = await runProcedure<UserEntity>("spUsers_List");
  return result.recordset ?? [];
}

export async function getUserById(userId: string): Promise<UserEntity | null> {
  const result = await runProcedure<UserEntity>("spUsers_Get", {
    UserId: { type: Types.NVarChar, value: userId },
  });
  return result.recordset?.[0] ?? null;
}

export async function getUserByEmail(
  email: string
): Promise<UserEntity | null> {
  const result = await runProcedure<UserEntity>("spUsers_GetByEmail", {
    Email: { type: Types.NVarChar, value: email },
  });
  return result.recordset?.[0] ?? null;
}

export async function createUser(user: UserEntity): Promise<void> {
  await runProcedure("spUsers_Create", {
    UserId: { type: Types.NVarChar, value: user.userId },
    Email: { type: Types.NVarChar, value: user.email ?? null },
    DisplayName: { type: Types.NVarChar, value: user.displayName ?? null },
    PasswordHash: { type: Types.NVarChar, value: user.passwordHash ?? null },
    Role: { type: Types.NVarChar, value: user.role ?? null },
    Status: { type: Types.NVarChar, value: user.status ?? null },
    GeminiApiKey: { type: Types.NVarChar, value: user.geminiApiKey ?? null },
    KnowledgeBase: { type: Types.NVarChar, value: user.knowledgeBase ?? null },
    CanManageApiKey: { type: Types.Int, value: user.canManageApiKey ? 1 : 0 },
  });
}

export async function updateUser(
  userId: string,
  updates: Partial<UserEntity>
): Promise<void> {
  // Stored procedure handles partial updates (NULL keeps existing)
  await runProcedure("spUsers_UpdatePartial", {
    UserId: { type: Types.NVarChar, value: userId },
    Email: { type: Types.NVarChar, value: updates.email ?? null },
    DisplayName: { type: Types.NVarChar, value: updates.displayName ?? null },
    PasswordHash: { type: Types.NVarChar, value: updates.passwordHash ?? null },
    Role: { type: Types.NVarChar, value: updates.role ?? null },
    Status: { type: Types.NVarChar, value: updates.status ?? null },
    GeminiApiKey: { type: Types.NVarChar, value: updates.geminiApiKey ?? null },
    KnowledgeBase: {
      type: Types.NVarChar,
      value: updates.knowledgeBase ?? null,
    },
    CanManageApiKey: {
      type: Types.Int,
      value:
        updates.canManageApiKey === undefined
          ? null
          : updates.canManageApiKey
          ? 1
          : 0,
    },
  });
}

export async function deleteUser(userId: string): Promise<void> {
  await runProcedure("spUsers_Delete", {
    UserId: { type: Types.NVarChar, value: userId },
  });
}
