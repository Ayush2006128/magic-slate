'use client';

import { useState } from 'react';
import type { SolveEquationInput, SolveEquationOutput } from '@/ai/flows/solve-equation';
import { solveEquation } from '@/ai/flows/solve-equation';
import type { RecommendTutorialsInput, RecommendTutorialsOutput } from '@/ai/flows/recommend-tutorials';
import { recommendTutorials } from '@/ai/flows/recommend-tutorials';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TutorialList } from '@/components/TutorialList';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Calculator } from 'lucide-react';

export function EquationSolverSection() {
  const [equation, setEquation] = useState('');
  const [solution, setSolution] = useState<SolveEquationOutput | null>(null);
  const [tutorials, setTutorials] = useState<RecommendTutorialsOutput | null>(null);
  const [isLoadingSolution, setIsLoadingSolution] = useState(false);
  const [isLoadingTutorials, setIsLoadingTutorials] = useState(false);
  const { toast } = useToast();

  const handleSolveEquation = async () => {
    if (!equation.trim()) {
      toast({ title: 'Error', description: 'Please enter an equation.', variant: 'destructive' });
      return;
    }

    setIsLoadingSolution(true);
    setSolution(null);
    setIsLoadingTutorials(true);
    setTutorials(null);

    try {
      const solveInput: SolveEquationInput = { equation };
      const solveOutput = await solveEquation(solveInput);
      setSolution(solveOutput);
      toast({ title: 'Equation Solved!', description: 'The solution is displayed below.' });

      const recommendInput: RecommendTutorialsInput = { query: equation };
      const recommendOutput = await recommendTutorials(recommendInput);
      setTutorials(recommendOutput);
    } catch (error) {
      console.error('Error processing equation:', error);
      toast({ title: 'Error', description: 'Could not process the equation. Please try again.', variant: 'destructive' });
    } finally {
      setIsLoadingSolution(false);
      setIsLoadingTutorials(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline text-2xl flex items-center gap-2">
            <Calculator className="h-7 w-7 text-primary" />
            Equation Solver
          </CardTitle>
          <CardDescription>Enter a mathematical equation and let AI solve it for you.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="equation-input" className="text-base">Equation</Label>
            <Input
              id="equation-input"
              type="text"
              placeholder="e.g., 2x + 5 = 11"
              value={equation}
              onChange={(e) => setEquation(e.target.value)}
              className="mt-1 text-lg"
              aria-label="Enter mathematical equation"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSolveEquation} disabled={isLoadingSolution || isLoadingTutorials} className="w-full md:w-auto text-base py-3 px-6">
            {isLoadingSolution ? <LoadingSpinner className="mr-2" /> : null}
            Solve Equation
          </Button>
        </CardFooter>
      </Card>

      {isLoadingSolution && (
        <Card className="mt-6 animate-pulse">
          <CardHeader>
            <CardTitle className="font-headline">Solution</CardTitle>
            <CardDescription>Solving the equation...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-10 bg-muted rounded-md"></div>
          </CardContent>
        </Card>
      )}

      {solution && !isLoadingSolution && (
        <Card className="mt-6 shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">Solution</CardTitle>
            <CardDescription>The solution to your equation is:</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium text-primary bg-secondary p-4 rounded-md">
              {solution.solution}
            </p>
          </CardContent>
        </Card>
      )}

      <TutorialList tutorials={tutorials} isLoading={isLoadingTutorials} />
    </div>
  );
}
