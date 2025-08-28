
import {configureGenkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {nextPlugin} from '@genkit-ai/next';

export const ai = configureGenkit({
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY,
    }),
    nextPlugin,
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});

export const embedder = googleAI.embedder('text-embedding-004');
