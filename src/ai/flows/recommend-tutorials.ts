
// RecommendTutorials story implementation.
'use server';

/**
 * @fileOverview Recommends relevant YouTube tutorials based on the equation or doodle description.
 *
 * - recommendTutorials - A function that handles the tutorial recommendation process.
 * - RecommendTutorialsInput - The input type for the recommendTutorials function.
 * - RecommendTutorialsOutput - The return type for the recommendTutorials function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

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

export async function recommendTutorials(input: RecommendTutorialsInput): Promise<RecommendTutorialsOutput> {
  return recommendTutorialsFlow(input);
}

const recommendTutorialsPrompt = ai.definePrompt({
  name: 'recommendTutorialsPrompt',
  input: {schema: RecommendTutorialsInputSchema},
  output: {schema: RecommendTutorialsOutputSchema},
  prompt: `You are a helpful assistant that recommends YouTube tutorials based on a given query.

  Based on the following query, recommend relevant YouTube tutorials.
  Query: {{{query}}}

  Return a list of tutorial titles and their corresponding URLs.
  Ensure that the URLs are valid and link to publicly watchable YouTube videos that are currently available.
  Prioritize videos that are likely to be high-quality and from reputable sources if possible.
  `,
});

const recommendTutorialsFlow = ai.defineFlow(
  {
    name: 'recommendTutorialsFlow',
    inputSchema: RecommendTutorialsInputSchema,
    outputSchema: RecommendTutorialsOutputSchema,
  },
  async input => {
    const {output} = await recommendTutorialsPrompt(input);
    return output!;
  }
);

