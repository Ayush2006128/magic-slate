
// Implements the Genkit flow for solving mathematical equations.
'use server';

/**
 * @fileOverview A mathematical equation solver AI agent that processes handwritten equations from an image
 * and can use Google Search to find solution methods, citing its sources.
 *
 * - solveEquation - A function that handles the equation solving process.
 * - SolveEquationInput - The input type for the solveEquation function.
 * - SolveEquationOutput - The return type for the solveEquation function.
 */

import {ai} from '@/ai/genkit';
import { googleAI as googleAIPlugin } from '@genkit-ai/googleai'; // Renamed import
import type { ModelReference } from 'genkit/model';
import type { ToolDefinition } from 'genkit/tool';
// Removed: import { generate } from 'genkit/generate'; 
import {z} from 'genkit';

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
  sourceUrls: z
    .array(z.string().url())
    .optional()
    .describe(
      'A list of relevant source URLs that informed the solution. Omit if no external web sources were used or found, or if the search tool provided no relevant links.'
    ),
});
export type SolveEquationOutput = z.infer<typeof SolveEquationOutputSchema>;

const SearchGoogleToolInputSchema = z.object({
  query: z.string().describe('The search query for Google, usually the recognized equation text or related mathematical concepts.'),
});

const SearchGoogleToolOutputSchema = z.object({
  results: z.array(
    z.object({
      title: z.string().describe("The title of the search result."),
      link: z.string().url().describe("The URL of the search result."),
      snippet: z.string().describe("A brief snippet of the search result content."),
    })
  ).optional().describe("A list of search results. May be empty if no relevant results are found."),
});

const searchGoogleTool: ToolDefinition<typeof SearchGoogleToolInputSchema, typeof SearchGoogleToolOutputSchema> = {
  name: 'searchGoogleTool',
  description: 'If the equation is complex or requires specific methods not commonly known, use this tool to search Google for solution methods, explanations, or examples related to the recognized equation. This tool helps ground the solution in external knowledge.',
  inputSchema: SearchGoogleToolInputSchema,
  outputSchema: SearchGoogleToolOutputSchema,
  async execute(input) {
    console.log(`[searchGoogleTool] STUB: Would search Google for: ${input.query}, but returning no results as per stub behavior.`);
    return { results: [] }; 
  },
};
ai.defineTool(searchGoogleTool);


export async function solveEquation(input: SolveEquationInput): Promise<SolveEquationOutput> {
  return solveEquationFlow(input);
}

const systemPrompt = `You are an expert mathematician. Your task is to interpret and solve the handwritten mathematical equation provided in the image.
First, try to recognize the equation from the image and provide its text representation in 'recognizedEquationText'.
Then, solve the equation and provide the answer in the 'solution' field.

If the recognized equation is complex, non-standard, or you believe external context would improve the solution's accuracy or provide a method, you **MAY** use the 'searchGoogleTool' with the 'recognizedEquationText' (or a refined query based on it) to find relevant mathematical resources online. The 'searchGoogleTool' will attempt to find web page URLs related to your query.

If the 'searchGoogleTool' successfully returns a list of web page URLs from its 'results' (each with a 'link' field) AND you use information from those specific pages to derive your solution or method, list up to 3 of these URLs (from the 'link' field of the tool's results) in the 'sourceUrls' field of your output. Prioritize relevance if more than 3 links are provided by the tool.
Your 'sourceUrls' **MUST** come directly from the 'link' fields in the 'results' provided by 'searchGoogleTool' if you used it and it yielded useful links. **DO NOT** invent URLs or provide URLs not returned by the tool.
If the tool is not used, or if it's used but doesn't return useful/relevant URLs in its 'results', then the 'sourceUrls' field should be omitted or be an empty array.

Your primary goal is to provide an accurate solution. The search is an optional aid for complex cases.

If the image does not contain a clear mathematical equation or it's unreadable, the 'solution' field should state this.`;


const solveEquationFlow = async (input: SolveEquationInput): Promise<SolveEquationOutput> => {
  let modelToUse: ModelReference<any> | string = 'googleai/gemini-2.0-flash'; 
  const modelNameOnly = 'gemini-2.0-flash'; 

  if (input.userApiKey) {
    try {
      const userConfiguredGoogleAI = googleAIPlugin({ apiKey: input.userApiKey });
      modelToUse = userConfiguredGoogleAI.model(modelNameOnly);
    } catch (e) {
      console.error("Failed to configure Google AI with user API key for solveEquation:", e);
    }
  }

  const promptContent = [
    { text: systemPrompt },
    { media: { url: input.equationImageDataUri } },
  ];

  const result = await ai.generate({ 
    model: modelToUse, 
    prompt: promptContent,
    tools: [searchGoogleTool], 
    output: {
      schema: SolveEquationOutputSchema, 
    },
  });
  
  const output = result.output();
  if (!output) {
    throw new Error('AI did not return a parsable output for solveEquation.');
  }
  return output;
};

