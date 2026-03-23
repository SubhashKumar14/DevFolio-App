import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Construction } from 'lucide-react';

export default function WrappedPage() {
  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto p-2 md:p-0">
      <div className="text-center space-y-4 pt-8 pb-4">
        <div className="inline-flex items-center justify-center p-3 bg-accent-purple/10 rounded-full mb-2">
          <Sparkles className="h-8 w-8 text-accent-purple animate-pulse" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-accent-purple via-accent-cyan to-accent-green">
          DevFolio Wrapped
        </h1>
        <p className="text-xl text-muted-foreground">Your year in code, visualized.</p>
      </div>

      <Card className="border-2 border-dashed border-accent-purple/30 max-w-2xl mx-auto">
        <CardContent className="py-12 text-center space-y-4">
          <Construction className="h-12 w-12 mx-auto text-accent-purple opacity-60" />
          <h2 className="text-xl font-bold">Coming Soon</h2>
          <p className="text-muted max-w-md mx-auto">
            DevFolio Wrapped will generate a beautiful shareable card summarizing your coding year — 
            problems solved, streaks, languages used, and your global ranking. Stay tuned!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
