
'use client';

import { useState, useRef, useCallback } from 'react';
import type { SolveEquationInput, SolveEquationOutput } from '@/ai/flows/solve-equation';
import { solveEquation } from '@/ai/flows/solve-equation';
import type { RecommendTutorialsInput, RecommendTutorialsOutput } from '@/ai/flows/recommend-tutorials';
import { recommendTutorials } from '@/ai/flows/recommend-tutorials';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { TutorialList } from '@/components/TutorialList';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Calculator } from 'lucide-react';
import { DoodleCanvas } from '@/components/DoodleCanvas'; // Added
import { Label } from '@/components/ui/label';

export function EquationSolverSection() {
  const [solution, setSolution] = useState<SolveEquationOutput | null>(null);
  const [tutorials, setTutorials] = useState<RecommendTutorialsOutput | null>(null);
  const [isLoadingSolution, setIsLoadingSolution] = useState(false);
  const [isLoadingTutorials, setIsLoadingTutorials] = useState(false);
  const { toast } = useToast();

  const getCanvasDataUrlRef = useRef<() => string | null>(null);
  const [clearCanvasSignal, setClearCanvasSignal] = useState(false);

  const setGetCanvasDataUrl = useCallback((callback: () => string | null) => {
    getCanvasDataUrlRef.current = callback;
  }, []);

  const handleCanvasClear = () => {
    setSolution(null);
    setTutorials(null);
    setClearCanvasSignal(true); 
  };
  
  const onCanvasCleared = () => {
    setClearCanvasSignal(false);
  }


  const handleSolveEquation = async () => {
    const equationImageDataUri = getCanvasDataUrlRef.current ? getCanvasDataUrlRef.current() : null;

    if (!equationImageDataUri) {
      toast({ title: 'Error', description: 'Could not get equation drawing. Please try writing something.', variant: 'destructive' });
      return;
    }

    // Blank canvas check
    const img = new window.Image();
    img.src = equationImageDataUri;
    // await new Promise(resolve => img.onload = resolve); // This can sometimes cause issues in specific environments, ensure it's handled or tested
    try {
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject; // Add error handling for image loading
      });
    } catch (error) {
        toast({ title: 'Error', description: 'Could not load image from canvas for validation.', variant: 'destructive' });
        return;
    }


    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = img.width;
    tempCanvas.height = img.height;
    const ctx = tempCanvas.getContext('2d');

    if (!ctx) {
        toast({ title: 'Error', description: 'Canvas context error for validation.', variant: 'destructive' });
        return;
    }
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const { data } = imageData;
    let isBlank = true;
    for (let i = 0; i < data.length; i += 4) {
        // Check if pixel is not opaque white (255,255,255,255) and is not fully transparent (alpha=0)
        if (!(data[i] === 255 && data[i+1] === 255 && data[i+2] === 255 && data[i+3] === 255) && data[i+3] !== 0) {
            isBlank = false;
            break;
        }
    }

    if (isBlank) {
      toast({ title: 'Empty Canvas', description: 'Please write an equation on the canvas before solving.', variant: 'destructive' });
      return;
    }

    setIsLoadingSolution(true);
    setSolution(null);
    setIsLoadingTutorials(true);
    setTutorials(null);

    try {
      const solveInput: SolveEquationInput = { equationImageDataUri };
      const solveOutput = await solveEquation(solveInput);
      setSolution(solveOutput);
      toast({ title: 'Equation Processed!', description: 'The solution is displayed below.' });

      const tutorialQuery = solveOutput.recognizedEquationText || "mathematical equation help";
      const recommendInput: RecommendTutorialsInput = { query: tutorialQuery };
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
            Handwritten Equation Solver
          </CardTitle>
          <CardDescription>Write a mathematical equation on the canvas and let AI solve it for you.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="equation-canvas" className="text-base mb-2 block">Write your equation here:</Label>
            <DoodleCanvas
              width={500}
              height={200}
              getCanvasDataUrl={setGetCanvasDataUrl}
              clearCanvasSignal={clearCanvasSignal}
              onClear={onCanvasCleared}
            />
          </div>
        </CardContent>
        <CardFooter className="flex-col sm:flex-row gap-2">
          <Button onClick={handleSolveEquation} disabled={isLoadingSolution || isLoadingTutorials} className="w-full sm:w-auto text-base py-3 px-6">
            {isLoadingSolution ? <LoadingSpinner className="mr-2" /> : null}
            Solve Equation
          </Button>
          {/* DoodleCanvas has its own clear button, but if an external one is desired:
          <Button variant="outline" onClick={handleCanvasClear} className="w-full sm:w-auto">
            <Eraser className="mr-2 h-4 w-4" /> Clear Canvas
          </Button>
          */}
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
            {solution.recognizedEquationText && (
                 <CardDescription>Recognized: <span className="font-mono">{solution.recognizedEquationText}</span></CardDescription>
            )}
            {!solution.recognizedEquationText && (
                <CardDescription>The solution to your equation is:</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium text-primary bg-secondary p-4 rounded-md whitespace-pre-wrap">
              {solution.solution}
            </p>
          </CardContent>
        </Card>
      )}

      <TutorialList tutorials={tutorials} isLoading={isLoadingTutorials} />
    </div>
  );
}
