import { NextRequest, NextResponse } from "next/server";
import * as leadsService from "../services/leadsService";
import { LeadEntity } from "../models/entities";

export async function list(req: NextRequest) {
  const chatbotId = req.nextUrl.searchParams.get("chatbotId") || undefined;
  const leads = await leadsService.list(chatbotId || undefined);
  return NextResponse.json(leads);
}

export async function create(req: NextRequest) {
  const body = (await req.json()) as Partial<LeadEntity>;
  if (!body.chatbotId)
    return NextResponse.json(
      { message: "chatbotId is required" },
      { status: 400 }
    );
  const status = (body.status as LeadEntity["status"]) ?? "waiting";
  await leadsService.create({
    chatbotId: body.chatbotId,
    customerName: body.customerName ?? null,
    phoneNumber: body.phoneNumber ?? null,
    needs: body.needs ?? null,
    status,
  });
  return NextResponse.json({ message: "Created" }, { status: 201 });
}

export async function updateStatus(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = (await req.json()) as { status?: LeadEntity["status"] };
  if (!body.status)
    return NextResponse.json(
      { message: "status is required" },
      { status: 400 }
    );
  await leadsService.updateStatus(params.id, body.status);
  return NextResponse.json({ message: "Updated" });
}

export async function remove(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await leadsService.remove(params.id);
  return NextResponse.json({ message: "Deleted" });
}
