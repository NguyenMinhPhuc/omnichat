import { runProcedure, Types } from "@/lib/mssql";
import { LeadEntity } from "../models/entities";

export async function listLeads(chatbotId?: string): Promise<LeadEntity[]> {
  const result = await runProcedure<LeadEntity>("spLeads_List", {
    ChatbotId: { type: Types.NVarChar, value: chatbotId ?? null },
  });
  return result.recordset ?? [];
}

export async function createLead(
  lead: Omit<LeadEntity, "id" | "createdAt">
): Promise<void> {
  await runProcedure("spLeads_Create", {
    ChatbotId: { type: Types.NVarChar, value: lead.chatbotId },
    CustomerName: { type: Types.NVarChar, value: lead.customerName ?? null },
    PhoneNumber: { type: Types.NVarChar, value: lead.phoneNumber ?? null },
    Needs: { type: Types.NVarChar, value: lead.needs ?? null },
    Status: { type: Types.NVarChar, value: lead.status },
  });
}

export async function updateLeadStatus(
  leadId: string,
  status: "waiting" | "consulted"
): Promise<void> {
  await runProcedure("spLeads_UpdateStatus", {
    Id: { type: Types.NVarChar, value: leadId },
    Status: { type: Types.NVarChar, value: status },
  });
}

export async function deleteLead(leadId: string): Promise<void> {
  await runProcedure("spLeads_Delete", {
    Id: { type: Types.NVarChar, value: leadId },
  });
}
