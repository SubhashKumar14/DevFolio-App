import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { scoreService } from '@/services/scoreService';
import { statsService } from '@/services/statsService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Activity, TrendingUp, Code2, Trophy, Star } from 'lucide-react';

const COLORS = ['#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981', '#ec4899', '#3b82f6', '#f97316', '#14b8a6', '#6366f1'];

export default function AnalyticsPage() {
  const { user } = useAuthStore();
  const userId = user?._id;

  const { data: scoreHistory = [] } = useQuery({
    queryKey: ['scoreHistory', userId],
    queryFn: () => scoreService.getScoreHistory(userId),
    enabled: !!userId, retry: false,
  });

  const { data: dsaStats } = useQuery({
    queryKey: ['dsaStats', userId],
    queryFn: () => statsService.getDsaStats(userId),
    enabled: !!userId, retry: false,
  });

  const { data: githubStats } = useQuery({
    queryKey: ['githubStats', userId],
    queryFn: () => statsService.getGithubStats(userId),
    enabled: !!userId, retry: false,
  });

  const { data: platformStats } = useQuery({
    queryKey: ['platformStats', userId],
    queryFn: () => statsService.getPlatformStats(userId),
    enabled: !!userId, retry: false,
  });

  const { data: devScore } = useQuery({
    queryKey: ['devScore', userId],
    queryFn: () => scoreService.getScore(userId),
    enabled: !!userId, retry: false,
  });

  const scoreData = devScore?.data || devScore;
  const diagnostics = scoreData?.diagnostics || {};

  // ── Chart Data ──────────────
  const trendData = scoreHistory.map((e) => ({
    name: new Date(e.computedAt || e.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    score: e.score ?? e.overallScore ?? 0,
  }));

  const platformScoreData = Object.entries(scoreData?.platformScores || {})
    .map(([platform, value]) => ({
      platform,
      label: value?.platformLabel || platform,
      score: Math.round(value?.score || 0),
      weightPct: Math.round((value?.weight || 0) * 100),
    }))
    .sort((a, b) => b.score - a.score);

  const domainFitData = diagnostics?.domainFitCandidates || [];

  const problemData = dsaStats?.leetcode ? [
    { difficulty: 'Easy', count: dsaStats.leetcode.easySolved || 0, fill: '#10b981' },
    { difficulty: 'Medium', count: dsaStats.leetcode.mediumSolved || 0, fill: '#f59e0b' },
    { difficulty: 'Hard', count: dsaStats.leetcode.hardSolved || 0, fill: '#ef4444' },
  ] : [];

  const cfRatingData = dsaStats?.codeforces?.ratingHistory?.map((r) => ({
    name: r.date,
    rating: r.newRating,
    contest: r.contestName?.substring(0, 20),
  })) || [];

  const langData = (githubStats?.languageDistribution || []).map((l, i) => ({
    name: l.language,
    value: l.count,
    fill: COLORS[i % COLORS.length],
  }));

  // Pillar distribution radar
  const pillars = scoreData?.pillars || {};
  const radarData = [
    {
      metric: 'DSA',
      value: Math.round(((pillars.problemSolving?.score || 0) / Math.max(1, pillars.problemSolving?.max || 100)) * 100),
    },
    {
      metric: 'Build',
      value: Math.round(((pillars.building?.score || 0) / Math.max(1, pillars.building?.max || 100)) * 100),
    },
    {
      metric: 'Community',
      value: Math.round(((pillars.community?.score || 0) / Math.max(1, pillars.community?.max || 100)) * 100),
    },
    {
      metric: 'Consistency',
      value: Math.round(((pillars.consistency?.score || 0) / Math.max(1, pillars.consistency?.max || 100)) * 100),
    },
    {
      metric: 'Specialization',
      value: Math.round(((pillars.specialization?.score || 0) / Math.max(1, pillars.specialization?.max || 100)) * 100),
    },
  ];

  const tooltipStyle = {
    contentStyle: { backgroundColor: 'var(--card-elevated)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' },
    itemStyle: { color: 'var(--foreground)' },
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto p-2 md:p-0">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Activity className="h-8 w-8 text-accent-purple" /> Analytics
        </h1>
        <p className="text-muted mt-1">Deep dive into your multi-platform performance.</p>
      </div>

      {/* ── Quick Stats Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'DevScore', value: scoreData?.overallScore || 0, icon: '🏆' },
          { label: 'LeetCode', value: dsaStats?.leetcode?.totalSolved || 0, icon: '💡' },
          { label: 'CF Rating', value: dsaStats?.codeforces?.currentRating || 0, icon: '📊' },
          { label: 'Repos', value: githubStats?.publicRepos || 0, icon: '📁' },
          { label: 'Commits', value: githubStats?.totalCommits || 0, icon: '🔥' },
        ].map((s) => (
          <Card key={s.label} className="bg-card/60 backdrop-blur animate-slide-up">
            <CardContent className="pt-5 text-center">
              <p className="text-xs text-muted">{s.icon} {s.label}</p>
              <p className="text-2xl font-bold mt-1">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Score Diagnostics Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="animate-slide-up bg-card/60 backdrop-blur">
          <CardHeader>
            <CardTitle>Platform Quality Scores</CardTitle>
            <CardDescription>Normalized score out of 100 for each connected platform</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            {platformScoreData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={platformScoreData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} interval={0} angle={-20} textAnchor="end" height={55} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip
                    {...tooltipStyle}
                    formatter={(value, _name, item) => [`${value}/100`, `${item?.payload?.label || 'Score'}`]}
                    labelFormatter={(label) => {
                      const found = platformScoreData.find((e) => e.label === label);
                      if (!found) return label;
                      return `${found.label} · Weight ${found.weightPct}%`;
                    }}
                  />
                  <Bar dataKey="score" radius={[6, 6, 0, 0]} fill="#06b6d4" />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart msg="Sync connected platforms to compute diagnostics." />}
          </CardContent>
        </Card>

        <Card className="animate-slide-up bg-card/60 backdrop-blur">
          <CardHeader>
            <CardTitle>Domain Fit Candidates</CardTitle>
            <CardDescription>
              Selected: {scoreData?.domainLabel || 'All Rounder'} ({diagnostics?.domainFitScore ?? 0}% fit)
            </CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            {domainFitData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={domainFitData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} interval={0} angle={-20} textAnchor="end" height={55} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip {...tooltipStyle} formatter={(value) => [`${value}%`, 'Fit Score']} />
                  <Bar dataKey="score" radius={[6, 6, 0, 0]} fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart msg="No domain-fit diagnostics available yet." />}
          </CardContent>
        </Card>
      </div>

      {/* ── Guidance Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="animate-slide-up bg-card/60 backdrop-blur">
          <CardHeader>
            <CardTitle>Strongest Signals</CardTitle>
            <CardDescription>Highest quality signal metrics from your connected platforms</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(diagnostics?.strongestSignals || []).length > 0 ? (
              diagnostics.strongestSignals.map((signal, idx) => (
                <div key={`${signal.platform}-${signal.signalId}-${idx}`} className="rounded-lg border border-border p-3">
                  <p className="text-sm font-medium">{signal.metric}</p>
                  <p className="text-xs text-muted mt-1">{signal.platformLabel} · {Math.round(signal.score || 0)}/100</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted">No strongest-signal diagnostics available.</p>
            )}
          </CardContent>
        </Card>

        <Card className="animate-slide-up bg-card/60 backdrop-blur">
          <CardHeader>
            <CardTitle>Focus Recommendations</CardTitle>
            <CardDescription>Weak signals and unconnected platforms that improve domain coverage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(diagnostics?.weakSignals || []).slice(0, 3).map((signal, idx) => (
              <div key={`${signal.platform}-${signal.signalId}-${idx}`} className="rounded-lg border border-border p-3">
                <p className="text-sm font-medium">Improve {signal.metric.toLowerCase()}</p>
                <p className="text-xs text-muted mt-1">{signal.platformLabel} · {Math.round(signal.score || 0)}/100</p>
              </div>
            ))}

            {(diagnostics?.unconnectedPlatformRecommendations || []).slice(0, 2).map((rec, idx) => (
              <div key={`${rec.platform}-${idx}`} className="rounded-lg border border-dashed border-accent-cyan/35 bg-accent-cyan/5 p-3">
                <p className="text-sm font-medium">Connect {rec.platformLabel}</p>
                <p className="text-xs text-muted mt-1">Estimated domain coverage impact: {rec.expectedWeight}%</p>
              </div>
            ))}

            {(diagnostics?.weakSignals || []).length === 0 && (diagnostics?.unconnectedPlatformRecommendations || []).length === 0 && (
              <p className="text-sm text-muted">No recommendation diagnostics available right now.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Row 1: DevScore Trend + Platform Radar ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="animate-slide-up bg-card/60 backdrop-blur" style={{ animationDelay: '100ms' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TrendingUp className="h-4 w-4" /> DevScore Trend</CardTitle>
            <CardDescription>Your aggregate score over time</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} domain={[0, 1000]} />
                  <Tooltip {...tooltipStyle} />
                  <Area type="monotone" dataKey="score" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorScore)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : <EmptyChart msg="Sync platforms to generate score data." />}
          </CardContent>
        </Card>

        <Card className="animate-slide-up bg-card/60 backdrop-blur" style={{ animationDelay: '200ms' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Star className="h-4 w-4" /> Platform Strength</CardTitle>
            <CardDescription>Your relative strength across all platforms</CardDescription>
          </CardHeader>
          <CardContent className="h-64 min-w-0">
            <div className="h-full w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="var(--border)" />
                  <PolarAngleAxis dataKey="metric" stroke="var(--muted-foreground)" fontSize={11} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="You" dataKey="value" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Row 2: LeetCode Breakdown + Codeforces Rating ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="animate-slide-up bg-card/60 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Code2 className="h-4 w-4 text-[#FFA116]" /> LeetCode Problems</CardTitle>
            <CardDescription>Solved by difficulty ({dsaStats?.leetcode?.totalSolved || 0} total)</CardDescription>
          </CardHeader>
          <CardContent className="h-56">
            {problemData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={problemData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="difficulty" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart msg="Connect LeetCode to see problems." />}
          </CardContent>
        </Card>

        <Card className="animate-slide-up bg-card/60 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Trophy className="h-4 w-4 text-[#1890FF]" /> Codeforces Rating</CardTitle>
            <CardDescription>
              {dsaStats?.codeforces?.currentRating > 0
                ? `Current: ${dsaStats.codeforces.currentRating} · Max: ${dsaStats.codeforces.maxRating} · ${dsaStats.codeforces.rank}`
                : 'Rating history over contests'}
            </CardDescription>
          </CardHeader>
          <CardContent className="h-56">
            {cfRatingData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={cfRatingData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip {...tooltipStyle} />
                  <Line type="monotone" dataKey="rating" stroke="#1890FF" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : <EmptyChart msg="Connect Codeforces to see rating history." />}
          </CardContent>
        </Card>
      </div>

      {/* ── Row 3: GitHub Languages + Other Platform Stats ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="animate-slide-up bg-card/60 backdrop-blur">
          <CardHeader>
            <CardTitle>GitHub Languages</CardTitle>
            <CardDescription>Top languages across your repositories</CardDescription>
          </CardHeader>
          <CardContent className="h-56">
            {langData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={langData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {langData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip {...tooltipStyle} />
                  <Legend iconType="circle" formatter={(val) => <span className="text-xs text-muted-foreground">{val}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : <EmptyChart msg="Connect GitHub to see language stats." />}
          </CardContent>
        </Card>

        <Card className="animate-slide-up bg-card/60 backdrop-blur">
          <CardHeader>
            <CardTitle>Other Platforms</CardTitle>
            <CardDescription>HackerRank · CodeChef · Kaggle · GFG</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <PlatformStat label="HackerRank" primary={`${platformStats?.hackerrank?.totalBadges || 0} Badges`} secondary={`${platformStats?.hackerrank?.totalStars || 0}★`} color="#2EC866" />
              <PlatformStat label="CodeChef" primary={platformStats?.codechef?.currentRating || '—'} secondary={platformStats?.codechef?.stars || ''} color="#D4A76A" />
              <PlatformStat label="Kaggle" primary={platformStats?.kaggle?.tier || '—'} secondary={`${platformStats?.kaggle?.totalMedals || 0} Medals`} color="#20BEFF" />
              <PlatformStat label="GFG" primary={`${platformStats?.gfg?.totalProblemsSolved || 0} Solved`} secondary={`Score: ${platformStats?.gfg?.score || 0}`} color="#2F8D46" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── GitHub Stats Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Stars ⭐', value: githubStats?.starsReceived || 0 },
          { label: 'PRs Merged', value: githubStats?.pullRequests || 0 },
          { label: 'Forks', value: githubStats?.forksCount || 0 },
          { label: 'Followers', value: githubStats?.followers || 0 },
        ].map((s) => (
          <Card key={s.label} className="bg-card/60 backdrop-blur animate-slide-up">
            <CardContent className="pt-5 text-center">
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function EmptyChart({ msg }) {
  return (
    <div className="h-full flex items-center justify-center text-muted">
      <p className="text-sm">{msg}</p>
    </div>
  );
}

function PlatformStat({ label, primary, secondary, color }) {
  return (
    <div className="rounded-lg border border-border p-3 space-y-1">
      <p className="text-xs font-medium" style={{ color }}>{label}</p>
      <p className="text-lg font-bold">{primary}</p>
      {secondary && <p className="text-xs text-muted">{secondary}</p>}
    </div>
  );
}
