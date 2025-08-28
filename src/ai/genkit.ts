
import {genkit, configureGenkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {genkitNext} from '@genkit-ai/next';

export const ai = configureGenkit({
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY,
    }),
    genkitNext(),
  ],
  logLevel: "debug",
  enableTracingAndMetrics: true,
});

export const embedder = googleAI.embedder('text-embedding-004');
