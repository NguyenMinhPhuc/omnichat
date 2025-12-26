import { NextRequest } from "next/server";
import * as controller from "@/server/controllers/authController";

export async function POST(req: NextRequest) {
  return controller.login(req);
}
