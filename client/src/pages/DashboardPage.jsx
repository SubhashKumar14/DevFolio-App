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
import StreakCounter from '@/components/dashboard/StreakCounter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RefreshCw, ExternalLink, Download, ChevronRight, Radar, Lightbulb, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import apiClient from '@/lib/apiClient';

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

  const { data: platformStats } = useQuery({
    queryKey: ['platformStats', userId],
    queryFn: () => statsService.getPlatformStats(userId),
    enabled: !!userId, retry: false,
  });

  // ─── Sync mutation ──────────────────────
  const syncMutation = useMutation({
    mutationFn: () => statsService.syncStats(),
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success('All platforms synced!');
    },
    onError: () => toast.error('Sync failed. Please try again.'),
  });

  // ─── Computed data ──────────────────────
  const activePlatformsCount = [
    user?.githubUsername, user?.leetcodeUsername, user?.codeforcesUsername, user?.hackerrankUsername,
    user?.codechefUsername, user?.kaggleUsername, user?.gfgUsername, user?.atcoderUsername,
    user?.stackoverflowUserId, user?.hackerEarthUsername, user?.huggingfaceUsername,
    user?.tryhackmeUsername, user?.codesignalUsername, user?.devtoUsername, user?.gitlabUsername
  ].filter(Boolean).length;

  const quickStats = {
    totalProblemsSolved: (dsaStats?.leetcode?.totalSolved || 0) + (dsaStats?.codeforces?.totalSolved || 0),
    totalRepos: (githubStats?.publicRepos || 0) + (platformStats?.gitlab?.projectsCount || 0),
    activePlatforms: activePlatformsCount,
    currentStreak: githubStats?.currentStreak || 0,
  };

  const platforms = useMemo(() => {
    const list = [];
    const add = (id, username, stat, rating, breakdown = null) => {
      if (username) list.push({ id, username, primaryStat: stat, rating, breakdown });
    };
    
    // Original 7
    add('leetcode', user?.leetcodeUsername, `${dsaStats?.leetcode?.totalSolved || 0} Solved`, `Rating: ${dsaStats?.leetcode?.contestRating || 0}`, dsaStats?.leetcode ? {
      label1: 'Easy', pct1: Math.round(((dsaStats.leetcode.easySolved || 0) / (dsaStats.leetcode.totalSolved || 1)) * 100),
      label2: 'Medium', pct2: Math.round(((dsaStats.leetcode.mediumSolved || 0) / (dsaStats.leetcode.totalSolved || 1)) * 100),
      label3: 'Hard', pct3: Math.round(((dsaStats.leetcode.hardSolved || 0) / (dsaStats.leetcode.totalSolved || 1)) * 100),
    } : null);
    add('github', user?.githubUsername, `${githubStats?.publicRepos || 0} Repos`, `${githubStats?.starsReceived || 0}★`);
    add('codeforces', user?.codeforcesUsername, `Rating: ${dsaStats?.codeforces?.rating || 0}`, dsaStats?.codeforces?.rank || 'unrated');
    add('hackerrank', user?.hackerrankUsername, `${platformStats?.hackerrank?.totalBadges || 0} Badges`, `${platformStats?.hackerrank?.totalStars || 0}★`);
    add('codechef', user?.codechefUsername, `Rating: ${platformStats?.codechef?.currentRating || 0}`, platformStats?.codechef?.stars || '');
    add('kaggle', user?.kaggleUsername, platformStats?.kaggle?.tier || 'Novice', `${platformStats?.kaggle?.totalMedals || 0} Medals`);
    add('geeksforgeeks', user?.gfgUsername, `${platformStats?.gfg?.totalProblemsSolved || 0} Solved`, `Score: ${platformStats?.gfg?.score || 0}`);
    
    // New 8
    add('atcoder', user?.atcoderUsername, `Rating: ${platformStats?.atcoder?.rating || 0}`, `${platformStats?.atcoder?.colorRank || 'grey'} Rank`);
    add('stackoverflow', user?.stackoverflowUserId, `${platformStats?.stackoverflow?.reputation || 0} Rep`, `${platformStats?.stackoverflow?.totalBadges || 0} Badges`);
    add('hackerearth', user?.hackerEarthUsername, `${platformStats?.hackerearth?.problemsSolved || 0} Solved`, `Rating: ${platformStats?.hackerearth?.rating || 0}`);
    add('huggingface', user?.huggingfaceUsername, `${platformStats?.huggingface?.modelsPublished || 0} Models`, `${platformStats?.huggingface?.totalLikes || 0} Likes`);
    add('tryhackme', user?.tryhackmeUsername, `Level: ${platformStats?.tryhackme?.level || 0}`, `Rank: ${platformStats?.tryhackme?.rank || 0}`);
    add('codesignal', user?.codesignalUsername, `GCA: ${platformStats?.codesignal?.gcaScore || 0}`, `Level: ${platformStats?.codesignal?.level || 0}`);
    add('devto', user?.devtoUsername, `${platformStats?.devto?.articlesPublished || 0} Posts`, `${platformStats?.devto?.totalReactions || 0} Hits`);
    add('gitlab', user?.gitlabUsername, `${platformStats?.gitlab?.projectsCount || 0} Projects`, `${platformStats?.gitlab?.totalStars || 0}★`);

    return list;
  }, [user, dsaStats, githubStats, platformStats]);

  const scoreData = devScore?.data || devScore;
  const pillars = scoreData?.pillars;
  const diagnostics = scoreData?.diagnostics || {};
  const strongestSignals = diagnostics?.strongestSignals || [];
  const weakSignals = diagnostics?.weakSignals || [];
  const domainSuggestions = diagnostics?.unconnectedPlatformRecommendations || [];
  const platformScoreData = Object.entries(scoreData?.platformScores || {})
    .map(([platform, stats]) => ({ platform, ...stats }))
    .sort((a, b) => (b.score || 0) - (a.score || 0));

  const scoreBreakdown = pillars ? [
    { label: 'Problem Solving', value: pillars.problemSolving?.score || 0, max: pillars.problemSolving?.max || 200, grade: pillars.problemSolving?.grade || 'N/A' },
    { label: 'Building', value: pillars.building?.score || 0, max: pillars.building?.max || 200, grade: pillars.building?.grade || 'N/A' },
    { label: 'Community', value: pillars.community?.score || 0, max: pillars.community?.max || 200, grade: pillars.community?.grade || 'N/A' },
    { label: 'Consistency', value: pillars.consistency?.score || 0, max: pillars.consistency?.max || 200, grade: pillars.consistency?.grade || 'N/A' },
    { label: 'Specialization', value: pillars.specialization?.score || 0, max: pillars.specialization?.max || 200, grade: pillars.specialization?.grade || 'N/A' },
  ] : [];

  const improvements = scoreData?.improvements || [];

  return (
    <div className="space-y-6 animate-fade-in p-2 md:p-0">
      
      {/* ─── Header ────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3 tracking-tight">Dashboard</h1>
            <p className="text-muted mt-1">
              Welcome back, <span className="text-foreground font-medium">{user?.displayName || 'Developer'}</span>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline" size="sm"
            onClick={async () => {
              toast.promise(
                apiClient.get('/user/export').then((res) => {
                  const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a'); a.href = url; a.download = 'devfolio-export.json'; a.click();
                }),
                { loading: 'Exporting...', success: 'Data exported!', error: 'Export failed' }
              );
            }}
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
            {syncMutation.isPending ? 'Syncing...' : 'Sync All'}
          </Button>
        </div>
      </div>

      {quickStats.activePlatforms === 0 && (
        <div className="rounded-xl border-2 border-dashed border-accent-cyan/30 bg-accent-cyan/5 p-6 text-center animate-slide-up">
          <h3 className="text-lg font-bold text-foreground mb-2">🚀 Complete Your Setup</h3>
          <p className="text-sm text-muted mb-4">Connect your coding platforms to unlock your DevScore, analytics, and more.</p>
          <Link to="/dashboard/settings">
            <Button className="gap-2"><ExternalLink className="h-4 w-4" /> Go to Settings</Button>
          </Link>
        </div>
      )}

      {/* ─── 3-TIER BENTO GRID ──────────────── */}
      
      {/* TIER 1: Heros (DevScore + Quick Stats) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* DevScore Prime Card */}
        <div className="md:col-span-4 rounded-xl glass-card p-6 flex flex-col items-center justify-center text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-accent-cyan/5 to-accent-purple/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-2">DevScore v2</h2>
          <div className="relative inline-flex items-center justify-center my-2">
            <svg className="w-40 h-40 transform -rotate-90">
              <circle cx="80" cy="80" r="70" stroke="var(--border)" strokeWidth="12" fill="none" />
              <circle cx="80" cy="80" r="70" stroke="url(#scoreGrad)" strokeWidth="12" fill="none"
                strokeDasharray="440" strokeDashoffset={440 - (440 * (scoreData?.overallScore || 0) / 1000)}
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
              <span className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-accent-cyan via-accent-purple to-accent-pink">
                {scoreData?.overallScore || 0}
              </span>
              <span className="text-xs text-muted">/1000</span>
            </div>
          </div>
          <p className="text-xs text-muted font-medium mt-1">
            Archetype: <span className="text-foreground capitalize">{user?.archetype ? user.archetype.replace('_', ' ') : 'None'}{user?.secondaryArchetype ? ` + ${user.secondaryArchetype.replace('_', ' ')}` : ''}</span>
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2 text-xs">
            <span className="rounded-full border border-accent-cyan/35 bg-accent-cyan/10 px-2.5 py-1 text-accent-cyan font-medium">
              Domain: {scoreData?.domainLabel || 'All Rounder'}
            </span>
            <span className="rounded-full border border-accent-purple/35 bg-accent-purple/10 px-2.5 py-1 text-accent-purple font-medium">
              Domain Fit: {diagnostics?.domainFitScore ?? 0}%
            </span>
          </div>
          {diagnostics?.suggestedDomainLabel && (
            <p className="mt-2 text-xs text-muted">
              Suggested Fit: <span className="text-foreground font-medium">{diagnostics.suggestedDomainLabel}</span>
            </p>
          )}
        </div>

        {/* Quick Stats Grid */}
        <div className="md:col-span-8 space-y-6 flex flex-col justify-between">
          <StreakCounter
            githubCalendar={githubStats?.contributionCalendar || []}
            leetcodeCalendar={dsaStats?.leetcode?.dailyActivity || []}
            codeforcesCalendar={dsaStats?.codeforces?.dailySubmissions || []}
            hackerrankCalendar={platformStats?.hackerrank?.dailyActivity || []}
            codechefCalendar={platformStats?.codechef?.dailyActivity || []}
            kaggleCalendar={platformStats?.kaggle?.dailyActivity || []}
            gfgCalendar={platformStats?.gfg?.dailyActivity || []}
            atcoderCalendar={platformStats?.atcoder?.dailyActivity || []}
            stackoverflowCalendar={platformStats?.stackoverflow?.dailyActivity || []}
            hackerearthCalendar={platformStats?.hackerearth?.dailyActivity || []}
            huggingfaceCalendar={platformStats?.huggingface?.dailyActivity || []}
            tryhackmeCalendar={platformStats?.tryhackme?.dailyActivity || []}
            codesignalCalendar={platformStats?.codesignal?.dailyActivity || []}
            devtoCalendar={platformStats?.devto?.dailyActivity || []}
            gitlabCalendar={platformStats?.gitlab?.dailyActivity || []}
          />
          <QuickStats stats={quickStats} />
          <ProfileCompleteness user={user} profile={profile} hasPortfolio={!!portfolio} />
        </div>
      </div>

      {/* TIER 2: Deep Dives (Activity + Pillars Breakdown) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <ActivityHeatmap
            githubCalendar={githubStats?.contributionCalendar || []}
            leetcodeCalendar={dsaStats?.leetcode?.dailyActivity || []}
            codeforcesCalendar={dsaStats?.codeforces?.dailySubmissions || []}
            hackerrankCalendar={platformStats?.hackerrank?.dailyActivity || []}
            codechefCalendar={platformStats?.codechef?.dailyActivity || []}
            kaggleCalendar={platformStats?.kaggle?.dailyActivity || []}
            gfgCalendar={platformStats?.gfg?.dailyActivity || []}
            atcoderCalendar={platformStats?.atcoder?.dailyActivity || []}
            stackoverflowCalendar={platformStats?.stackoverflow?.dailyActivity || []}
            hackerearthCalendar={platformStats?.hackerearth?.dailyActivity || []}
            huggingfaceCalendar={platformStats?.huggingface?.dailyActivity || []}
            tryhackmeCalendar={platformStats?.tryhackme?.dailyActivity || []}
            codesignalCalendar={platformStats?.codesignal?.dailyActivity || []}
            devtoCalendar={platformStats?.devto?.dailyActivity || []}
            gitlabCalendar={platformStats?.gitlab?.dailyActivity || []}
          />
        </div>

        {/* Pillars Breakdown */}
        <div className="lg:col-span-4 rounded-xl glass-card p-6 flex flex-col">
          <h2 className="text-lg font-semibold tracking-tight mb-5">Pillar Analysis</h2>
          <div className="space-y-4 flex-1">
            {scoreBreakdown.map((stat, i) => (
              <div key={stat.label} className="group">
                <div className="flex justify-between text-sm font-medium mb-1.5">
                  <span className="text-foreground/80 group-hover:text-foreground transition-colors">{stat.label}</span>
                  <span className="text-muted group-hover:text-accent-cyan transition-colors">
                    {stat.value}/{stat.max}
                    <span className="ml-1 text-xs opacity-60">({stat.grade})</span>
                  </span>
                </div>
                <div className="h-2 rounded-full bg-border overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-1000 ease-out" 
                    style={{ 
                      width: `${Math.round((stat.value / stat.max) * 100)}%`,
                      background: `var(--accent-${['cyan','purple','green','yellow','orange'][i%5]})`
                    }} 
                  />
                </div>
              </div>
            ))}
          </div>
          {/* Improvement Areas from Gap Analysis */}
          {improvements.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border space-y-2">
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">💡 Improvements</h3>
              {improvements.slice(0, 3).map((tip, i) => (
                <p key={i} className="text-xs text-muted/80 leading-relaxed">• {tip}</p>
              ))}
            </div>
          )}

          <Button variant="ghost" size="sm" asChild className="mt-4 w-full justify-between group">
            <Link to="/dashboard/analytics">
              View Detailed Analytics <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </div>

      {/* TIER 2.5: Score Diagnostics */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Radar className="h-5 w-5 text-accent-cyan" />
              Platform Scores
            </CardTitle>
            <CardDescription>Per-platform quality score used in DevScore</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {platformScoreData.length > 0 ? platformScoreData.slice(0, 6).map((item) => (
              <div key={item.platform} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground/85">{item.platformLabel || item.platform}</span>
                  <span className="text-muted">{Math.round(item.score || 0)}/100</span>
                </div>
                <div className="h-2 rounded-full bg-border overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-accent-cyan to-accent-purple"
                    style={{ width: `${Math.max(0, Math.min(100, Math.round(item.score || 0)))}%` }}
                  />
                </div>
              </div>
            )) : (
              <p className="text-sm text-muted">Connect and sync platforms to view platform diagnostics.</p>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-accent-yellow" />
              Strongest Signals
            </CardTitle>
            <CardDescription>Top metrics where you currently perform best</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {strongestSignals.length > 0 ? strongestSignals.map((signal, index) => (
              <div key={`${signal.platform}-${signal.signalId}-${index}`} className="rounded-lg border border-border p-3">
                <p className="text-sm font-medium text-foreground">{signal.metric}</p>
                <p className="text-xs text-muted mt-1">
                  {signal.platformLabel} · {Math.round(signal.score || 0)}/100
                </p>
              </div>
            )) : (
              <p className="text-sm text-muted">No strong-signal diagnostics available yet.</p>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-accent-orange" />
              Focus Areas
            </CardTitle>
            <CardDescription>Low signals and recommended platforms to improve fit</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {weakSignals.slice(0, 3).map((signal, index) => (
              <div key={`${signal.platform}-${signal.signalId}-${index}`} className="rounded-lg border border-border p-3">
                <p className="text-sm font-medium text-foreground">{signal.metric}</p>
                <p className="text-xs text-muted mt-1">
                  {signal.platformLabel} · {Math.round(signal.score || 0)}/100
                </p>
              </div>
            ))}
            {domainSuggestions.slice(0, 2).map((rec, index) => (
              <div key={`${rec.platform}-${index}`} className="rounded-lg border border-dashed border-accent-cyan/35 bg-accent-cyan/5 p-3">
                <p className="text-sm font-medium text-foreground">Connect {rec.platformLabel}</p>
                <p className="text-xs text-muted mt-1">Expected domain impact: {rec.expectedWeight}%</p>
              </div>
            ))}
            {weakSignals.length === 0 && domainSuggestions.length === 0 && (
              <p className="text-sm text-muted">No focus recommendations yet. Keep syncing activity to refine guidance.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* TIER 3: Connected Platforms Inventory */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">Connected Platforms</h2>
          <Link to="/dashboard/settings" className="text-sm font-medium text-accent-cyan hover:underline">
            Manage Connections
          </Link>
        </div>
        
        {platforms.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
          <Card className="border-dashed glass-card">
            <CardContent className="p-10 text-center text-muted">
              <p className="font-medium text-lg">No platforms active</p>
              <p className="text-sm mt-1 mb-4">You have 15 available platforms to link.</p>
              <Button asChild size="sm">
                <Link to="/dashboard/settings">Connect Platforms</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

    </div>
  );
}
