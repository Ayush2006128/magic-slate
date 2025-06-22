'use client';

import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import { useState, createContext, useContext } from "react";
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Palette as PaletteIcon, Calculator } from 'lucide-react';

type Mode = 'doodle' | 'equation';

interface ModeContextType {
  mode: Mode;
  setMode: (mode: Mode) => void;
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

export const useMode = () => {
  const context = useContext(ModeContext);
  if (!context) {
    throw new Error('useMode must be used within a ModeProvider');
  }
  return context;
};

export default function SlateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mode, setMode] = useState<Mode>('doodle');

  return (
    <ModeContext.Provider value={{ mode, setMode }}>
      <header className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border rounded-full shadow-lg px-6 py-3 flex items-center justify-between min-w-[400px]">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold hover:text-muted-foreground transition-colors">Magic Slate</h1>
          </div>
          
          {/* Mode Selector */}
          <div className="flex items-center gap-2">
            <RadioGroup
              value={mode}
              onValueChange={(value) => setMode(value as Mode)}
              className="flex gap-2 items-center"
            >
              <div className="flex items-center space-x-1">
                <RadioGroupItem value="doodle" id="r-doodle-nav" />
                <Label
                  htmlFor="r-doodle-nav"
                  className="text-sm flex items-center gap-1 cursor-pointer"
                >
                  <PaletteIcon size={16} /> Doodle
                </Label>
              </div>
              <div className="flex items-center space-x-1">
                <RadioGroupItem value="equation" id="r-equation-nav" />
                <Label
                  htmlFor="r-equation-nav"
                  className="text-sm flex items-center gap-1 cursor-pointer"
                >
                  <Calculator size={16} /> Equation
                </Label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="flex items-center gap-2">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="text-sm bg-primary text-primary-foreground px-3 py-1 rounded-md hover:bg-primary/90 transition-colors">
                  Sign Up
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
          </div>
        </div>
      </header>
      {children}
    </ModeContext.Provider>
  );
} 