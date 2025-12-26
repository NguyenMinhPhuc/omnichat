import { NextRequest } from "next/server";
import * as controller from "@/server/controllers/chatsController";

export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
  // Append message
  return controller.append(req, ctx);
}

export async function PUT(req: NextRequest, ctx: { params: { id: string } }) {
  // Mark read
  return controller.markRead(req, ctx);
}
