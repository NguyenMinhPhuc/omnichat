import { NextRequest, NextResponse } from "next/server";
import * as svc from "../services/knowledgeSourcesService";

export async function list(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const data = await svc.list(params.id);
  return NextResponse.json(data);
}

export async function create(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = (await req.json()) as { title?: string; content?: string };
  if (!body.title || !body.content)
    return NextResponse.json(
      { message: "title and content are required" },
      { status: 400 }
    );
  const row = await svc.create(params.id, body.title, body.content);
  return NextResponse.json(row, { status: 201 });
}

export async function update(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = (await req.json()) as { title?: string; content?: string };
  if (!body.title || !body.content)
    return NextResponse.json(
      { message: "title and content are required" },
      { status: 400 }
    );
  await svc.update(params.id, body.title, body.content);
  return NextResponse.json({ message: "Updated" });
}

export async function remove(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await svc.remove(params.id);
  return NextResponse.json({ message: "Deleted" });
}
