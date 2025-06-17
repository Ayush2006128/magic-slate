'use client';

import { useState, useEffect, ReactNode } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { ShieldCheck, Wand2, Palette, Calculator, Sparkles, Eraser, Settings, PencilLine, FileText, Loader2 } from 'lucide-react';

export type OnboardingStep = 'privacy' | 'tour';

interface OnboardingDialogProps {
  initialStep: OnboardingStep;
  onPrivacyAcknowledged: () => void;
  onTourFinished: () => void;
}

export function OnboardingDialog({
  initialStep,
  onPrivacyAcknowledged,
  onTourFinished,
}: OnboardingDialogProps) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(initialStep);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setCurrentStep(initialStep);
  }, [initialStep]);

  const handlePrivacySubmit = () => {
    setIsLoading(true);
    // Simulate async if needed, then
    onPrivacyAcknowledged();
    // Parent will set new step. If parent doesn't change step, force it after a delay
    // For now, assume parent handles step transition by changing initialStep prop which updates currentStep
    // Or, we can directly set next step here if onPrivacyAcknowledged is synchronous
    // setCurrentStep('apiKey'); // Let parent control this via initialStep prop change
    setIsLoading(false);
  };

  const handleTourFinishInternal = () => {
    setIsLoading(true);
    onTourFinished();
    // Parent will set dialog to closed.
    setIsLoading(false);
  };
  
  const getStepConfig = (): { title: string; description?: string; content: ReactNode; footer: ReactNode } => {
    const animationWrapperClasses = "animate-in fade-in-50 duration-500";

    switch (currentStep) {
      case 'privacy':
        return {
          title: 'Important: Privacy & Data',
          content: (
            <div key="privacy-content" className={animationWrapperClasses}>
              <DialogDescription className="mb-4">
                Welcome to Magic Slate! Before you begin, please take a moment to understand how this application handles your data.
              </DialogDescription>
              <section className="mb-3">
                <h3 className="font-semibold text-md mb-1 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" /> Our Commitment
                </h3>
                <p className="text-muted-foreground text-sm">
                  Magic Slate uses AI-powered features. To enable these, content you create (doodles, equations) and text prompts are sent to third-party AI providers (e.g., Google AI).
                  If you provide your Google AI API key, it's stored encrypted in your browser's cookies for these requests.
                </p>
              </section>
              <section className="mb-3">
                <h3 className="font-semibold text-md mb-1">Review Full Policy</h3>
                <p className="text-muted-foreground text-sm">
                  Details are in <code className="bg-muted px-1 py-0.5 rounded text-foreground">PRIVACY_POLICY.md</code> in the project files. This app is open source.
                </p>
              </section>
              <p className="font-medium text-foreground text-sm">
                By clicking "Acknowledge & Continue", you confirm understanding and opportunity to review the policy.
              </p>
            </div>
          ),
          footer: (
            <Button onClick={handlePrivacySubmit} className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin mr-2" /> : null}
              Acknowledge & Continue
            </Button>
          ),
        };
      case 'tour':
        return {
          title: 'Welcome to Magic Slate!',
          description: "Discover how Magic Slate can transform your ideas with AI.",
          content: (
             <div key="tour-content" className={`${animationWrapperClasses} space-y-5 text-sm`}>
                <section>
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <Palette className="h-5 w-5 text-primary" /> Doodle Mode
                  </h3>
                  <p className="mb-1 text-muted-foreground">
                    Select <span className="font-medium text-foreground">'Doodle'</span>. Draw anything!
                  </p>
                  <div className="flex items-start gap-3 my-2 p-3 bg-muted/50 rounded-lg">
                    <Sparkles className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <p className="text-muted-foreground">
                      Click <span className="font-medium text-foreground">Sparkles</span> to transform doodles into artwork.
                    </p>
                  </div>
                   <div className="flex items-start gap-3 my-2 p-3 bg-muted/50 rounded-lg">
                    <Settings className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
                     <p className="text-muted-foreground">
                       Use <span className="font-medium text-foreground">Settings (cog icon)</span> for style prompts (e.g., "Van Gogh").
                    </p>
                  </div>
                </section>
                <section>
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-primary" /> Equation Mode
                  </h3>
                  <p className="mb-1 text-muted-foreground">
                    Switch to <span className="font-medium text-foreground">'Equation'</span>. Write math equations.
                  </p>
                  <div className="flex items-start gap-3 my-2 p-3 bg-muted/50 rounded-lg">
                     <Calculator className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <p className="text-muted-foreground">
                      Tap <span className="font-medium text-foreground">Calculator</span>, and AI will try to solve it.
                    </p>
                  </div>
                </section>
                <section>
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <PencilLine className="h-5 w-5 text-primary" /> Canvas Controls
                  </h3>
                  <div className="flex items-start gap-3 my-2 p-3 bg-muted/50 rounded-lg">
                    <Eraser className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                    <p className="text-muted-foreground"><span className="font-medium text-foreground">Eraser</span> clears canvas.</p>
                  </div>
                  <div className="flex items-start gap-3 mt-2 mb-1 p-3 bg-muted/50 rounded-lg">
                    <Settings className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
                     <p className="text-muted-foreground"><span className="font-medium text-foreground">Settings</span> adjust color, brush, style.</p>
                  </div>
                </section>
             </div>
          ),
          footer: (
            <Button onClick={handleTourFinishInternal} className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin mr-2" /> : null}
              Let's Get Started!
            </Button>
          ),
        };
    }
  };

  const { title, description, content, footer } = getStepConfig();

  // Dialog is always open in terms of its own state; parent controls its mounting.
  // We don't want the dialog to self-close, parent should unmount it.
  return (
    <Dialog open={true} onOpenChange={() => { /* Parent controls this */ }}>
      <DialogContent className="sm:max-w-md md:max-w-lg max-h-[90vh] flex flex-col gap-0 p-0">
        <DialogHeader className="p-6 pb-4 flex-shrink-0 border-b">
          <DialogTitle className="text-2xl flex items-center gap-2 font-headline">
            {title}
          </DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-6">
            {content}
          </div>
        </ScrollArea>
        
        <DialogFooter className="p-6 pt-4 flex-shrink-0 border-t mt-auto">
          {footer}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
