
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    googleAI({ apiKey: process.env.GEMINI_API_KEY }),
  ],
});
// AIzaSyDvmM-Xd6GUcAn3iHoPqt38DF5WA98YoYY này là một API key giả lập, không sử dụng được.
