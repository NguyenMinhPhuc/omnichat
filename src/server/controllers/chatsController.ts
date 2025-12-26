import { NextRequest, NextResponse } from "next/server";
import * as svc from "../services/chatsService";

export async function list(
  _req: NextRequest,
  { params }: { params: { chatbotId: string } }
) {
  const data = await svc.list(params.chatbotId);
  return NextResponse.json({ chats: data });
}

export async function create(
  req: NextRequest,
  { params }: { params: { chatbotId: string } }
) {
  const body = (await req.json()) as { messages?: any[] };
  const id = await svc.create(params.chatbotId, body.messages ?? []);
  return NextResponse.json({ id }, { status: 201 });
}

export async function append(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = (await req.json()) as { message: any };
  await svc.append(params.id, body.message);
  return NextResponse.json({ message: "Appended" });
}

export async function markRead(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await svc.markRead(params.id);
  return NextResponse.json({ message: "Marked read" });
}
