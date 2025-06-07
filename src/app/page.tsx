import { AppHeader } from '@/components/AppHeader';
import { EquationSolverSection } from '@/components/EquationSolverSection';
import { DoodleSection } from '@/components/DoodleSection';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, Palette } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Tabs defaultValue="equation-solver" className="w-full">
          <TabsList className="grid w-full grid-cols-1 md:grid-cols-2 mb-6 max-w-md mx-auto h-auto md:h-12">
            <TabsTrigger value="equation-solver" className="py-3 text-base gap-2">
              <Calculator className="h-5 w-5" /> Equation Solver
            </TabsTrigger>
            <TabsTrigger value="doodle-art" className="py-3 text-base gap-2">
              <Palette className="h-5 w-5" /> Doodle Art
            </TabsTrigger>
          </TabsList>
          <TabsContent value="equation-solver">
            <EquationSolverSection />
          </TabsContent>
          <TabsContent value="doodle-art">
            <DoodleSection />
          </TabsContent>
        </Tabs>
      </main>
      <footer className="py-4 text-center text-sm text-muted-foreground border-t border-border">
        <p>&copy; {new Date().getFullYear()} Magic Slate. Unleash your creativity with AI.</p>
      </footer>
    </div>
  );
}
