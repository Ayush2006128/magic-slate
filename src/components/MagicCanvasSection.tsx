'use client';

import { useState, useRef, useCallback, useEffect, MutableRefObject } from 'react';
import Image from 'next/image';
import { DoodleCanvas } from '@/components/DoodleCanvas';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import {
  Download,
  Sparkles,
  Calculator,
  Palette as PaletteIcon,
  Eraser,
  Settings,
  PencilLine,
  Wand2,
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useMode } from '@/app/slate/layout';
import ReactMarkdown from 'react-markdown';
import { useRouter } from 'next/navigation';

import type {
  EnhanceDoodleInput,
  EnhanceDoodleOutput,
} from '@/ai/flows/enhance-doodle';
import { enhanceDoodle } from '@/ai/flows/enhance-doodle';
import type {
  SolveEquationInput,
  SolveEquationOutput,
} from '@/ai/flows/solve-equation';
import { solveEquation } from '@/ai/flows/solve-equation';

const QUICK_COLOR_BLACK = '#000000';
const QUICK_COLOR_RED = '#ff0000';

export function MagicCanvasSection(): JSX.Element {
  const { mode } = useMode();
  const [prompt, setPrompt] = useState('');

  const [currentEnhancedArtworkUri, setCurrentEnhancedArtworkUri] =
    useState<string | null>(null);
  const [currentOriginalDoodleDataUrl, setCurrentOriginalDoodleDataUrl] =
    useState<string | null>(null);
  const [currentSolution, setCurrentSolution] =
    useState<SolveEquationOutput | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [clearCanvasSignal, setClearCanvasSignal] = useState(false);

  const [drawingColor, setDrawingColor] = useState(QUICK_COLOR_BLACK);
  const [drawingLineWidth, setDrawingLineWidth] = useState(5);

  const [isOutputDialogOpen, setIsOutputDialogOpen] = useState(false);

  const { toast } = useToast();
  const getCanvasDataUrlRef = useRef<(() => string | null) | null>(null) as MutableRefObject<(() => string | null) | null>;
  const setGetCanvasDataUrl = useCallback((callback: () => string | null) => {
    getCanvasDataUrlRef.current = callback;
  }, []);

  const router = useRouter();
  const [isCreditsModalOpen, setIsCreditsModalOpen] = useState(false);
  const [creditsType, setCreditsType] = useState<'doodle' | 'equation'>('doodle');

  const triggerHapticFeedback = (pattern: VibratePattern = 50) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (error) {
        console.warn('Haptic feedback failed:', error);
      }
    }
  };

  const resetLocalOutputs = () => {
    setCurrentEnhancedArtworkUri(null);
    setCurrentOriginalDoodleDataUrl(null);
    setCurrentSolution(null);
  };

  const handleCanvasClearRequest = () => {
    triggerHapticFeedback();
    setClearCanvasSignal(true);
  };

  const onCanvasActuallyCleared = () => {
    resetLocalOutputs();
    setClearCanvasSignal(false);
    toast({
      title: 'Canvas Cleared',
      description: 'The drawing area is now empty.',
    });
  };

  const handleProcessCanvas = async () => {
    triggerHapticFeedback();
    const canvasDataUri = getCanvasDataUrlRef.current
      ? getCanvasDataUrlRef.current()
      : null;

    if (!canvasDataUri) {
      toast({
        title: 'Error',
        description: 'Could not get canvas data. Please draw something.',
        variant: 'destructive',
      });
      return;
    }

    // --- CREDIT CHECK LOGIC ---
    let creditType: 'doodle' | 'equation' = mode;
    setCreditsType(creditType);
    let creditsRes;
    try {
      creditsRes = await fetch('/api/credits');
      if (!creditsRes.ok) throw new Error('Could not fetch credits');
    } catch {
      toast({
        title: 'Error',
        description: 'Could not check credits. Please try again.',
        variant: 'destructive',
      });
      return;
    }
    const credits = await creditsRes.json();
    const used = creditType === 'doodle' ? credits.doodleUsed : credits.equationUsed;
    const limit = creditType === 'doodle' ? credits.doodleLimit : credits.equationLimit;
    const left = limit === Infinity ? Infinity : limit - used;
    if (limit !== Infinity && left <= 0) {
      setIsCreditsModalOpen(true);
      return;
    }
    if (limit !== Infinity && left <= 5) {
      toast({
        title: 'Low Credits',
        description: `You have only ${left} ${creditType === 'doodle' ? 'doodle' : 'equation'} credits left this month.`,
        variant: 'warning',
      });
    }
    // --- END CREDIT CHECK LOGIC ---

    const img = new window.Image();
    img.src = canvasDataUri;
    try {
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () =>
          reject(new Error('Image load error for blank check'));
      });
    } catch (error) {
      toast({
        title: 'Error',
        description:
          'Could not load image from canvas for validation.',
        variant: 'destructive',
      });
      return;
    }

    const tempCanvas = document.createElement('canvas');
    if (img.width === 0 || img.height === 0) {
      toast({
        title: 'Empty Canvas',
        description: 'Please draw or write something on the canvas.',
        variant: 'destructive',
      });
      return;
    }
    tempCanvas.width = img.width;
    tempCanvas.height = img.height;
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) {
      toast({
        title: 'Error',
        description: 'Canvas context error for validation.',
        variant: 'destructive',
      });
      return;
    }
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(
      0,
      0,
      tempCanvas.width,
      tempCanvas.height
    );
    const { data } = imageData;
    let isBlank = true;
    for (let i = 0; i < data.length; i += 4) {
      if (
        !(data[i] === 255 && data[i + 1] === 255 && data[i + 2] === 255 && data[i+3] === 255) && 
        data[i + 3] !== 0 
      ) {
        isBlank = false;
        break;
      }
    }

    if (isBlank) {
      toast({
        title: 'Empty Canvas',
        description: 'Please draw or write something on the canvas.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    resetLocalOutputs();
    if (mode === 'doodle') setCurrentOriginalDoodleDataUrl(canvasDataUri);

    try {
      if (mode === 'doodle') {
        const currentPrompt = prompt.trim() || 'simple doodle';
        const enhanceInput: EnhanceDoodleInput = {
          doodleDataUri: canvasDataUri,
          prompt: currentPrompt,
        };
        const enhanceOutput = await enhanceDoodle(enhanceInput);
        setCurrentEnhancedArtworkUri(enhanceOutput.enhancedArtworkDataUri);
        toast({
          title: 'Doodle Enhanced!',
          description: 'Your artwork is ready.',
        });
      } else if (mode === 'equation') {
        const solveInput: SolveEquationInput = {
          equationImageDataUri: canvasDataUri,
        };
        const solveOutput = await solveEquation(solveInput);
        setCurrentSolution(solveOutput);
        toast({
          title: 'Equation Processed!',
          description: 'The solution is ready.',
        });
      }
      setIsOutputDialogOpen(true);
    } catch (error) {
      console.error('Error processing canvas:', error);
      toast({
        title: 'Error Processing Canvas',
        description: `Could not process. ${
          error instanceof Error ? error.message : 'Please try again.'
        }`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadArtwork = () => {
    if (currentEnhancedArtworkUri) {
      const link = document.createElement('a');
      link.href = currentEnhancedArtworkUri;
      link.download = 'enhanced-artwork.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({
        title: 'Download Started',
        description: 'Your artwork is being downloaded.',
      });
    }
  };

  useEffect(() => {
    resetLocalOutputs();
  }, [mode]);

  return (
    <TooltipProvider>
      <div className="relative w-full h-full flex flex-col overflow-hidden">
        {/* Canvas Area */}
        <div className="flex-grow relative">
          <DoodleCanvas
            getCanvasDataUrl={setGetCanvasDataUrl}
            clearCanvasSignal={clearCanvasSignal}
            onClear={onCanvasActuallyCleared}
            color={drawingColor}
            lineWidth={drawingLineWidth}
          />
           {isLoading && (
            <div className="magic-wand-loading-overlay">
              <Wand2 className="magic-wand-loading-icon" size={72} />
            </div>
          )}
        </div>
        
        {/* Floating Action Buttons */}
        <div className="fixed bottom-4 right-4 flex flex-col gap-3 z-50">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCanvasClearRequest}
                aria-label="Clear Canvas"
                className="rounded-full shadow-lg w-14 h-14 border-destructive text-destructive hover:bg-destructive/10 focus:ring-destructive/50"
              >
                <Eraser size={24} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Clear Canvas</p>
            </TooltipContent>
          </Tooltip>
          
          <Popover>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Canvas Settings"
                    className="rounded-full shadow-lg w-14 h-14"
                  >
                    <Settings className="h-6 w-6" />
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>Settings</p>
              </TooltipContent>
            </Tooltip>
            <PopoverContent
              className="w-auto p-4 space-y-4 mb-2"
              side="top"
              align="end"
            >
              {mode === 'doodle' && (
                <div className="space-y-2">
                  <Label
                    htmlFor="style-prompt-popover-fab"
                    className="flex items-center gap-1 text-sm font-medium"
                  >
                    <Sparkles size={16} className="text-primary" /> Artwork Style
                  </Label>
                  <Input
                    id="style-prompt-popover-fab"
                    type="text"
                    placeholder="e.g., Van Gogh style"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full text-sm"
                    aria-label="Enter artwork style prompt"
                  />
                  <p className="text-xs text-muted-foreground">
                    Defaults to "simple doodle" if empty.
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <Label
                  htmlFor="color-picker-popover-fab"
                  className="flex items-center gap-1 text-sm font-medium"
                >
                  <PaletteIcon size={16} className="text-primary" /> Color
                </Label>
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className={cn(
                          'h-9 w-9 p-0 border-muted-foreground/50 hover:border-primary',
                          drawingColor.toLowerCase() === QUICK_COLOR_BLACK &&
                            'ring-2 ring-primary ring-offset-2'
                        )}
                        style={{ backgroundColor: QUICK_COLOR_BLACK }}
                        onClick={() => setDrawingColor(QUICK_COLOR_BLACK)}
                        aria-label="Select black color"
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Black</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className={cn(
                          'h-9 w-9 p-0 border-muted-foreground/50 hover:border-primary',
                          drawingColor.toLowerCase() === QUICK_COLOR_RED &&
                            'ring-2 ring-primary ring-offset-2'
                        )}
                        style={{ backgroundColor: QUICK_COLOR_RED }}
                        onClick={() => setDrawingColor(QUICK_COLOR_RED)}
                        aria-label="Select red color"
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Red</p>
                    </TooltipContent>
                  </Tooltip>
                  <div className="flex items-center h-9 rounded-md border border-input px-1 bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                    <Input
                      id="color-picker-popover-fab"
                      type="color"
                      value={drawingColor}
                      onChange={(e) => setDrawingColor(e.target.value)}
                      className="h-full w-9 cursor-pointer border-none bg-transparent p-1 focus-visible:ring-0 focus-visible:ring-offset-0"
                      aria-label="Select custom drawing color"
                    />
                    <PaletteIcon
                      size={16}
                      className="text-muted-foreground ml-1"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="line-width-popover-fab"
                  className="flex items-center gap-1 text-sm font-medium"
                >
                  <PencilLine size={16} className="text-primary" /> Brush Size
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="line-width-popover-fab"
                    type="range"
                    min="1"
                    max="50"
                    value={drawingLineWidth}
                    onChange={(e) =>
                      setDrawingLineWidth(Number(e.target.value))
                    }
                    className="w-full accent-primary cursor-pointer"
                    aria-label="Select line width"
                  />
                  <span className="text-sm w-8 text-center tabular-nums">
                    {drawingLineWidth}
                  </span>
                </div>
              </div>
            </PopoverContent>
          </Popover>


          <Tooltip>
            <TooltipTrigger asChild>
              <div className="p-1 rounded-full bg-gradient-to-r from-primary to-accent shadow-lg">
                <Button
                  onClick={handleProcessCanvas}
                  disabled={isLoading}
                  variant="default"
                  size="icon"
                  className="rounded-full w-14 h-14 border-0 bg-primary hover:bg-primary/90 text-primary-foreground data-[disabled]:opacity-50 data-[disabled]:pointer-events-none"
                  aria-label={
                    mode === 'doodle' ? 'Enhance Doodle' : 'Solve Equation'
                  }
                >
                  {isLoading ? (
                    <LoadingSpinner size={24} />
                  ) : mode === 'doodle' ? (
                    <Sparkles size={24} />
                  ) : (
                    <Calculator size={24} />
                  )}
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>
                {mode === 'doodle' ? 'Enhance Doodle' : 'Solve Equation'}
              </p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Output Dialog */}
        <Dialog
          open={isOutputDialogOpen}
          onOpenChange={(isOpen) => {
            setIsOutputDialogOpen(isOpen);
            if (!isOpen) {
              resetLocalOutputs();
            }
          }}
        >
          <DialogContent className="sm:max-w-lg md:max-w-2xl max-h-[90vh] flex flex-col gap-0">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="font-headline">
                {mode === 'doodle' ? 'Enhanced Artwork' : 'Equation Solved'}
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto min-h-0 px-1 py-4">
              {isLoading && !currentEnhancedArtworkUri && !currentSolution && ( 
                <div className="text-center py-10">
                  <LoadingSpinner size={48} />
                  <p className="text-muted-foreground mt-2">Processing...</p>
                </div>
              )}
              {!isLoading && 
                mode === 'doodle' &&
                currentEnhancedArtworkUri && (
                  <div className="space-y-4">
                    <DialogDescription>
                      Your AI-enhanced doodle:
                    </DialogDescription>
                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-around">
                      {currentOriginalDoodleDataUrl && (
                        <div className="text-center">
                          <h3 className="text-sm font-medium text-muted-foreground mb-1">
                            Original
                          </h3>
                          <Image
                            src={currentOriginalDoodleDataUrl}
                            alt="Original Doodle"
                            width={200}
                            height={125}
                            className="rounded-lg border shadow-md bg-white"
                            data-ai-hint="sketch drawing"
                          />
                        </div>
                      )}
                      <div className="text-center">
                        <h3 className="text-sm font-medium text-primary mb-1">
                          Enhanced
                        </h3>
                        <Image
                          src={currentEnhancedArtworkUri}
                          alt="Enhanced Artwork"
                          width={200}
                          height={125}
                          className="rounded-lg border-2 border-primary shadow-xl bg-white"
                          data-ai-hint="digital art"
                        />
                      </div>
                    </div>
                    <Button
                      onClick={handleDownloadArtwork}
                      variant="outline"
                      className="w-full gap-2 mt-2"
                    >
                      <Download size={18} /> Download Artwork
                    </Button>
                  </div>
                )}

              {!isLoading && mode === 'equation' && currentSolution && (
                <div className="space-y-4">
                  {currentSolution.recognizedEquationText && (
                    <DialogDescription>
                      Recognized:{' '}
                      <span className="font-mono">
                        {currentSolution.recognizedEquationText}
                      </span>
                    </DialogDescription>
                  )}
                  <div className="text-lg font-medium text-primary bg-secondary p-3 rounded-md whitespace-pre-wrap">
                    <ReactMarkdown>{currentSolution.solution}</ReactMarkdown>
                  </div>
                  {currentSolution.sourceUrls && currentSolution.sourceUrls.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">
                        Sources:
                      </h4>
                      <ul className="space-y-1 list-disc list-inside pl-2">
                        {currentSolution.sourceUrls.map((url, index) => (
                          <li key={index} className="text-xs">
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:text-accent hover:underline break-all"
                            >
                              {(() => {
                                try {
                                  const parsedUrl = new URL(url);
                                  return parsedUrl.hostname + (parsedUrl.pathname === '/' ? '' : parsedUrl.pathname);
                                } catch {
                                  return url.length > 70 ? url.substring(0, 67) + '...' : url;
                                }
                              })()}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
            <DialogFooter className="flex-shrink-0 pt-4 border-t mt-4">
              <Button
                variant="outline"
                onClick={() => setIsOutputDialogOpen(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Credits Exhausted Modal */}
        <Dialog open={isCreditsModalOpen} onOpenChange={setIsCreditsModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Credits Exhausted</DialogTitle>
            </DialogHeader>
            <div className="py-4 text-center">
              <p className="text-lg font-semibold mb-2">You have used all your {creditsType} credits for this month.</p>
              <p className="text-muted-foreground mb-4">Come back after one month or upgrade your plan for more credits.</p>
            </div>
            <DialogFooter>
              <Button
                variant="default"
                onClick={() => {
                  setIsCreditsModalOpen(false);
                  router.push('/pricing');
                }}
                className="w-full"
              >
                Upgrade Plan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
