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
import {z} from 'genkit';

const SolveEquationInputSchema = z.object({
  equationImageDataUri: z
    .string()
    .describe(
      "A handwritten mathematical equation as a data URI. The image must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
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

export async function solveEquation(input: SolveEquationInput): Promise<SolveEquationOutput> {
  return solveEquationFlow(input);
}

const solveEquationPrompt = ai.definePrompt({
  name: 'solveEquationPrompt',
  input: {schema: SolveEquationInputSchema},
  output: {schema: SolveEquationOutputSchema},
  prompt: `You are an expert mathematician. Your task is to interpret and solve the handwritten mathematical equation provided in the image.

Handwritten Equation Image: {{media url=equationImageDataUri}}

Your response should include the solved solution.
Additionally, if you can clearly recognize the equation, provide its text representation in the 'recognizedEquationText' field.

If the image does not contain a clear mathematical equation or it's unreadable, the 'solution' field should state this (e.g., "Could not recognize a valid equation in the image."). In this case, 'recognizedEquationText' can be omitted or be an empty string.
Provide only the solution and the recognized equation text.`,
});

const solveEquationFlow = ai.defineFlow(
  {
    name: 'solveEquationFlow',
    inputSchema: SolveEquationInputSchema,
    outputSchema: SolveEquationOutputSchema,
  },
  async input => {
    const {output} = await solveEquationPrompt(input);
    return output!;
  }
);
