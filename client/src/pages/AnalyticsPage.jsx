import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { scoreService } from '@/services/scoreService';
import { statsService } from '@/services/statsService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity } from 'lucide-react';

export default function AnalyticsPage() {
  const { user } = useAuthStore();
  const userId = user?._id;

  // Fetch score history for trend chart
  const { data: scoreHistory = [] } = useQuery({
    queryKey: ['scoreHistory', userId],
    queryFn: () => scoreService.getScoreHistory(userId),
    enabled: !!userId,
    retry: false,
  });

  // Fetch DSA stats for problem breakdown
  const { data: dsaStats } = useQuery({
    queryKey: ['dsaStats', userId],
    queryFn: () => statsService.getDsaStats(userId),
    enabled: !!userId,
    retry: false,
  });

  // Format score history for chart
  const trendData = scoreHistory.map((entry) => ({
    name: new Date(entry.computedAt || entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    score: entry.overallScore,
  }));

  // Build problem breakdown for bar chart
  const problemData = dsaStats?.leetcode ? [
    { difficulty: 'Easy', count: dsaStats.leetcode.easySolved || 0, fill: 'var(--accent-green)' },
    { difficulty: 'Medium', count: dsaStats.leetcode.mediumSolved || 0, fill: 'var(--accent-orange)' },
    { difficulty: 'Hard', count: dsaStats.leetcode.hardSolved || 0, fill: 'var(--accent-red)' },
  ] : [];

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto p-2 md:p-0">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="h-8 w-8 text-accent-purple" />
            Analytics
          </h1>
          <p className="text-muted mt-1">Deep dive into your problem-solving trends.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="animate-slide-up bg-card/60 backdrop-blur border-border" style={{ animationDelay: '100ms' }}>
          <CardHeader>
            <CardTitle>DevScore Trend</CardTitle>
            <CardDescription>Your aggregate score over time</CardDescription>
          </CardHeader>
            <CardContent className="h-72 w-full min-h-[1px] min-w-[1px]">
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent-purple)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--accent-purple)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--card-elevated)', border: '1px solid var(--border)', borderRadius: '8px' }}
                    itemStyle={{ color: 'var(--foreground)' }}
                  />
                  <Area type="monotone" dataKey="score" stroke="var(--accent-purple)" fillOpacity={1} fill="url(#colorScore)" />
                </AreaChart>
              </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted">
                  <p>No score history yet. Sync your platforms to generate data.</p>
                </div>
              )}
          </CardContent>
        </Card>

        <Card className="animate-slide-up bg-card/60 backdrop-blur border-border" style={{ animationDelay: '200ms' }}>
          <CardHeader>
            <CardTitle>Problems by Difficulty</CardTitle>
            <CardDescription>LeetCode problem breakdown</CardDescription>
          </CardHeader>
            <CardContent className="h-72 w-full min-h-[1px] min-w-[1px]">
              {problemData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <BarChart data={problemData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="difficulty" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--card-elevated)', border: '1px solid var(--border)', borderRadius: '8px' }}
                    itemStyle={{ color: 'var(--foreground)' }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted">
                  <p>Connect LeetCode in Settings to see problem stats.</p>
                </div>
              )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Solved', value: dsaStats?.leetcode?.totalSolved || 0 },
          { label: 'Easy', value: dsaStats?.leetcode?.easySolved || 0 },
          { label: 'Medium', value: dsaStats?.leetcode?.mediumSolved || 0 },
          { label: 'Hard', value: dsaStats?.leetcode?.hardSolved || 0 },
        ].map((stat) => (
          <Card key={stat.label} className="animate-slide-up bg-card/60 backdrop-blur">
            <CardContent className="pt-6 text-center">
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
