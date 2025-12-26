import { NextRequest } from "next/server";
import * as controller from "@/server/controllers/scenariosController";

export async function GET(req: NextRequest, ctx: { params: { id: string } }) {
  return controller.list(req, ctx);
}

export async function PUT(req: NextRequest, ctx: { params: { id: string } }) {
  return controller.replace(req, ctx);
}

export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
  return controller.replace(req, ctx);
}
