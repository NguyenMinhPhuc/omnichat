import { UserEntity } from "../models/entities";
import * as repo from "../repositories/usersRepository";

export type ListUsersOptions = repo.ListUsersOptions;

export async function list(options?: ListUsersOptions): Promise<UserEntity[]> {
  return repo.listUsers(options ?? {});
}

export async function get(userId: string): Promise<UserEntity | null> {
  return repo.getUserById(userId);
}

export async function getByEmail(email: string): Promise<UserEntity | null> {
  return repo.getUserByEmail(email);
}

export async function create(user: UserEntity): Promise<void> {
  await repo.createUser(user);
}

export async function update(
  userId: string,
  updates: Partial<UserEntity>
): Promise<void> {
  await repo.updateUser(userId, updates);
}

export async function remove(userId: string): Promise<void> {
  await repo.deleteUser(userId);
}
