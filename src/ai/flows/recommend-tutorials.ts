
// RecommendTutorials story implementation using YouTube Data API.
'use server';

/**
 * @fileOverview Recommends relevant YouTube tutorials based on the equation or doodle description using the YouTube Data API.
 *
 * - recommendTutorials - A function that handles the tutorial recommendation process.
 * - RecommendTutorialsInput - The input type for the recommendTutorials function.
 * - RecommendTutorialsOutput - The return type for the recommendTutorials function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { fetchYouTubeTutorials } from '@/services/youtube';

const RecommendTutorialsInputSchema = z.object({
  query: z.string().describe('The equation or doodle description to search tutorials for.'),
});
export type RecommendTutorialsInput = z.infer<typeof RecommendTutorialsInputSchema>;

const RecommendTutorialsOutputSchema = z.object({
  tutorialTitles: z.array(
    z.string().describe('The title of the recommended tutorial.')
  ).describe('A list of recommended tutorial titles.'),
  tutorialUrls: z.array(
    z.string().describe('The URL of the recommended tutorial. This should be a valid YouTube URL.')
  ).describe('A list of URLs for the recommended tutorials.'),
});
export type RecommendTutorialsOutput = z.infer<typeof RecommendTutorialsOutputSchema>;


const SearchYouTubeToolInputSchema = z.object({
  searchQuery: z.string().describe("The search query for YouTube tutorials."),
});

// Define the tool that uses the YouTube service
const searchYouTubeTutorialsTool = ai.defineTool(
  {
    name: 'searchYouTubeTutorialsTool',
    description: 'Searches YouTube for video tutorials based on a query and returns a list of titles and URLs. Use this tool to find actual, working video links.',
    inputSchema: SearchYouTubeToolInputSchema,
    outputSchema: RecommendTutorialsOutputSchema, // The tool directly returns data in the final expected format
  },
  async (input) => {
    // Call the new service function
    return await fetchYouTubeTutorials(input.searchQuery);
  }
);

export async function recommendTutorials(input: RecommendTutorialsInput): Promise<RecommendTutorialsOutput> {
  return recommendTutorialsFlow(input);
}

const recommendTutorialsPrompt = ai.definePrompt({
  name: 'recommendTutorialsPrompt',
  input: {schema: RecommendTutorialsInputSchema},
  output: {schema: RecommendTutorialsOutputSchema},
  tools: [searchYouTubeTutorialsTool], // Make the tool available to the LLM
  prompt: `You are a helpful assistant. Your task is to find relevant YouTube tutorials for the user's query: {{{query}}}.
You **MUST** use the \`searchYouTubeTutorialsTool\` to perform this search. Provide the user's \`{{{query}}}\` as the \`searchQuery\` to the tool.
The tool will return a list of tutorial titles and their corresponding URLs.
Your final response **MUST** be the structured data (tutorialTitles and tutorialUrls) exactly as returned by the \`searchYouTubeTutorialsTool\`.
**DO NOT** invent, hallucinate, or provide any URLs or titles that do not come directly from the \`searchYouTubeTutorialsTool\`'s output.
If the tool returns no tutorials (e.g., empty lists for titles and URLs, which can happen if the API call fails or no relevant videos are found), your response **MUST** also consist of empty lists for \`tutorialTitles\` and \`tutorialUrls\`.
Do not add any conversational text, introductions, or summaries. Only return the structured \`RecommendTutorialsOutput\`.`,
});

const recommendTutorialsFlow = ai.defineFlow(
  {
    name: 'recommendTutorialsFlow',
    inputSchema: RecommendTutorialsInputSchema,
    outputSchema: RecommendTutorialsOutputSchema,
  },
  async (input) => {
    console.log('[recommendTutorialsFlow] Input:', JSON.stringify(input, null, 2));

    const { output, errors } = await recommendTutorialsPrompt(input);

    if (errors && errors.length > 0) {
      console.error('[recommendTutorialsFlow] Errors from recommendTutorialsPrompt:', JSON.stringify(errors, null, 2));
      // If the LLM itself or the tool interaction caused an error, return empty.
      return { tutorialTitles: [], tutorialUrls: [] };
    }
    
    if (!output) {
      console.warn('[recommendTutorialsFlow] recommendTutorialsPrompt did not produce a structured output.');
      return { tutorialTitles: [], tutorialUrls: [] };
    }

    console.log('[recommendTutorialsFlow] Output from prompt:', JSON.stringify(output, null, 2));
    return output;
  }
);

