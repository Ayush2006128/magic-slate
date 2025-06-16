// src/ai/flows/enhance-doodle.ts
'use server';

/**
 * @fileOverview Enhances a simple doodle into a beautiful artwork using generative AI.
 *
 * - enhanceDoodle - A function that handles the doodle enhancement process.
 * - EnhanceDoodleInput - The input type for the enhanceDoodle function.
 * - EnhanceDoodleOutput - The return type for the enhanceDoodle function.
 */

import {ai} from '@/ai/genkit';
import { googleAI as googleAIPlugin } from '@genkit-ai/googleai';
import type { ModelReference } from 'genkit/model';
import {z, genkit} from 'genkit';

const EnhanceDoodleInputSchema = z.object({
  doodleDataUri: z
    .string()
    .describe(
      'A drawing as a data URI that must include a MIME type and use Base64 encoding. Expected format: data:<mimetype>;base64,<encoded_data>.'
    ),
  prompt: z.string().describe('A text prompt describing the desired artwork style.'),
  userApiKey: z.string().optional().describe('Optional user-provided Google AI API key.'),
});
export type EnhanceDoodleInput = z.infer<typeof EnhanceDoodleInputSchema>;

const EnhanceDoodleOutputSchema = z.object({
  enhancedArtworkDataUri: z
    .string()
    .describe('The enhanced artwork as a data URI.'),
});
export type EnhanceDoodleOutput = z.infer<typeof EnhanceDoodleOutputSchema>;

export async function enhanceDoodle(input: EnhanceDoodleInput): Promise<EnhanceDoodleOutput> {
  let aiInstance = ai; // Default to global instance
  const modelName = 'googleai/gemini-2.0-flash-exp';

  if (input.userApiKey) {
    try {
      aiInstance = genkit({
        plugins: [googleAIPlugin({ apiKey: input.userApiKey })],
        model: modelName,
      });
    } catch (e) {
      console.error("Failed to configure Google AI with user API key:", e);
      // Fallback behavior: using global 'ai' instance
      // If global 'ai' has no key, this will fail and be caught by MagicCanvasSection.
    }
  } else {
    console.warn("enhanceDoodle called without a userApiKey. Relying on global Genkit config.");
  }
  
  const {media} = await aiInstance.generate({
    prompt: [
      {media: {url: input.doodleDataUri}},
      {text: `Enhance this doodle into a beautiful artwork with the following style: ${input.prompt}.`},
    ],
    config: {
      responseModalities: ['TEXT', 'IMAGE'],
    },
  });

  if (!media?.url) {
    throw new Error('AI did not return an image. This could be due to safety filters or an issue with the API key.');
  }

  return {enhancedArtworkDataUri: media.url};
}
