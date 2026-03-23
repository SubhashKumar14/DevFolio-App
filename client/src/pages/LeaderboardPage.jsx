import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { leaderboardService } from '@/services/leaderboardService';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function LeaderboardPage() {
  const { user } = useAuthStore();
  const [page, setPage] = useState(1);
  const [college, setCollege] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['leaderboard', page, college],
    queryFn: () => leaderboardService.getLeaderboard({ page, limit: 20, college: college || undefined }),
  });

  const rankings = data?.rankings || [];
  const totalPages = data?.totalPages || 1;

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto p-2 md:p-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Trophy className="h-8 w-8 text-accent-orange" />
            Global Leaderboard
          </h1>
          <p className="text-muted mt-1">See how you rank globally across all integrated platforms.</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <Input 
            placeholder="Filter by college..." 
            className="pl-9"
            value={college}
            onChange={(e) => { setCollege(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      <Card className="animate-slide-up shadow-sm">
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-cyan border-t-transparent" />
            </div>
          ) : rankings.length > 0 ? (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted uppercase bg-card-elevated/50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-semibold">Rank</th>
                  <th className="px-6 py-4 font-semibold">Developer</th>
                  <th className="px-6 py-4 font-semibold">DevScore</th>
                  <th className="px-6 py-4 font-semibold">College</th>
                  <th className="px-6 py-4 font-semibold">Portfolio</th>
                </tr>
              </thead>
              <tbody>
                {rankings.map((entry) => {
                  const isCurrentUser = user?._id === entry.userId;
                  return (
                    <tr 
                      key={entry.userId} 
                      className={`border-b border-border last:border-0 hover:bg-card-elevated/30 transition-colors ${isCurrentUser ? 'bg-accent-cyan/5' : ''}`}
                    >
                      <td className="px-6 py-4 font-medium">
                        <span className="w-6">{entry.rank}</span>
                      </td>
                      <td className="px-6 py-4 font-semibold">
                        {entry.displayName}
                        {isCurrentUser && <span className="text-xs bg-accent-cyan/20 text-accent-cyan py-0.5 px-2 rounded-full ml-2">You</span>}
                      </td>
                      <td className="px-6 py-4 font-bold text-transparent bg-clip-text bg-gradient-devscore">
                        {entry.overallScore}
                      </td>
                      <td className="px-6 py-4 text-muted">
                        {entry.college || '—'}
                      </td>
                      <td className="px-6 py-4">
                        {entry.hasPortfolio && (
                          <span className="px-2 py-1 rounded text-xs font-bold bg-accent-green/20 text-accent-green">
                            Portfolio
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="py-16 text-center text-muted">
              <p>No developers found. Be the first to sync your platforms!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
