import { NextRequest } from "next/server";
import * as controller from "@/server/controllers/usersController";

export async function GET(req: NextRequest) {
  return controller.list(req);
}

export async function POST(req: NextRequest) {
  return controller.create(req);
}
