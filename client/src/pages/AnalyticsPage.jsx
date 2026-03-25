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

  // ── Chart Data ──────────────
  const trendData = scoreHistory.map((e) => ({
    name: new Date(e.computedAt || e.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    score: e.overallScore,
  }));

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

  // Platform comparison radar
  const radarData = [
    { metric: 'GitHub', value: Math.min((githubStats?.totalCommits || 0) / 10, 100) },
    { metric: 'LeetCode', value: Math.min((dsaStats?.leetcode?.totalSolved || 0) / 5, 100) },
    { metric: 'Codeforces', value: Math.min((dsaStats?.codeforces?.currentRating || 0) / 20, 100) },
    { metric: 'HackerRank', value: Math.min((platformStats?.hackerrank?.totalBadges || 0) * 10, 100) },
    { metric: 'CodeChef', value: Math.min((platformStats?.codechef?.currentRating || 0) / 20, 100) },
    { metric: 'GFG', value: Math.min((platformStats?.gfg?.totalProblemsSolved || 0) / 5, 100) },
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
          { label: 'DevScore', value: devScore?.overallScore || 0, icon: '🏆' },
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
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
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
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="metric" stroke="var(--muted-foreground)" fontSize={11} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="You" dataKey="value" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
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
