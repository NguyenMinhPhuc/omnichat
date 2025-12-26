import { NextRequest } from "next/server";
import * as controller from "@/server/controllers/usersController";

export async function GET(req: NextRequest, ctx: { params: { id: string } }) {
  return controller.get(req, ctx);
}

export async function PUT(req: NextRequest, ctx: { params: { id: string } }) {
  return controller.update(req, ctx);
}

export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
  return controller.update(req, ctx);
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: { id: string } }
) {
  return controller.remove(req, ctx);
}
