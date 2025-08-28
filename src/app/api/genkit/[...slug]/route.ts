
import { ai } from '@/ai/genkit';
import { GENKIT_API_DEFAULT_OPTIONS } from '@genkit-ai/next';

export const POST = ai.getGenkitAPIHandler(GENKIT_API_DEFAULT_OPTIONS);
