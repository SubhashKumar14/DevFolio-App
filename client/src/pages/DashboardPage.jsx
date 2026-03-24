import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { statsService } from '@/services/statsService';
import { scoreService } from '@/services/scoreService';
import { profileService } from '@/services/profileService';
import { portfolioService } from '@/services/portfolioService';
import { QuickStats } from '@/components/dashboard/QuickStats';
import { PlatformCard } from '@/components/dashboard/PlatformCard';
import ActivityHeatmap from '@/components/dashboard/ActivityHeatmap';
import ProfileCompleteness from '@/components/dashboard/ProfileCompleteness';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw, ExternalLink, FileCode, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const userId = user?._id;

  // ─── Data queries ────────────────────────
  const { data: githubStats } = useQuery({
    queryKey: ['githubStats', userId],
    queryFn: () => statsService.getGithubStats(userId),
    enabled: !!userId, retry: false,
  });

  const { data: dsaStats } = useQuery({
    queryKey: ['dsaStats', userId],
    queryFn: () => statsService.getDsaStats(userId),
    enabled: !!userId, retry: false,
  });

  const { data: devScore } = useQuery({
    queryKey: ['devScore', userId],
    queryFn: () => scoreService.getScore(userId),
    enabled: !!userId, retry: false,
  });

  const { data: profile } = useQuery({
    queryKey: ['profile', userId],
    queryFn: () => profileService.getProfile(userId),
    enabled: !!userId, retry: false,
  });

  const { data: portfolio } = useQuery({
    queryKey: ['portfolio', userId],
    queryFn: () => portfolioService.getPortfolio(userId),
    enabled: !!userId, retry: false,
  });

  // ─── Sync mutation ──────────────────────
  const syncMutation = useMutation({
    mutationFn: () => statsService.syncStats(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['githubStats'] });
      queryClient.invalidateQueries({ queryKey: ['dsaStats'] });
      queryClient.invalidateQueries({ queryKey: ['devScore'] });
    },
  });

  // ─── Computed data ──────────────────────
  const quickStats = {
    totalProblemsSolved: dsaStats?.leetcode?.totalSolved || 0,
    totalRepos: githubStats?.publicRepos || 0,
    activePlatforms: [user?.githubUsername, user?.leetcodeUsername, user?.codeforcesUsername].filter(Boolean).length,
    currentStreak: 0,
  };

  const platforms = useMemo(() => {
    const list = [];
    if (user?.leetcodeUsername) {
      list.push({
        id: 'leetcode', username: user.leetcodeUsername,
        primaryStat: `${dsaStats?.leetcode?.totalSolved || 0} Solved`, rating: '',
        breakdown: dsaStats?.leetcode ? {
          label1: 'Easy', pct1: dsaStats.leetcode.easySolved || 0,
          label2: 'Medium', pct2: dsaStats.leetcode.mediumSolved || 0,
          label3: 'Hard', pct3: dsaStats.leetcode.hardSolved || 0,
        } : null,
      });
    }
    if (user?.githubUsername) {
      list.push({
        id: 'github', username: user.githubUsername,
        primaryStat: `${githubStats?.publicRepos || 0} Repos`,
        rating: `${githubStats?.starsReceived || 0}★`, breakdown: null,
      });
    }
    if (user?.codeforcesUsername) {
      list.push({
        id: 'codeforces', username: user.codeforcesUsername,
        primaryStat: `${dsaStats?.codeforces?.currentRating || 0}`,
        rating: dsaStats?.codeforces?.rank || 'unrated', breakdown: null,
      });
    }
    return list;
  }, [user, dsaStats, githubStats]);

  const breakdown = devScore?.breakdown;
  const scoreBreakdown = breakdown ? [
    { label: 'GitHub', value: breakdown.github?.score || 0 },
    { label: 'DSA', value: breakdown.dsa?.score || 0 },
    { label: 'Portfolio', value: breakdown.portfolio?.score || 0 },
  ] : [];

  // Portfolio preview srcdoc
  const portfolioSrcdoc = useMemo(() => {
    if (!portfolio) return null;
    const html = portfolio.htmlContent || portfolio.rawHtml || '';
    const css = portfolio.cssContent || '';
    return `<!DOCTYPE html><html><head><style>body{margin:0;overflow:hidden;transform:scale(0.5);transform-origin:0 0;width:200%;height:200%}${css}</style></head><body>${html}</body></html>`;
  }, [portfolio]);

  return (
    <div className="space-y-6 animate-fade-in p-2 md:p-0">
      {/* ─── Header ────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3 tracking-tight">Dashboard</h1>
          <p className="text-muted mt-1">
            Welcome back, <span className="text-foreground font-medium">{user?.displayName || 'Developer'}</span>
          </p>
        </div>
        <Button onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
          {syncMutation.isPending ? 'Syncing...' : 'Sync All'}
        </Button>
      </div>

      {/* ─── Quick Stats Row ───────────────── */}
      <QuickStats stats={quickStats} />

      {/* ─── Activity Heatmap (full width) ─── */}
      <ActivityHeatmap
        githubCalendar={githubStats?.contributionCalendar || []}
        dsaActivity={dsaStats?.dailyActivity || []}
      />

      {/* ─── Main Grid: Platforms + DevScore + Completeness ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Connected Platforms */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">Connected Platforms</h2>
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
            <Card className="border-dashed">
              <CardContent className="p-8 text-center text-muted">
                <p className="font-medium">No platforms connected</p>
                <p className="text-sm mt-1">Go to Settings → Platforms to connect</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: DevScore + Completeness */}
        <div className="space-y-4">
          {/* DevScore Ring */}
          <div className="rounded-xl border border-border bg-card p-6 text-center animate-slide-up" style={{ animationDelay: '200ms' }}>
            <h2 className="text-lg font-semibold tracking-tight mb-4">DevScore</h2>
            <div className="relative inline-flex items-center justify-center">
              <svg className="w-36 h-36 transform -rotate-90">
                <circle cx="72" cy="72" r="60" stroke="var(--border)" strokeWidth="10" fill="none" />
                <circle cx="72" cy="72" r="60" stroke="url(#scoreGrad)" strokeWidth="10" fill="none"
                  strokeDasharray="377" strokeDashoffset={377 - (377 * (devScore?.overallScore || 0) / 100)}
                  strokeLinecap="round" className="transition-all duration-1000 ease-out" />
                <defs>
                  <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="50%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-devscore">
                  {devScore?.overallScore || 0}
                </span>
                <span className="text-xs text-muted font-medium">/ 100</span>
              </div>
            </div>
            <div className="mt-4 space-y-2.5 text-left">
              {scoreBreakdown.map(stat => (
                <div key={stat.label}>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>{stat.label}</span><span>{stat.value}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-card-elevated overflow-hidden">
                    <div className="h-full bg-accent-purple rounded-full transition-all duration-700" style={{ width: `${stat.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Profile Completeness */}
          <ProfileCompleteness user={user} profile={profile} hasPortfolio={!!portfolio} />
        </div>
      </div>

      {/* ─── Portfolio Preview + Actions ──── */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
            <FileCode className="h-5 w-5 text-accent-cyan" /> Portfolio
          </h2>
          <div className="flex gap-2">
            {user?.displayName && (
              <Button variant="outline" size="sm" asChild className="gap-1.5">
                <Link to={`/portfolio/preview/${encodeURIComponent(user.displayName)}`} target="_blank">
                  <ExternalLink className="h-3.5 w-3.5" /> View Live
                </Link>
              </Button>
            )}
            {user?.role !== 'recruiter' && (
              <Button variant="outline" size="sm" asChild className="gap-1.5">
                <Link to="/portfolio/editor">
                  <FileText className="h-3.5 w-3.5" /> Edit Code
                </Link>
              </Button>
            )}
          </div>
        </div>
        {portfolioSrcdoc ? (
          <div className="h-[280px] bg-white">
            <iframe
              srcDoc={portfolioSrcdoc}
              title="Portfolio Preview"
              sandbox="allow-scripts"
              className="w-full h-full border-0"
            />
          </div>
        ) : (
          <CardContent className="py-12 text-center text-muted">
            <FileCode className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No portfolio yet</p>
            <p className="text-sm mt-1">Create your portfolio in the editor</p>
            {user?.role !== 'recruiter' && (
              <Button asChild size="sm" className="mt-4">
                <Link to="/portfolio/editor">Create Portfolio</Link>
              </Button>
            )}
          </CardContent>
        )}
      </div>
    </div>
  );
}
