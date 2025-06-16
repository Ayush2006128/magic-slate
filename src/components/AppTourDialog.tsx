
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Wand2, Palette, Calculator, Sparkles, Eraser, Settings, PencilLine } from 'lucide-react';

interface AppTourDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AppTourDialog({ isOpen, onClose }: AppTourDialogProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md md:max-w-lg max-h-[90vh] flex flex-col gap-0">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-2xl flex items-center gap-2 font-headline">
            <Wand2 className="h-6 w-6 text-primary" />
            Welcome to Magic Slate!
          </DialogTitle>
          <DialogDescription>
            Discover how Magic Slate can transform your ideas with AI.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 min-h-0">
          <div className="space-y-6 text-sm p-4">
            <section>
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" /> Doodle Mode: Unleash Creativity
              </h3>
              <p className="mb-1 text-muted-foreground">
                Select <span className="font-medium text-foreground">'Doodle'</span> at the top. Draw anything your heart desires!
              </p>
              <div className="flex items-start gap-3 my-2 p-3 bg-muted/50 rounded-lg">
                <Sparkles className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                <p className="text-muted-foreground">
                  Click the <span className="font-medium text-foreground">Sparkles button</span> to magically transform your doodle into beautiful artwork using AI.
                </p>
              </div>
               <div className="flex items-start gap-3 my-2 p-3 bg-muted/50 rounded-lg">
                <Settings className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
                 <p className="text-muted-foreground">
                  Use the <span className="font-medium text-foreground">Settings</span> (cog icon) in Doodle mode to provide a style prompt (e.g., "Van Gogh style", "sci-fi art") to guide the AI.
                </p>
              </div>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" /> Equation Mode: Solve Problems
              </h3>
              <p className="mb-1 text-muted-foreground">
                Switch to <span className="font-medium text-foreground">'Equation'</span> mode. Write down any mathematical equation.
              </p>
              <div className="flex items-start gap-3 my-2 p-3 bg-muted/50 rounded-lg">
                 <Calculator className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                <p className="text-muted-foreground">
                  Tap the <span className="font-medium text-foreground">Calculator button</span>, and our AI will attempt to recognize and solve it for you.
                </p>
              </div>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <PencilLine className="h-5 w-5 text-primary" /> Canvas Controls
              </h3>
              <div className="flex items-start gap-3 my-2 p-3 bg-muted/50 rounded-lg">
                <Eraser className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-muted-foreground">
                  The <span className="font-medium text-foreground">Eraser button</span> clears the entire canvas.
                </p>
              </div>
              <div className="flex items-start gap-3 mt-2 mb-1 p-3 bg-muted/50 rounded-lg">
                <Settings className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
                <p className="text-muted-foreground">
                  The <span className="font-medium text-foreground">Settings button</span> (cog icon) lets you adjust:
                </p>
              </div>
              <ul className="list-disc list-inside ml-6 space-y-1 text-muted-foreground pl-3">
                  <li>Drawing color</li>
                  <li>Brush size</li>
                  <li>Artwork style prompt (in Doodle Mode)</li>
              </ul>
            </section>

             <section className="mt-6">
              <h3 className="font-semibold text-lg mb-2">Ready to Explore?</h3>
              <p className="text-muted-foreground">
                That's the basics! We hope you enjoy using Magic Slate.
              </p>
            </section>
          </div>
        </ScrollArea>
        <DialogFooter className="flex-shrink-0 pt-4 border-t mt-4">
          <Button onClick={onClose} className="w-full">
            Let's Get Started!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
