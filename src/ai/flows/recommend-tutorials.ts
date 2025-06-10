
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
  prompt: `You are a helpful assistant. The user is looking for YouTube tutorials based on the following topic: {{{query}}}.
Your primary task is to use the 'searchYouTubeTutorialsTool' to find relevant videos.
Pass the user's '{{{query}}}' directly as the 'searchQuery' input to the 'searchYouTubeTutorialsTool'.
The tool will return the tutorial titles and URLs in the required format.
Your final response MUST be the direct output from this tool.
If the tool indicates no tutorials were found (e.g., by returning empty lists for titles and URLs), your response should also consist of empty lists for tutorialTitles and tutorialUrls.
Do not add any conversational text or summaries; only return the structured data from the tool.`,
});

const recommendTutorialsFlow = ai.defineFlow(
  {
    name: 'recommendTutorialsFlow',
    inputSchema: RecommendTutorialsInputSchema,
    outputSchema: RecommendTutorialsOutputSchema,
  },
  async (input) => {
    const { output, errors } = await recommendTutorialsPrompt(input);

    if (errors && errors.length > 0) {
      console.error('Errors from recommendTutorialsPrompt (YouTube API integration):', errors);
      // If the LLM itself or the tool interaction caused an error, return empty.
      // The tool itself handles API errors by returning empty lists, which the prompt guides the LLM to pass through.
      return { tutorialTitles: [], tutorialUrls: [] };
    }
    
    if (!output) {
      // This case means the LLM failed to produce a structured output as expected.
      console.warn('recommendTutorialsPrompt did not produce an output.');
      return { tutorialTitles: [], tutorialUrls: [] };
    }
    return output;
  }
);
