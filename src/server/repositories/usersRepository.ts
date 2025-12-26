import { runProcedure, Types } from "@/lib/mssql";
import { UserEntity } from "../models/entities";

export interface ListUsersOptions {
  search?: string | null;
  role?: string | null;
  status?: string | null;
  sortBy?: string | null;
  sortDir?: "asc" | "desc" | null;
  skip?: number;
  take?: number;
}

export async function listUsers(
  options: ListUsersOptions = {}
): Promise<UserEntity[]> {
  const result = await runProcedure<UserEntity>("spUsers_List", {
    Search: { type: Types.NVarChar, value: options.search ?? null },
    Role: { type: Types.NVarChar, value: options.role ?? null },
    Status: { type: Types.NVarChar, value: options.status ?? null },
    SortBy: { type: Types.NVarChar, value: options.sortBy ?? "updatedAt" },
    SortDir: { type: Types.NVarChar, value: options.sortDir ?? "desc" },
    Skip: { type: Types.Int, value: options.skip ?? 0 },
    Take: { type: Types.Int, value: options.take ?? 100 },
  });
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
    PhoneNumber: { type: Types.NVarChar, value: user.phoneNumber ?? null },
    AvatarUrl: { type: Types.NVarChar, value: user.avatarUrl ?? null },
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
    PhoneNumber: { type: Types.NVarChar, value: updates.phoneNumber ?? null },
    AvatarUrl: { type: Types.NVarChar, value: updates.avatarUrl ?? null },
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
