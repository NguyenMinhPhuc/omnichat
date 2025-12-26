import { NextRequest } from "next/server";
import * as controller from "@/server/controllers/customizationController";

export async function GET(req: NextRequest, ctx: { params: { id: string } }) {
  return controller.get(req, ctx);
}

export async function PUT(req: NextRequest, ctx: { params: { id: string } }) {
  return controller.upsert(req, ctx);
}
