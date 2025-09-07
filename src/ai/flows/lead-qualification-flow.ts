'use server';

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import { z } from 'zod';

// ==== Schema định nghĩa cho Lead Qualification ====
export const LeadQualificationInputSchema = z.object({
  apiKey: z.string().optional(),
  customerName: z.string().optional(),
  company: z.string().optional(),
  need: z.string().optional(),
});

export type LeadQualificationInput = z.infer<typeof LeadQualificationInputSchema>;

export const LeadQualificationOutputSchema = z.object({
  response: z.string(),              // luôn bắt buộc
  qualification: z.string().optional(), // Hot / Warm / Cold
  inputTokens: z.number(),
  outputTokens: z.number(),
  totalTokens: z.number(),
});

export type LeadQualificationOutput = z.infer<typeof LeadQualificationOutputSchema>;

// ==== Flow nội bộ ====
const leadQualificationFlowInternal = ai.defineFlow(
  {
    name: 'leadQualificationFlowInternal',
    inputSchema: LeadQualificationInputSchema,
    outputSchema: LeadQualificationOutputSchema,
  },
  async (input): Promise<LeadQualificationOutput> => {
    const apiKey = input.apiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        response: 'Thiếu API key.',
        qualification: undefined,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
      };
    }

    const model = googleAI.model('gemini-1.5-flash-latest', { apiKey });

    const qualificationPrompt = ai.definePrompt({
      name: 'leadQualificationPrompt_dynamic',
      input: { schema: LeadQualificationInputSchema },
      output: { schema: LeadQualificationOutputSchema },
      model: model,
      prompt: `
Bạn là một chuyên viên sale. Nhiệm vụ của bạn:
1. Đọc thông tin khách hàng (tên, công ty, nhu cầu).
2. Đánh giá mức độ tiềm năng: Hot / Warm / Cold.
3. Trả về câu trả lời thân thiện + trường qualification.
      `,
    });

    const { output, usage } = await qualificationPrompt(input);

    // Nếu model không trả ra output hoặc thiếu response → fallback
    if (!output || !output.response) {
      return {
        response: 'Không tạo được phản hồi từ AI.',
        qualification: undefined,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
      };
    }

    return {
      response: output.response,                 // đảm bảo string
      qualification: output.qualification,       // optional
      inputTokens: usage?.inputTokens || 0,
      outputTokens: usage?.outputTokens || 0,
      totalTokens: usage?.totalTokens || 0,
    };
  }
);

// ==== Export flow để import bên actions.ts ====
export async function leadQualificationFlow(
  input: LeadQualificationInput
): Promise<LeadQualificationOutput> {
  return await leadQualificationFlowInternal(input);
}

// Alias để tương thích nếu anh muốn gọi bằng tên khác
export async function runLeadQualificationFlow(
  input: LeadQualificationInput
): Promise<LeadQualificationOutput> {
  return await leadQualificationFlow(input);
}
