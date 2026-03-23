import { Card, CardContent } from '@/components/ui/card';
import { Calendar as CalendarIcon, Clock, ExternalLink, Construction } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ContestsPage() {
  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto p-2 md:p-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <CalendarIcon className="h-8 w-8 text-accent-cyan" />
            Upcoming Contests
          </h1>
          <p className="text-muted mt-1">Never miss a coding competition across your favorite platforms.</p>
        </div>
      </div>

      {/* Coming Soon Notice */}
      <Card className="border-2 border-dashed border-accent-cyan/30">
        <CardContent className="py-12 text-center space-y-4">
          <Construction className="h-12 w-12 mx-auto text-accent-cyan opacity-60" />
          <h2 className="text-xl font-bold">Coming Soon</h2>
          <p className="text-muted max-w-md mx-auto">
            Auto-fetching upcoming contests from Codeforces, LeetCode, and CodeChef is under development. 
            For now, check the platforms directly.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-4">
            <Button variant="outline" size="sm" asChild>
              <a href="https://codeforces.com/contests" target="_blank" rel="noreferrer" className="gap-1.5">
                Codeforces <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="https://leetcode.com/contest/" target="_blank" rel="noreferrer" className="gap-1.5">
                LeetCode <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="https://www.codechef.com/contests" target="_blank" rel="noreferrer" className="gap-1.5">
                CodeChef <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
