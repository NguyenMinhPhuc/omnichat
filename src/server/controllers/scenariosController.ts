import { NextRequest, NextResponse } from "next/server";
import * as svc from "../services/scenariosService";
import { ScenarioEntity } from "../models/entities";

export async function list(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const data = await svc.list(params.id);
  return NextResponse.json(data);
}

export async function replace(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = (await req.json()) as { items: ScenarioEntity[] };
  if (!Array.isArray(body.items))
    return NextResponse.json(
      { message: "items array is required" },
      { status: 400 }
    );
  await svc.replace(params.id, body.items);
  return NextResponse.json({ message: "Saved" });
}
