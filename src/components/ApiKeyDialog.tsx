// src/components/ApiKeyDialog.tsx
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { KeyRound, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ApiKeyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onApiKeySubmit: (apiKey: string) => Promise<void>;
}

export function ApiKeyDialog({ isOpen, onClose, onApiKeySubmit }: ApiKeyDialogProps) {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!apiKey.trim()) {
      toast({
        title: 'API Key Required',
        description: 'Please enter your Google AI API key.',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);
    try {
      await onApiKeySubmit(apiKey.trim());
      toast({
        title: 'API Key Saved',
        description: 'Your API key has been securely stored in your browser for this session.',
      });
      onClose(); // Close dialog on successful submission
    } catch (error) {
      toast({
        title: 'Error Saving API Key',
        description: 'Could not save the API key. Please try again.',
        variant: 'destructive',
      });
      console.error("Error submitting API key:", error);
    } finally {
      setIsLoading(false);
      setApiKey(''); // Clear the input field
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            Enter Your Google AI API Key
          </DialogTitle>
          <DialogDescription>
            To use the AI features of Magic Slate, please provide your own Google AI API key.
            This key will be stored encrypted in your browser&apos;s cookies.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-3">
          <Label htmlFor="apiKey">Google AI API Key</Label>
          <Input
            id="apiKey"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your API key"
            disabled={isLoading}
          />
          <p className="text-xs text-muted-foreground">
            You can obtain an API key from{' '}
            <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline text-primary">
              Google AI Studio (MakerSuite)
            </a>.
          </p>
        </div>

        <Alert variant="destructive" className="mt-4">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Security Note</AlertTitle>
          <AlertDescription className="text-xs">
            Storing API keys in browser cookies, even encrypted, carries inherent security risks (e.g., XSS attacks).
            For production applications, consider more secure server-side key management.
            By proceeding, you acknowledge this risk.
          </AlertDescription>
        </Alert>

        <DialogFooter className="mt-6">
          <DialogClose asChild>
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={isLoading || !apiKey.trim()}>
            {isLoading ? 'Saving...' : 'Save API Key'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
