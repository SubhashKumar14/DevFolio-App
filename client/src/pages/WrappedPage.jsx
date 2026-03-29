import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Sparkles, TrendingUp, Activity, Trophy, Rocket } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { scoreService } from '@/services/scoreService';
import { statsService } from '@/services/statsService';
import { PLATFORM_LIST, ARCHETYPES } from '@/lib/constants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

function toScore(entry) {
  return entry?.score ?? entry?.overallScore ?? 0;
}

function formatDate(value) {
  if (!value) return 'Unknown';
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function sumByYear(calendars, year) {
  const dayMap = new Map();

  for (const calendar of calendars) {
    if (!Array.isArray(calendar)) continue;
    for (const entry of calendar) {
      const date = entry?.date;
      if (!date || Number(entry?.count) <= 0) continue;
      if (!String(date).startsWith(String(year))) continue;
      dayMap.set(date, (dayMap.get(date) || 0) + Number(entry.count));
    }
  }

  const total = [...dayMap.values()].reduce((sum, count) => sum + count, 0);
  return { activeDays: dayMap.size, totalEvents: total };
}

export default function WrappedPage() {
  const { user } = useAuthStore();
  const userId = user?._id;
  const currentYear = new Date().getFullYear();

  const { data: devScore } = useQuery({
    queryKey: ['devScore', userId],
    queryFn: () => scoreService.getScore(userId),
    enabled: !!userId,
    retry: false,
  });

  const { data: scoreHistory = [] } = useQuery({
    queryKey: ['scoreHistory', userId],
    queryFn: () => scoreService.getScoreHistory(userId),
    enabled: !!userId,
    retry: false,
  });

  const { data: githubStats } = useQuery({
    queryKey: ['githubStats', userId],
    queryFn: () => statsService.getGithubStats(userId),
    enabled: !!userId,
    retry: false,
  });

  const { data: dsaStats } = useQuery({
    queryKey: ['dsaStats', userId],
    queryFn: () => statsService.getDsaStats(userId),
    enabled: !!userId,
    retry: false,
  });

  const { data: platformStats } = useQuery({
    queryKey: ['platformStats', userId],
    queryFn: () => statsService.getPlatformStats(userId),
    enabled: !!userId,
    retry: false,
  });

  const scoreData = devScore?.data || devScore || {};
  const diagnostics = scoreData?.diagnostics || {};

  const historyList = Array.isArray(scoreHistory) ? scoreHistory : [];
  const latestScore = scoreData?.overallScore ?? toScore(historyList[0]);
  const bestScore = historyList.length > 0 ? Math.max(latestScore, ...historyList.map((entry) => toScore(entry))) : latestScore;
  const oldestScore = historyList.length > 0 ? toScore(historyList[historyList.length - 1]) : latestScore;
  const scoreGrowth = latestScore - oldestScore;

  const platformScores = Object.entries(scoreData?.platformScores || {}).map(([platform, value]) => ({
    platform,
    label: value?.platformLabel || platform,
    score: value?.score || 0,
  }));
  const strongestPlatform = platformScores.sort((a, b) => b.score - a.score)[0];

  const activePlatforms = PLATFORM_LIST.filter((platform) => Boolean(user?.[platform.field])).length;
  const archetype = user?.archetype ? ARCHETYPES[user.archetype] : null;

  const yearSummary = useMemo(() => {
    const calendars = [
      githubStats?.contributionCalendar,
      dsaStats?.leetcode?.dailyActivity,
      dsaStats?.codeforces?.dailySubmissions,
      platformStats?.hackerrank?.dailyActivity,
      platformStats?.codechef?.dailyActivity,
      platformStats?.kaggle?.dailyActivity,
      platformStats?.huggingface?.dailyActivity,
    ];

    return sumByYear(calendars, currentYear);
  }, [githubStats, dsaStats, platformStats, currentYear]);

  const combinedSolved =
    (dsaStats?.leetcode?.totalSolved || 0) +
    (dsaStats?.codeforces?.totalSolved || 0);

  const highlights = [
    ...(diagnostics?.strongestSignals || []).slice(0, 3).map((signal) => `${signal.metric} on ${signal.platformLabel}`),
    ...(diagnostics?.unconnectedPlatformRecommendations || []).slice(0, 2).map((rec) => `Connect ${rec.platformLabel}`),
  ];

  const topHistory = historyList.slice(0, 6);

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto p-2 md:p-0">
      <div className="text-center space-y-4 pt-4 pb-2">
        <div className="inline-flex items-center justify-center p-3 bg-accent-purple/10 rounded-full mb-1">
          <Sparkles className="h-8 w-8 text-accent-purple" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-accent-purple via-accent-cyan to-accent-green">
          DevFolio Wrapped {currentYear}
        </h1>
        <p className="text-xl text-muted-foreground">Your live backend metrics, summarized.</p>
      </div>

      {activePlatforms === 0 && (
        <Card className="border-2 border-dashed border-accent-cyan/30 bg-accent-cyan/5">
          <CardContent className="py-10 text-center space-y-3">
            <p className="text-lg font-bold">Connect your platforms to generate Wrapped insights</p>
            <p className="text-sm text-muted">Once synced, this page will continuously update from backend score and stats APIs.</p>
            <Button asChild size="sm">
              <Link to="/dashboard/settings">Connect Platforms</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Trophy className="h-6 w-6 text-accent-yellow" />
            Your Year Snapshot
          </CardTitle>
          <CardDescription>
            Domain: {scoreData?.domainLabel || 'All Rounder'}
            {archetype ? ` · Archetype: ${archetype.label}` : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard label="Current DevScore" value={latestScore} hint="out of 1000" />
          <MetricCard label="Best DevScore" value={bestScore} hint="all recorded snapshots" />
          <MetricCard label="Score Growth" value={`${scoreGrowth >= 0 ? '+' : ''}${scoreGrowth}`} hint="from earliest snapshot" />
          <MetricCard label="Active Platforms" value={activePlatforms} hint="connected this account" />
          <MetricCard label={`${currentYear} Active Days`} value={yearSummary.activeDays} hint="days with recorded activity" />
          <MetricCard label={`${currentYear} Activity Events`} value={yearSummary.totalEvents} hint="sum across calendars" />
          <MetricCard label="Problems Solved" value={combinedSolved} hint="LeetCode + Codeforces" />
          <MetricCard
            label="Strongest Platform"
            value={strongestPlatform ? strongestPlatform.label : 'N/A'}
            hint={strongestPlatform ? `${Math.round(strongestPlatform.score)}/100` : 'sync to compute'}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Rocket className="h-5 w-5 text-accent-cyan" />
              Highlights
            </CardTitle>
            <CardDescription>Generated from DevScore diagnostics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {highlights.length > 0 ? highlights.map((item, idx) => (
              <p key={idx} className="text-sm text-muted">• {item}</p>
            )) : (
              <p className="text-sm text-muted">No highlights yet. Run sync to generate richer diagnostics.</p>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5 text-accent-purple" />
              Score Timeline
            </CardTitle>
            <CardDescription>Most recent DevScore snapshots</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {topHistory.length > 0 ? topHistory.map((entry) => (
              <div key={entry._id || entry.createdAt} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                <span className="text-muted">{formatDate(entry.computedAt || entry.createdAt)}</span>
                <span className="font-semibold text-foreground">{toScore(entry)}</span>
              </div>
            )) : (
              <p className="text-sm text-muted">No score history yet. Sync once to start your timeline.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-accent-green" />
            Data Sources
          </CardTitle>
          <CardDescription>Wrapped currently runs on live API responses</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted space-y-1">
          <p>• /api/score/:userId</p>
          <p>• /api/score/:userId/history</p>
          <p>• /api/stats/github/:userId</p>
          <p>• /api/stats/dsa/:userId</p>
          <p>• /api/stats/platforms/:userId</p>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ label, value, hint }) {
  return (
    <div className="rounded-lg border border-border bg-card-elevated px-4 py-3">
      <p className="text-xs text-muted uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold mt-1 text-foreground">{value}</p>
      <p className="text-xs text-muted mt-1">{hint}</p>
    </div>
  );
}
