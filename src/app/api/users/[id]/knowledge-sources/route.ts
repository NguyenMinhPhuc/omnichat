import { NextRequest } from "next/server";
import * as controller from "@/server/controllers/knowledgeSourcesController";

export async function GET(req: NextRequest, ctx: { params: { id: string } }) {
  return controller.list(req, ctx);
}

export async function POST(req: NextRequest, ctx: { params: { id: string } }) {
  return controller.create(req, ctx);
}
