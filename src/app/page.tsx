
import { AppHeader } from '@/components/AppHeader';
import { MagicCanvasSection } from '@/components/MagicCanvasSection';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex-grow container mx-auto px-4 py-8">
        <MagicCanvasSection />
      </main>
      <footer className="py-4 text-center text-sm text-muted-foreground border-t border-border">
        <p>&copy; {new Date().getFullYear()} Magic Slate. Unleash your creativity with AI.</p>
      </footer>
    </div>
  );
}
