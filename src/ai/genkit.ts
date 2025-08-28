
import {configureGenkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import * as genkitNext from '@genkit-ai/next';

export const ai = configureGenkit({
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY,
    }),
    genkitNext.plugin(),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});

export const embedder = googleAI.embedder('text-embedding-004');
