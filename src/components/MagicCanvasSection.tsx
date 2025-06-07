
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { DoodleCanvas } from '@/components/DoodleCanvas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TutorialList } from '@/components/TutorialList';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Download, Sparkles, Calculator, Palette as PaletteIcon, Eraser } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

import type { EnhanceDoodleInput, EnhanceDoodleOutput } from '@/ai/flows/enhance-doodle';
import { enhanceDoodle } from '@/ai/flows/enhance-doodle';
import type { SolveEquationInput, SolveEquationOutput } from '@/ai/flows/solve-equation';
import { solveEquation } from '@/ai/flows/solve-equation';
import type { RecommendTutorialsInput, RecommendTutorialsOutput } from '@/ai/flows/recommend-tutorials';
import { recommendTutorials } from '@/ai/flows/recommend-tutorials';

type Mode = 'doodle' | 'equation';

export function MagicCanvasSection() {
  const [mode, setMode] = useState<Mode>('doodle');
  const [prompt, setPrompt] = useState(''); // For doodle style
  const [enhancedArtwork, setEnhancedArtwork] = useState<EnhanceDoodleOutput | null>(null);
  const [originalDoodleDataUrl, setOriginalDoodleDataUrl] = useState<string | null>(null);
  const [solution, setSolution] = useState<SolveEquationOutput | null>(null);
  const [tutorials, setTutorials] = useState<RecommendTutorialsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [clearCanvasSignal, setClearCanvasSignal] = useState(false);

  const { toast } = useToast();
  const getCanvasDataUrlRef = useRef<() => string | null>(null);

  const setGetCanvasDataUrl = useCallback((callback: () => string | null) => {
    getCanvasDataUrlRef.current = callback;
  }, []);

  const resetOutputs = () => {
    setEnhancedArtwork(null);
    setOriginalDoodleDataUrl(null);
    setSolution(null);
    setTutorials(null);
  };

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    resetOutputs();
    // Optionally clear prompt if switching away from doodle mode
    if (newMode !== 'doodle') {
      setPrompt('');
    }
  };
  
  const handleCanvasClearRequest = () => {
    setClearCanvasSignal(true);
  };

  const onCanvasActuallyCleared = () => {
    resetOutputs();
    setClearCanvasSignal(false); // Reset signal
  };

  const handleProcessCanvas = async () => {
    const canvasDataUri = getCanvasDataUrlRef.current ? getCanvasDataUrlRef.current() : null;

    if (!canvasDataUri) {
      toast({ title: 'Error', description: 'Could not get canvas data. Please draw something.', variant: 'destructive' });
      return;
    }

    // Blank canvas check
    const img = new window.Image();
    img.src = canvasDataUri;
    try {
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = (e) => {
          console.error("Image load error for blank check:", e);
          reject(new Error('Image load error for blank check'));
        }
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
      toast({ title: 'Empty Canvas', description: 'Please draw or write something on the canvas.', variant: 'destructive' });
      return;
    }

    if (mode === 'doodle' && !prompt.trim()) {
      toast({ title: 'Error', description: 'Please enter an artwork style prompt for the doodle.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    resetOutputs();
    if (mode === 'doodle') setOriginalDoodleDataUrl(canvasDataUri);


    try {
      if (mode === 'doodle') {
        const enhanceInput: EnhanceDoodleInput = { doodleDataUri: canvasDataUri, prompt };
        const enhanceOutput = await enhanceDoodle(enhanceInput);
        setEnhancedArtwork(enhanceOutput);
        toast({ title: 'Doodle Enhanced!', description: 'Your artwork is ready below.' });

        const recommendInput: RecommendTutorialsInput = { query: prompt };
        const recommendOutput = await recommendTutorials(recommendInput);
        setTutorials(recommendOutput);
      } else if (mode === 'equation') {
        const solveInput: SolveEquationInput = { equationImageDataUri: canvasDataUri };
        const solveOutput = await solveEquation(solveInput);
        setSolution(solveOutput);
        toast({ title: 'Equation Processed!', description: 'The solution is displayed below.' });

        const tutorialQuery = solveOutput.recognizedEquationText || "mathematical equation help";
        const recommendInput: RecommendTutorialsInput = { query: tutorialQuery };
        const recommendOutput = await recommendTutorials(recommendInput);
        setTutorials(recommendOutput);
      }
    } catch (error) {
      console.error('Error processing canvas:', error);
      toast({ title: 'Error', description: `Could not process the canvas content. Please try again. ${error instanceof Error ? error.message : ''}`, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadArtwork = () => {
    if (enhancedArtwork?.enhancedArtworkDataUri) {
      const link = document.createElement('a');
      link.href = enhancedArtwork.enhancedArtworkDataUri;
      link.download = 'enhanced-artwork.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: 'Download Started', description: 'Your artwork is being downloaded.' });
    }
  };

  const getTitle = () => mode === 'doodle' ? 'AI Doodle Enhancer' : 'Handwritten Equation Solver';
  const getDescription = () => mode === 'doodle' 
    ? 'Draw a simple doodle, describe a style, and let AI transform it into artwork.'
    : 'Write a mathematical equation on the canvas and let AI solve it for you.';
  const getButtonIcon = () => mode === 'doodle' ? <Sparkles className="mr-2 h-5 w-5" /> : <Calculator className="mr-2 h-5 w-5" />;
  const getButtonText = () => mode === 'doodle' ? 'Enhance Doodle' : 'Solve Equation';
  
  useEffect(() => {
    // Reset outputs when mode changes to avoid showing irrelevant results
    resetOutputs();
  }, [mode]);

  return (
    <div className="space-y-6 p-2 md:p-4">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline text-2xl flex items-center gap-2">
            {mode === 'doodle' ? <PaletteIcon className="h-7 w-7 text-primary" /> : <Calculator className="h-7 w-7 text-primary" />}
            {getTitle()}
          </CardTitle>
          <CardDescription>{getDescription()}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-4">
            <Label className="text-base font-semibold">Mode:</Label>
            <RadioGroup defaultValue="doodle" onValueChange={(value) => handleModeChange(value as Mode)} className="flex gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="doodle" id="r-doodle" />
                <Label htmlFor="r-doodle" className="text-base flex items-center gap-1 cursor-pointer"><PaletteIcon size={18}/> Doodle Art</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="equation" id="r-equation" />
                <Label htmlFor="r-equation" className="text-base flex items-center gap-1 cursor-pointer"><Calculator size={18}/> Equation Solver</Label>
              </div>
            </RadioGroup>
          </div>

          <DoodleCanvas
            width={600}
            height={350}
            getCanvasDataUrl={setGetCanvasDataUrl}
            clearCanvasSignal={clearCanvasSignal}
            onClear={onCanvasActuallyCleared}
          />

          {mode === 'doodle' && (
            <div>
              <Label htmlFor="style-prompt" className="text-base">Artwork Style Prompt</Label>
              <Input
                id="style-prompt"
                type="text"
                placeholder="e.g., Van Gogh style, futuristic cityscape, watercolor landscape"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="mt-1 text-lg"
                aria-label="Enter artwork style prompt"
              />
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={handleProcessCanvas} disabled={isLoading} className="w-full sm:w-auto text-base py-3 px-6">
            {isLoading ? <LoadingSpinner className="mr-2" /> : getButtonIcon()}
            {getButtonText()}
          </Button>
           <Button variant="outline" onClick={handleCanvasClearRequest} className="w-full sm:w-auto text-base py-3 px-6 gap-2">
             <Eraser size={18} /> Clear Canvas
           </Button>
        </CardFooter>
      </Card>

      {isLoading && (
        <div className="mt-6 text-center">
          <LoadingSpinner size={48} />
          <p className="text-muted-foreground mt-2">Processing your canvas... this might take a moment.</p>
          {(mode === 'doodle' && originalDoodleDataUrl) && (
            <div className="mt-4 p-2 border border-dashed border-primary rounded-lg inline-block relative bg-white">
              <Image
                src={originalDoodleDataUrl}
                alt="Original Doodle Preview"
                width={250}
                height={175}
                className="rounded-md opacity-50"
                data-ai-hint="abstract drawing"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-background/30 backdrop-blur-sm">
                <Sparkles className="h-12 w-12 text-primary animate-ping" />
              </div>
            </div>
          )}
        </div>
      )}

      {!isLoading && mode === 'doodle' && enhancedArtwork && (
        <Card className="mt-6 shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">Enhanced Artwork</CardTitle>
            <CardDescription>Your AI-enhanced doodle:</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row gap-4 items-center justify-around">
            {originalDoodleDataUrl && (
              <div className="text-center">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Original</h3>
                <Image
                  src={originalDoodleDataUrl}
                  alt="Original Doodle"
                  width={300}
                  height={175}
                  className="rounded-lg border shadow-md bg-white"
                  data-ai-hint="sketch drawing"
                />
              </div>
            )}
            <div className="text-center">
              <h3 className="text-sm font-medium text-primary mb-2">Enhanced</h3>
              <Image
                src={enhancedArtwork.enhancedArtworkDataUri}
                alt="Enhanced Artwork"
                width={300}
                height={175}
                className="rounded-lg border-2 border-primary shadow-xl bg-white"
                data-ai-hint="digital art"
              />
            </div>
          </CardContent>
          <CardFooter className="justify-center">
            <Button onClick={handleDownloadArtwork} variant="outline" className="gap-2">
              <Download size={18} /> Download Artwork
            </Button>
          </CardFooter>
        </Card>
      )}

      {!isLoading && mode === 'equation' && solution && (
        <Card className="mt-6 shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">Solution</CardTitle>
            {solution.recognizedEquationText && (
              <CardDescription>Recognized Equation: <span className="font-mono">{solution.recognizedEquationText}</span></CardDescription>
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
      
      <TutorialList tutorials={tutorials} isLoading={isLoading && (tutorials === null)} />
    </div>
  );
}
