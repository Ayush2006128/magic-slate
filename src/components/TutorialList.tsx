import type { RecommendTutorialsOutput } from '@/ai/flows/recommend-tutorials';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Youtube } from 'lucide-react';

interface TutorialListProps {
  tutorials: RecommendTutorialsOutput | null;
  isLoading: boolean;
}

export function TutorialList({ tutorials, isLoading }: TutorialListProps) {
  if (isLoading) {
    return (
      <Card className="mt-6 animate-pulse">
        <CardHeader>
          <CardTitle className="font-headline">Recommended Tutorials</CardTitle>
          <CardDescription>Fetching relevant tutorials...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-8 bg-muted rounded-md"></div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!tutorials || tutorials.tutorialTitles.length === 0) {
    return null;
  }

  return (
    <Card className="mt-6 shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
          <Youtube className="h-6 w-6 text-destructive" />
          Recommended Tutorials
        </CardTitle>
        <CardDescription>Here are some tutorials you might find helpful:</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {tutorials.tutorialTitles.map((title, index) => (
            <li key={index}>
              <a
                href={tutorials.tutorialUrls[index]}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-accent hover:underline transition-colors duration-200 font-medium"
              >
                {title}
              </a>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
