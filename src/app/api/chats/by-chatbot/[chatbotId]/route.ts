import { NextRequest } from "next/server";
import * as controller from "@/server/controllers/chatsController";

export async function GET(
  req: NextRequest,
  ctx: { params: { chatbotId: string } }
) {
  return controller.list(req, ctx);
}

export async function POST(
  req: NextRequest,
  ctx: { params: { chatbotId: string } }
) {
  return controller.create(req, ctx);
}
