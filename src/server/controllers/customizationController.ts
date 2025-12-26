import { NextRequest, NextResponse } from "next/server";
import * as svc from "../services/customizationService";

export async function get(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const data = await svc.get(params.id);
  return NextResponse.json({ data: data ?? {} });
}

export async function upsert(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  await svc.save(params.id, body ?? {});
  return NextResponse.json({ message: "Saved" });
}
