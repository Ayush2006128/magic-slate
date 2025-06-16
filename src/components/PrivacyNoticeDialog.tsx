
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
import { ShieldCheck, FileText } from 'lucide-react';

interface PrivacyNoticeDialogProps {
  isOpen: boolean;
  onAcknowledge: () => void;
}

export function PrivacyNoticeDialog({ isOpen, onAcknowledge }: PrivacyNoticeDialogProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onAcknowledge(); }}>
      <DialogContent className="sm:max-w-md md:max-w-lg max-h-[90vh] flex flex-col gap-0">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-2xl flex items-center gap-2 font-headline">
            <ShieldCheck className="h-6 w-6 text-primary" />
            Important: Privacy & Data
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 min-h-0">
          <div className="space-y-4 text-sm p-4">
            <DialogDescription>
              Welcome to Magic Slate! Before you begin, please take a moment to understand how this application handles your data.
            </DialogDescription>
            
            <section>
              <h3 className="font-semibold text-md mb-2 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" /> Our Commitment
              </h3>
              <p className="text-muted-foreground">
                Magic Slate is designed with AI-powered features. To enable these, the content you create on the canvas (doodles, equations) and any text prompts you provide are sent to third-party AI service providers (e.g., Google AI) for processing.
              </p>
              <p className="mt-2 text-muted-foreground">
                If you provide your Google AI API key, it is stored encrypted within your browser's cookies and used to make requests to Google AI services on your behalf.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-md mb-2">
                Review the Full Privacy Policy
              </h3>
              <p className="text-muted-foreground">
                For detailed information on data collection, use, storage, and your rights, please review our full Privacy Policy. You can find this document as <code className="bg-muted px-1 py-0.5 rounded text-foreground">PRIVACY_POLICY.md</code> in the application's project files.
              </p>
              <p className="mt-2 text-muted-foreground">
                This application is also open source, meaning its code is publicly available for review.
              </p>
            </section>

            <section className="mt-4">
              <p className="font-medium text-foreground">
                By clicking "Acknowledge & Continue", you confirm that you understand these points and have had the opportunity to review the full Privacy Policy.
              </p>
            </section>
          </div>
        </ScrollArea>
        <DialogFooter className="flex-shrink-0 pt-4 border-t mt-4">
          <Button onClick={onAcknowledge} className="w-full">
            Acknowledge & Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
