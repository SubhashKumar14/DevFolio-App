import { Card, CardContent } from '@/components/ui/card';
import { Target, Construction } from 'lucide-react';

export default function GoalsPage() {
  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto p-2 md:p-0">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Target className="h-8 w-8 text-accent-green" />
          Goals & Targets
        </h1>
        <p className="text-muted mt-1">Set and track your platform-specific or global milestones.</p>
      </div>

      <Card className="border-2 border-dashed border-accent-green/30">
        <CardContent className="py-12 text-center space-y-4">
          <Construction className="h-12 w-12 mx-auto text-accent-green opacity-60" />
          <h2 className="text-xl font-bold">Coming Soon</h2>
          <p className="text-muted max-w-md mx-auto">
            Goal tracking with platform-specific milestones (e.g., "Solve 100 Hard problems", "Reach Knight on Codeforces")
            is being built. You'll be able to set custom targets and track progress automatically.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
