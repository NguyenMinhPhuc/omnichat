import { NextRequest } from "next/server";
import * as controller from "@/server/controllers/leadsController";

export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
  return controller.updateStatus(req, ctx);
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: { id: string } }
) {
  return controller.remove(req, ctx);
}
