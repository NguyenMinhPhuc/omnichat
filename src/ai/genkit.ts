import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY,
    }),
  ],
  // Since we are not running in a serverless environment, we need to specify where to store flow state.
  flowStateStore: 'firebase',
  // And since we are using Firebase, we need to configure it.
  firebase: {}, // Firebase config is read from gcloud project settings.
});

export const embedder = googleAI.embedder('text-embedding-004');
