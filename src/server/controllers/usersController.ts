import { NextRequest, NextResponse } from "next/server";
import * as usersService from "../services/usersService";
import { UserEntity } from "../models/entities";

export async function list(req: NextRequest) {
  const users = await usersService.list();
  return NextResponse.json(users);
}

export async function get(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await usersService.get(params.id);
  if (!user)
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  return NextResponse.json(user);
}

export async function create(req: NextRequest) {
  const body = (await req.json()) as Partial<UserEntity>;
  if (!body.userId)
    return NextResponse.json(
      { message: "userId is required" },
      { status: 400 }
    );
  await usersService.create({
    userId: body.userId,
    email: body.email ?? null,
    displayName: body.displayName ?? null,
    passwordHash: body.passwordHash ?? null,
    role: body.role ?? null,
    status: body.status ?? null,
    geminiApiKey: body.geminiApiKey ?? null,
    knowledgeBase: body.knowledgeBase ?? null,
    canManageApiKey: body.canManageApiKey ?? false,
  });
  return NextResponse.json({ message: "Created" }, { status: 201 });
}

export async function update(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const updates = (await req.json()) as Partial<UserEntity>;
  await usersService.update(params.id, updates);
  return NextResponse.json({ message: "Updated" });
}

export async function remove(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await usersService.remove(params.id);
  return NextResponse.json({ message: "Deleted" });
}
