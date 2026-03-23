import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { compareService } from '@/services/compareService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { GitCompare, Search, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';

export default function ComparePage() {
  const { user } = useAuthStore();
  const [targetUserId, setTargetUserId] = useState('');
  const [compareId, setCompareId] = useState(null);

  const { data: comparison, isLoading, error } = useQuery({
    queryKey: ['compare', user?._id, compareId],
    queryFn: () => compareService.compareDevelopers(user._id, compareId),
    enabled: !!user?._id && !!compareId,
    retry: false,
  });

  const handleCompare = () => {
    if (targetUserId.trim()) {
      setCompareId(targetUserId.trim());
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto p-2 md:p-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <GitCompare className="h-8 w-8 text-accent-cyan" />
            Compare Developers
          </h1>
          <p className="text-muted mt-1">Pitch your stats against peers to see who comes out on top.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 items-start">
        {/* User 1 (You) */}
        <Card className="lg:col-span-2 shadow-sm border-accent-cyan/30">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-20 h-20 bg-accent-cyan/10 rounded-full flex items-center justify-center mb-4 text-2xl font-bold text-accent-cyan border border-accent-cyan/20">
              {user?.displayName?.[0]?.toUpperCase() || 'Y'}
            </div>
            <CardTitle>{user?.displayName || 'You'}</CardTitle>
            <CardDescription className="text-transparent bg-clip-text bg-gradient-devscore font-bold text-lg mt-2">
              {comparison?.user1?.devScore || '—'} DevScore
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <StatRow label="GitHub" value={comparison?.user1?.githubStats?.totalCommits ? `${comparison.user1.githubStats.totalCommits} repos` : '—'} />
            <StatRow label="DSA Solved" value={comparison?.user1?.dsaStats?.leetcode?.totalSolved || '—'} />
            <StatRow label="Portfolio" value={comparison?.user1?.hasPortfolio ? '✅ Published' : '—'} />
          </CardContent>
        </Card>

        {/* VS Label */}
        <div className="lg:col-span-1 flex justify-center py-4">
          <div className="flex bg-card-elevated px-4 py-2 rounded-full border border-border shadow-sm text-sm font-bold text-muted uppercase tracking-widest">
            VS
          </div>
        </div>

        {/* User 2 (Search) */}
        <Card className="lg:col-span-2 shadow-sm border-dashed">
          <CardHeader className="text-center pb-4 min-h-[140px] flex flex-col justify-center">
            <div className="mx-auto w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mb-4 text-muted">
              {comparison?.user2 ? (
                <span className="text-2xl font-bold text-accent-purple">{comparison.user2.displayName?.[0]?.toUpperCase()}</span>
              ) : (
                <User className="h-8 w-8" />
              )}
            </div>
            <div className="relative w-full max-w-xs mx-auto flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                <Input 
                  placeholder="Enter user ID..." 
                  className="pl-9 bg-transparent border-muted/30 focus-visible:ring-accent-cyan/50"
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCompare()}
                />
              </div>
              <Button onClick={handleCompare} disabled={isLoading || !targetUserId.trim()} size="sm">
                {isLoading ? '...' : 'Go'}
              </Button>
            </div>
            {comparison?.user2 && (
              <CardDescription className="text-transparent bg-clip-text bg-gradient-devscore font-bold text-lg mt-2">
                {comparison.user2.devScore || 0} DevScore
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <StatRow label="GitHub" value={comparison?.user2?.githubStats?.totalCommits ? `${comparison.user2.githubStats.totalCommits} repos` : '—'} />
            <StatRow label="DSA Solved" value={comparison?.user2?.dsaStats?.leetcode?.totalSolved || '—'} />
            <StatRow label="Portfolio" value={comparison?.user2?.hasPortfolio ? '✅ Published' : '—'} />
          </CardContent>
        </Card>
      </div>

      {/* Radar Chart */}
      {comparison?.radarData && (
        <Card className="animate-slide-up">
          <CardHeader>
            <CardTitle>Comparison Radar</CardTitle>
            <CardDescription>Multi-dimensional profile comparison</CardDescription>
          </CardHeader>
          <CardContent className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={comparison.radarData}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} />
                <Radar name={comparison.user1?.displayName || 'You'} dataKey="user1" stroke="var(--accent-cyan)" fill="var(--accent-cyan)" fillOpacity={0.3} />
                <Radar name={comparison.user2?.displayName || 'Opponent'} dataKey="user2" stroke="var(--accent-purple)" fill="var(--accent-purple)" fillOpacity={0.3} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="p-4 bg-accent-red/10 border border-accent-red/20 rounded-lg text-accent-red text-sm">
          User not found. Please check the user ID and try again.
        </div>
      )}
    </div>
  );
}

function StatRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
