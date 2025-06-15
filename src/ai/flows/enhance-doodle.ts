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
import { googleAI as googleAIPlugin } from '@genkit-ai/googleai'; // Renamed import
import type { ModelReference } from 'genkit/model';
import {z} from 'genkit';

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
  return enhanceDoodleFlow(input);
}

// Note: ai.definePrompt and ai.defineFlow are for global registration.
// We are bypassing direct use of a predefined flow here to dynamically set the API key.
// The `enhanceDoodleFlow` function below will handle the logic directly.

const enhanceDoodleFlow = async (input: EnhanceDoodleInput): Promise<EnhanceDoodleOutput> => {
  let modelToUse: ModelReference<any> | string = 'googleai/gemini-2.0-flash-exp';

  if (input.userApiKey) {
    try {
      const userConfiguredGoogleAI = googleAIPlugin({ apiKey: input.userApiKey });
      // Ensure the model name here matches one that the plugin instance can provide
      modelToUse = userConfiguredGoogleAI.model('gemini-2.0-flash-exp');
    } catch (e) {
      console.error("Failed to configure Google AI with user API key:", e);
      // Fallback to default model or handle error appropriately
      // For now, it will use the string model name, relying on global config / env key
    }
  }
  
  const {media} = await ai.generate({ // Using the global 'ai' instance but with a potentially dynamic modelRef
    model: modelToUse,
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
};
