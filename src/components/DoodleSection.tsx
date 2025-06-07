'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import type { EnhanceDoodleInput, EnhanceDoodleOutput } from '@/ai/flows/enhance-doodle';
import { enhanceDoodle } from '@/ai/flows/enhance-doodle';
import type { RecommendTutorialsInput, RecommendTutorialsOutput } from '@/ai/flows/recommend-tutorials';
import { recommendTutorials } from '@/ai/flows/recommend-tutorials';
import { DoodleCanvas } from '@/components/DoodleCanvas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TutorialList } from '@/components/TutorialList';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Download, Sparkles, Palette as PaletteIcon } from 'lucide-react';

export function DoodleSection() {
  const [prompt, setPrompt] = useState('');
  const [enhancedArtwork, setEnhancedArtwork] = useState<EnhanceDoodleOutput | null>(null);
  const [originalDoodleDataUrl, setOriginalDoodleDataUrl] = useState<string | null>(null);
  const [tutorials, setTutorials] = useState<RecommendTutorialsOutput | null>(null);
  const [isLoadingArtwork, setIsLoadingArtwork] = useState(false);
  const [isLoadingTutorials, setIsLoadingTutorials] = useState(false);
  const [clearCanvasSignal, setClearCanvasSignal] = useState(false);

  const { toast } = useToast();
  const getCanvasDataUrlRef = useRef<() => string | null>(null);

  const setGetCanvasDataUrl = useCallback((callback: () => string | null) => {
    getCanvasDataUrlRef.current = callback;
  }, []);

  const handleEnhanceDoodle = async () => {
    const doodleDataUri = getCanvasDataUrlRef.current ? getCanvasDataUrlRef.current() : null;

    if (!doodleDataUri) {
      toast({ title: 'Error', description: 'Could not get doodle data. Please try drawing something.', variant: 'destructive' });
      return;
    }
    
    // Check if canvas is effectively blank (only white background)
    const img = new window.Image();
    img.src = doodleDataUri;
    await new Promise(resolve => img.onload = resolve);
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = img.width;
    tempCanvas.height = img.height;
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) {
        toast({ title: 'Error', description: 'Canvas context error.', variant: 'destructive' });
        return;
    }
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const { data } = imageData;
    let isBlank = true;
    for (let i = 0; i < data.length; i += 4) {
        // Check if pixel is not white (or fully transparent)
        if (data[i] !== 255 || data[i+1] !== 255 || data[i+2] !== 255 || data[i+3] !== 0 && data[i+3] !== 255) {
            isBlank = false;
            break;
        }
    }

    if (isBlank) {
      toast({ title: 'Empty Doodle', description: 'Please draw something on the canvas before enhancing.', variant: 'destructive' });
      return;
    }

    if (!prompt.trim()) {
      toast({ title: 'Error', description: 'Please enter a style prompt.', variant: 'destructive' });
      return;
    }
    
    setOriginalDoodleDataUrl(doodleDataUri);
    setIsLoadingArtwork(true);
    setEnhancedArtwork(null);
    setIsLoadingTutorials(true);
    setTutorials(null);

    try {
      const enhanceInput: EnhanceDoodleInput = { doodleDataUri, prompt };
      const enhanceOutput = await enhanceDoodle(enhanceInput);
      setEnhancedArtwork(enhanceOutput);
      toast({ title: 'Doodle Enhanced!', description: 'Your artwork is ready below.' });

      const recommendInput: RecommendTutorialsInput = { query: prompt }; // Use prompt for tutorial query
      const recommendOutput = await recommendTutorials(recommendInput);
      setTutorials(recommendOutput);

    } catch (error) {
      console.error('Error processing doodle:', error);
      toast({ title: 'Error', description: 'Could not enhance the doodle. Please try again.', variant: 'destructive' });
    } finally {
      setIsLoadingArtwork(false);
      setIsLoadingTutorials(false);
    }
  };
  
  const handleDownloadArtwork = () => {
    if (enhancedArtwork?.enhancedArtworkDataUri) {
      const link = document.createElement('a');
      link.href = enhancedArtwork.enhancedArtworkDataUri;
      link.download = 'enhanced-doodle.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: 'Download Started', description: 'Your artwork is being downloaded.' });
    }
  };

  const handleCanvasClear = () => {
    setOriginalDoodleDataUrl(null);
    setEnhancedArtwork(null);
    setTutorials(null);
    setClearCanvasSignal(false); // Reset signal
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline text-2xl flex items-center gap-2">
            <PaletteIcon className="h-7 w-7 text-primary" />
            AI Doodle Enhancer
          </CardTitle>
          <CardDescription>Draw a simple doodle, describe a style, and let AI transform it into artwork.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <DoodleCanvas 
            width={500} 
            height={350} 
            getCanvasDataUrl={setGetCanvasDataUrl}
            clearCanvasSignal={clearCanvasSignal}
            onClear={handleCanvasClear}
          />
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
        </CardContent>
        <CardFooter>
          <Button onClick={handleEnhanceDoodle} disabled={isLoadingArtwork || isLoadingTutorials} className="w-full md:w-auto text-base py-3 px-6">
            {isLoadingArtwork ? <LoadingSpinner className="mr-2" /> : <Sparkles className="mr-2 h-5 w-5" />}
            Enhance Doodle
          </Button>
        </CardFooter>
      </Card>

      {isLoadingArtwork && (
        <div className="mt-6 text-center">
          <LoadingSpinner size={48} />
          <p className="text-muted-foreground mt-2">Enhancing your doodle... this might take a moment.</p>
           {originalDoodleDataUrl && (
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

      {enhancedArtwork && !isLoadingArtwork && (
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
                  height={210}
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
                height={210}
                className="rounded-lg border-2 border-primary shadow-xl bg-white"
                data-ai-hint="digital art"
              />
            </div>
          </CardContent>
          <CardFooter className="justify-center">
            <Button onClick={handleDownloadArtwork} variant="outline" className="gap-2">
              <Download size={18} />
              Download Artwork
            </Button>
          </CardFooter>
        </Card>
      )}
      
      <TutorialList tutorials={tutorials} isLoading={isLoadingTutorials} />
    </div>
  );
}
