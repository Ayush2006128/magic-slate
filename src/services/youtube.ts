// src/services/youtube.ts
'use server';

import type { RecommendTutorialsOutput } from '@/ai/flows/recommend-tutorials';

const YOUTUBE_API_MAX_RESULTS = 5;

/**
 * Fetches YouTube tutorials based on a search query using the YouTube Data API.
 * @param searchQuery The query to search for on YouTube.
 * @returns A promise that resolves to an object containing tutorial titles and URLs.
 */
export async function fetchYouTubeTutorials(searchQuery: string): Promise<RecommendTutorialsOutput> {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    console.warn(
      'YOUTUBE_API_KEY is not set in environment variables. YouTube tutorial search will not work.'
    );
    return { tutorialTitles: [], tutorialUrls: [] };
  }

  const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
    searchQuery
  )}&type=video&key=${apiKey}&maxResults=${YOUTUBE_API_MAX_RESULTS}&relevanceLanguage=en&safeSearch=moderate`;

  try {
    const response = await fetch(apiUrl, { cache: 'no-store' }); // Disable caching for fresh results
    if (!response.ok) {
      const errorData = await response.json();
      console.error('YouTube API Error:', response.status, errorData);
      return { tutorialTitles: [], tutorialUrls: [] };
    }

    const data = await response.json();
    const items = data.items || [];

    const tutorialTitles: string[] = [];
    const tutorialUrls: string[] = [];

    items.forEach((item: any) => {
      if (item.id?.videoId && item.snippet?.title) {
        tutorialTitles.push(item.snippet.title);
        tutorialUrls.push(`https://www.youtube.com/watch?v=${item.id.videoId}`);
      }
    });

    return { tutorialTitles, tutorialUrls };
  } catch (error) {
    console.error('Failed to fetch YouTube tutorials:', error);
    return { tutorialTitles: [], tutorialUrls: [] };
  }
}
