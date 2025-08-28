
import { ai } from '@/ai/genkit';
import { getGenkitAPIHandler } from '@genkit-ai/next';

export const POST = getGenkitAPIHandler({ai});
