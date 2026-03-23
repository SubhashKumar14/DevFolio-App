import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { statsService } from '@/services/statsService';
import { scoreService } from '@/services/scoreService';
import { QuickStats } from '@/components/dashboard/QuickStats';
import { PlatformCard } from '@/components/dashboard/PlatformCard';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const userId = user?._id;

  // Fetch GitHub stats
  const { data: githubStats } = useQuery({
    queryKey: ['githubStats', userId],
    queryFn: () => statsService.getGithubStats(userId),
    enabled: !!userId,
    retry: false,
  });

  // Fetch DSA stats
  const { data: dsaStats } = useQuery({
    queryKey: ['dsaStats', userId],
    queryFn: () => statsService.getDsaStats(userId),
    enabled: !!userId,
    retry: false,
  });

  // Fetch DevScore
  const { data: devScore } = useQuery({
    queryKey: ['devScore', userId],
    queryFn: () => scoreService.getScore(userId),
    enabled: !!userId,
    retry: false,
  });

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: () => statsService.syncStats(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['githubStats'] });
      queryClient.invalidateQueries({ queryKey: ['dsaStats'] });
      queryClient.invalidateQueries({ queryKey: ['devScore'] });
    },
  });

  // Build quick stats from real data
  const quickStats = {
    totalProblemsSolved: dsaStats?.leetcode?.totalSolved || 0,
    totalRepos: githubStats?.publicRepos || 0,
    activePlatforms: [user?.githubUsername, user?.leetcodeUsername, user?.codeforcesUsername].filter(Boolean).length,
    currentStreak: 0,
  };

  // Build platform cards from real data
  const platforms = [];
  if (user?.leetcodeUsername) {
    platforms.push({
      id: 'leetcode',
      username: user.leetcodeUsername,
      primaryStat: `${dsaStats?.leetcode?.totalSolved || 0} Solved`,
      rating: '',
      breakdown: dsaStats?.leetcode ? {
        label1: 'Easy', pct1: dsaStats.leetcode.easySolved || 0,
        label2: 'Medium', pct2: dsaStats.leetcode.mediumSolved || 0,
        label3: 'Hard', pct3: dsaStats.leetcode.hardSolved || 0,
      } : null,
    });
  }
  if (user?.githubUsername) {
    platforms.push({
      id: 'github',
      username: user.githubUsername,
      primaryStat: `${githubStats?.totalCommits || 0} Repos`,
      rating: `${githubStats?.starsReceived || 0}★`,
      breakdown: null,
    });
  }
  if (user?.codeforcesUsername) {
    platforms.push({
      id: 'codeforces',
      username: user.codeforcesUsername,
      primaryStat: `${dsaStats?.codeforces?.currentRating || 0}`,
      rating: dsaStats?.codeforces?.rank || 'unrated',
      breakdown: null,
    });
  }

  // DevScore breakdown
  const breakdown = devScore?.breakdown;
  const scoreBreakdown = breakdown ? [
    { label: 'GitHub', value: breakdown.github?.score || 0 },
    { label: 'DSA', value: breakdown.dsa?.score || 0 },
    { label: 'Portfolio', value: breakdown.portfolio?.score || 0 },
  ] : [];

  return (
    <div className="space-y-8 animate-fade-in p-2 md:p-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3 tracking-tight">
            Dashboard
          </h1>
          <p className="text-muted mt-1">
            Welcome back, {user?.displayName || 'Developer'}. Here's your profile across all platforms.
          </p>
        </div>
        <Button onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
          {syncMutation.isPending ? 'Syncing...' : 'Sync All'}
        </Button>
      </div>

      <QuickStats stats={quickStats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight">Connected Platforms</h2>
          </div>
          {platforms.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {platforms.map((p) => (
                <PlatformCard 
                  key={p.id} 
                  platform={p} 
                  onSync={() => syncMutation.mutate()}
                  isSyncing={syncMutation.isPending}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center text-muted">
              <p className="text-lg font-medium">No platforms connected yet</p>
              <p className="text-sm mt-2">Go to Settings → Platforms to connect your accounts</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-semibold tracking-tight">DevScore</h2>
          <div className="rounded-xl border border-border bg-card p-6 text-center animate-slide-up" style={{ animationDelay: '300ms' }}>
             <div className="relative inline-flex items-center justify-center">
                 <svg className="w-48 h-48 transform -rotate-90">
                   <circle cx="96" cy="96" r="80" stroke="var(--border)" strokeWidth="12" fill="none" />
                   <circle cx="96" cy="96" r="80" stroke="url(#gradient)" strokeWidth="12" fill="none" strokeDasharray="502" strokeDashoffset={502 - (502 * (devScore?.overallScore || 0) / 100)} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
                   <defs>
                     <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                       <stop offset="0%" stopColor="#06b6d4" />
                       <stop offset="50%" stopColor="#8b5cf6" />
                       <stop offset="100%" stopColor="#ec4899" />
                     </linearGradient>
                   </defs>
                 </svg>
                 <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-devscore">
                      {devScore?.overallScore || 0}
                    </span>
                    <span className="text-sm text-muted font-medium mt-1">/ 100</span>
                 </div>
             </div>

             <div className="mt-8 space-y-4 text-left">
                {scoreBreakdown.map(stat => (
                  <div key={stat.label}>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span>{stat.label}</span>
                      <span>{stat.value}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-card-elevated overflow-hidden">
                      <div className="h-full bg-accent-purple rounded-full transition-all duration-700" style={{ width: `${stat.value}%` }} />
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
