// Implements the Genkit flow for solving mathematical equations.
'use server';

/**
 * @fileOverview A mathematical equation solver AI agent that processes handwritten equations from an image.
 *
 * - solveEquation - A function that handles the equation solving process.
 * - SolveEquationInput - The input type for the solveEquation function.
 * - SolveEquationOutput - The return type for the solveEquation function.
 */

import {ai} from '@/ai/genkit';
import { googleAI as googleAIPlugin } from '@genkit-ai/googleai';
import type { ModelReference } from 'genkit/model';
import {z, genkit} from 'genkit';

const SolveEquationInputSchema = z.object({
  equationImageDataUri: z
    .string()
    .describe(
      "A handwritten mathematical equation as a data URI. The image must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  userApiKey: z.string().optional().describe('Optional user-provided Google AI API key.'),
});
export type SolveEquationInput = z.infer<typeof SolveEquationInputSchema>;

const SolveEquationOutputSchema = z.object({
  solution: z
    .string()
    .describe(
      'The solved solution to the equation, or an error message if unsolvable/unreadable.'
    ),
  recognizedEquationText: z
    .string()
    .optional()
    .describe(
      'The text representation of the recognized equation, if possible.'
    ),
});
export type SolveEquationOutput = z.infer<typeof SolveEquationOutputSchema>;

const systemPrompt = `You are an expert mathematician. Your task is to interpret and solve the handwritten mathematical equation provided in the image.
First, try to recognize the equation from the image and provide its text representation in 'recognizedEquationText'.
Then, solve the equation and provide the answer in the 'solution' field.

If the image does not contain a clear mathematical equation or it's unreadable, the 'solution' field should state this.`;

export async function solveEquation(input: SolveEquationInput): Promise<SolveEquationOutput> {
  let aiInstance = ai; // Default to global instance
  const modelName = 'googleai/gemini-2.0-flash';

  if (input.userApiKey) {
    try {
      aiInstance = genkit({
        plugins: [googleAIPlugin({ apiKey: input.userApiKey })],
        model: modelName,
      });
    } catch (e) {
      console.error("Failed to configure Google AI with user API key for solveEquation:", e);
      // Fallback behavior: using global 'ai' instance
      // If global 'ai' has no key, this will fail and be caught by MagicCanvasSection.
    }
  } else {
      console.warn("solveEquation called without a userApiKey. Relying on global Genkit config.");
  }

  const promptContent = [
    { text: systemPrompt },
    { media: { url: input.equationImageDataUri } },
  ];

  const result = await aiInstance.generate({ 
    prompt: promptContent,
    output: {
      schema: SolveEquationOutputSchema, 
    },
  });
  
  const output = result.output;
  if (!output) {
    throw new Error('AI did not return a parsable output for solveEquation.');
  }
  return output;
}
