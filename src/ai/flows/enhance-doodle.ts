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
import {z} from 'genkit';

const EnhanceDoodleInputSchema = z.object({
  doodleDataUri: z
    .string()
    .describe(
      'A drawing as a data URI that must include a MIME type and use Base64 encoding. Expected format: data:<mimetype>;base64,<encoded_data>.'
    ),
  prompt: z.string().describe('A text prompt describing the desired artwork style.'),
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

const enhanceDoodlePrompt = ai.definePrompt({
  name: 'enhanceDoodlePrompt',
  input: {schema: EnhanceDoodleInputSchema},
  output: {schema: EnhanceDoodleOutputSchema},
  prompt: [
    {media: {url: '{{{doodleDataUri}}}'}},
    {text: 'Enhance this doodle into a beautiful artwork with the following style: {{{prompt}}}.'},
  ],
  config: {
    responseModalities: ['TEXT', 'IMAGE'],
  },
});

const enhanceDoodleFlow = ai.defineFlow(
  {
    name: 'enhanceDoodleFlow',
    inputSchema: EnhanceDoodleInputSchema,
    outputSchema: EnhanceDoodleOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-exp',
      prompt: [
        {media: {url: input.doodleDataUri}},
        {text: `Enhance this doodle into a beautiful artwork with the following style: ${input.prompt}.`},
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media) {
      throw new Error('Failed to generate enhanced artwork');
    }

    return {enhancedArtworkDataUri: media.url};
  }
);