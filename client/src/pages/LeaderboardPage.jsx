import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { leaderboardService } from '@/services/leaderboardService';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const RANKING_MODES = [
  { value: 'devscore', label: 'DevFolio Ranking', subtitle: 'Overall DevScore across all connected platforms', metricColumn: 'DevScore' },
  { value: 'github', label: 'GitHub Ranking', subtitle: 'Ranks by GitHub contribution signal', metricColumn: 'GitHub Signal' },
  { value: 'leetcode', label: 'LeetCode Ranking', subtitle: 'Ranks by LeetCode contest/global standing', metricColumn: 'LeetCode Signal' },
  { value: 'codeforces', label: 'Codeforces Ranking', subtitle: 'Ranks by Codeforces contest performance', metricColumn: 'Codeforces Signal' },
  { value: 'hackerrank', label: 'HackerRank Ranking', subtitle: 'Ranks by HackerRank contest and skill signal', metricColumn: 'HackerRank Signal' },
  { value: 'codechef', label: 'CodeChef Ranking', subtitle: 'Ranks by CodeChef global/rating signal', metricColumn: 'CodeChef Signal' },
  { value: 'kaggle', label: 'Kaggle Ranking', subtitle: 'Ranks by Kaggle rank and medal impact', metricColumn: 'Kaggle Signal' },
  { value: 'huggingface', label: 'Hugging Face Ranking', subtitle: 'Ranks by downloads and community impact', metricColumn: 'Hugging Face Signal' },
];

export default function LeaderboardPage() {
  const { user } = useAuthStore();
  const [page, setPage] = useState(1);
  const [college, setCollege] = useState('');
  const [archetypeFilter, setArchetypeFilter] = useState('');
  const [rankingMode, setRankingMode] = useState('devscore');

  const modeMeta = RANKING_MODES.find((mode) => mode.value === rankingMode) || RANKING_MODES[0];

  const { data, isLoading } = useQuery({
    queryKey: ['leaderboard', page, college, archetypeFilter, rankingMode],
    queryFn: () => leaderboardService.getLeaderboard({ 
      page, 
      limit: 20, 
      college: college || undefined,
      archetype: archetypeFilter || undefined,
      mode: rankingMode,
    }),
  });

  const rankings = data?.rankings || [];
  const totalPages = data?.totalPages || 1;

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto p-2 pb-4 md:p-0 md:pb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Trophy className="h-8 w-8 text-accent-orange" />
            Leaderboard
          </h1>
          <p className="text-muted mt-1">{modeMeta.subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <select
            className="h-10 px-3 rounded-md border border-border bg-card-elevated text-sm focus:outline-none focus:ring-2 focus:ring-accent-cyan min-w-[220px]"
            value={rankingMode}
            onChange={(e) => { setRankingMode(e.target.value); setPage(1); }}
          >
            {RANKING_MODES.map((mode) => (
              <option key={mode.value} value={mode.value}>{mode.label}</option>
            ))}
          </select>

          <div className="relative flex-1 md:w-56 min-w-[190px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <Input 
              placeholder="Filter by college..." 
              className="pl-9 h-10 bg-card-elevated"
              value={college}
              onChange={(e) => { setCollege(e.target.value); setPage(1); }}
            />
          </div>

          <select
            className="h-10 px-3 rounded-md border border-border bg-card-elevated text-sm focus:outline-none focus:ring-2 focus:ring-accent-cyan"
            value={archetypeFilter}
            onChange={(e) => { setArchetypeFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Archetypes</option>
            <option value="builder">Full-Stack Builder</option>
            <option value="problem_solver">DSA Specialist</option>
            <option value="ai_engineer">AI Engineer</option>
            <option value="security_expert">Security Expert</option>
            <option value="open_source">Open Source</option>
            <option value="competitor">Competitor</option>
          </select>
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
                  <th className="px-6 py-4 font-semibold">{modeMeta.metricColumn}</th>
                  <th className="px-6 py-4 font-semibold">Identity</th>
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
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {entry.avatarUrl ? (
                            <img src={entry.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover border border-border" />
                          ) : (
                            <div className="h-9 w-9 rounded-full border border-border bg-card-elevated flex items-center justify-center text-sm font-semibold text-accent-cyan">
                              {entry.displayName?.[0]?.toUpperCase() || '?'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold truncate">
                              {entry.displayName}
                              {isCurrentUser && <span className="text-xs bg-accent-cyan/20 text-accent-cyan py-0.5 px-2 rounded-full ml-2">You</span>}
                            </p>
                            {rankingMode !== 'devscore' && entry.metricSecondary && (
                              <p className="text-xs text-muted truncate">{entry.metricSecondary}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {rankingMode === 'devscore' ? (
                          <p className="font-bold text-transparent bg-clip-text bg-gradient-devscore">{entry.overallScore}</p>
                        ) : (
                          <div>
                            <p className="font-semibold text-foreground">{entry.metricDisplay || 'N/A'}</p>
                            <p className="text-xs text-muted">{entry.metricLabel || modeMeta.metricColumn}</p>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {entry.archetype && entry.archetype !== 'none' ? (
                           <span className="capitalize text-xs font-semibold px-2 py-1 rounded bg-card-elevated border border-border text-foreground">
                             {entry.secondaryArchetype && entry.secondaryArchetype !== 'none'
                               ? `${entry.archetype.replace('_', ' ')} + ${entry.secondaryArchetype.replace('_', ' ')}`
                               : entry.archetype.replace('_', ' ')}
                           </span>
                        ) : (
                           <span className="text-xs text-muted">—</span>
                        )}
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
              <p>
                {rankingMode === 'devscore'
                  ? 'No developers found. Be the first to sync your platforms!'
                  : 'No developers found for this platform ranking yet.'}
              </p>
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
