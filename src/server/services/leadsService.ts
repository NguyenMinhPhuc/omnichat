import { LeadEntity } from "../models/entities";
import * as repo from "../repositories/leadsRepository";

export async function list(chatbotId?: string): Promise<LeadEntity[]> {
  return repo.listLeads(chatbotId);
}

export async function create(
  lead: Omit<LeadEntity, "id" | "createdAt">
): Promise<void> {
  await repo.createLead(lead);
}

export async function updateStatus(
  id: string,
  status: "waiting" | "consulted"
): Promise<void> {
  await repo.updateLeadStatus(id, status);
}

export async function remove(id: string): Promise<void> {
  await repo.deleteLead(id);
}
