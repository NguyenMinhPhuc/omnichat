import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    googleAI(),
  ],
  // Since we are not running in a serverless environment, we need to specify where to store flow state.
  flowStateStore: 'firebase',
  // And since we are using Firebase, we need to configure it.
  firebase: {
    firestore: {
        databaseId: '(default)', // Or your specific database ID
    },
    credentials: {
      projectId: process.env.GCLOUD_PROJECT,
    }
  },
});

export const embedder = googleAI.embedder('text-embedding-004');
