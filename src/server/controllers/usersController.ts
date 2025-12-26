import { NextRequest, NextResponse } from "next/server";
import * as usersService from "../services/usersService";
import { UserEntity } from "../models/entities";

export async function list(req: NextRequest) {
  const url = new URL(req.url);
  const sp = url.searchParams;
  const search = sp.get("search");
  const role = sp.get("role");
  const status = sp.get("status");
  const sortBy = sp.get("sortBy") ?? undefined;
  const sortDir = (sp.get("sortDir") ?? undefined) as
    | "asc"
    | "desc"
    | undefined;
  const page = parseInt(sp.get("page") ?? "1", 10) || 1;
  const pageSize = parseInt(sp.get("pageSize") ?? "50", 10) || 50;
  const skip = (page - 1) * pageSize;

  const users = await usersService.list({
    search,
    role,
    status,
    sortBy,
    sortDir,
    skip,
    take: pageSize,
  });
  return NextResponse.json(users);
}

export async function get(
  _req: NextRequest,
  context: { params: { id: string } } | Promise<{ params: { id: string } }>
) {
  const { params } = await context;
  const resolvedParams = await params;
  const id = resolvedParams.id;
  const user = await usersService.get(id);
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
    phoneNumber: body.phoneNumber ?? null,
    avatarUrl: body.avatarUrl ?? null,
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
  context: { params: { id: string } } | Promise<{ params: { id: string } }>
) {
  const { params } = await context;
  const resolvedParams = await params;
  const id = resolvedParams.id;
  const updates = (await req.json()) as Partial<UserEntity>;
  await usersService.update(id, updates);
  return NextResponse.json({ message: "Updated" });
}

export async function remove(
  _req: NextRequest,
  context: { params: { id: string } } | Promise<{ params: { id: string } }>
) {
  const { params } = await context;
  const resolvedParams = await params;
  const id = resolvedParams.id;
  await usersService.remove(id);
  return NextResponse.json({ message: "Deleted" });
}
