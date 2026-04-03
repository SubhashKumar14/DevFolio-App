import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Target, RefreshCw, TrendingUp, Link2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { scoreService } from '@/services/scoreService';
import { statsService } from '@/services/statsService';
import { PLATFORM_LIST } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function nextMilestone(current, step, floor = step) {
  if (current < floor) return floor;
  return Math.ceil((current + 1) / step) * step;
}

function toProgress(current, target) {
  if (!target || target <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((current / target) * 100)));
}

export default function GoalsPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const userId = user?._id;

  const invalidateUserDataQueries = async () => {
    if (!userId) return;

    const queryKeys = [
      ['user', 'me'],
      ['profile', userId],
      ['githubStats', userId],
      ['dsaStats', userId],
      ['platformStats', userId],
      ['devScore', userId],
      ['scoreHistory', userId],
      ['scoreBenchmark', userId],
      ['leaderboard'],
    ];

    await Promise.all(queryKeys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
  };

  const { data: devScore } = useQuery({
    queryKey: ['devScore', userId],
    queryFn: () => scoreService.getScore(userId),
    enabled: !!userId,
    retry: false,
  });

  const { data: dsaStats } = useQuery({
    queryKey: ['dsaStats', userId],
    queryFn: () => statsService.getDsaStats(userId),
    enabled: !!userId,
    retry: false,
  });

  const { data: githubStats } = useQuery({
    queryKey: ['githubStats', userId],
    queryFn: () => statsService.getGithubStats(userId),
    enabled: !!userId,
    retry: false,
  });

  const syncMutation = useMutation({
    mutationFn: () => statsService.syncStatsAndWait(),
    onSuccess: async (job) => {
      await invalidateUserDataQueries();
      if (job?.errorCount > 0) {
        toast.success(job.message || `Sync completed with ${job.errorCount} warning(s).`);
        return;
      }

      toast.success('Goals updated from latest backend data');
    },
    onError: (error) => {
      toast.error(error?.message || 'Sync failed. Please try again.');
    },
  });

  const scoreData = useMemo(() => devScore?.data || devScore || null, [devScore]);
  const diagnostics = useMemo(() => scoreData?.diagnostics || null, [scoreData]);

  const goalCards = useMemo(() => {
    const totalProblemsSolved =
      (dsaStats?.leetcode?.totalSolved || 0) +
      (dsaStats?.codeforces?.totalSolved || 0);

    const currentScore = scoreData?.overallScore || 0;
    const commits = githubStats?.totalCommits || 0;
    const cfRating = dsaStats?.codeforces?.currentRating || dsaStats?.codeforces?.rating || 0;
    const streak = githubStats?.currentStreak || 0;
    const activePlatforms = PLATFORM_LIST.filter((platform) => Boolean(user?.[platform.field])).length;

    return [
      {
        id: 'devscore',
        label: 'DevScore',
        description: 'Reach your next score band',
        current: currentScore,
        target: Math.min(1000, nextMilestone(currentScore, 100, 200)),
        suffix: '/1000',
      },
      {
        id: 'problems',
        label: 'Problems Solved',
        description: 'Strengthen problem-solving depth',
        current: totalProblemsSolved,
        target: nextMilestone(totalProblemsSolved, 100, 100),
        suffix: '',
      },
      {
        id: 'commits',
        label: 'GitHub Commits',
        description: 'Improve consistency this season',
        current: commits,
        target: nextMilestone(commits, 250, 250),
        suffix: '',
      },
      {
        id: 'platforms',
        label: 'Connected Platforms',
        description: 'Increase domain coverage and fairness',
        current: activePlatforms,
        target: Math.min(7, Math.max(3, activePlatforms + 2)),
        suffix: '/7',
      },
      {
        id: 'codeforces',
        label: 'Codeforces Rating',
        description: 'Move to the next competitive tier',
        current: cfRating,
        target: cfRating > 0 ? nextMilestone(cfRating, 100, 1200) : 1200,
        suffix: '',
      },
      {
        id: 'streak',
        label: 'Current Streak',
        description: 'Stay consistent daily',
        current: streak,
        target: nextMilestone(streak, 7, 14),
        suffix: ' days',
      },
    ];
  }, [dsaStats, githubStats, scoreData, user]);

  const recommendations = useMemo(() => {
    const recs = [];

    for (const signal of (diagnostics?.weakSignals || []).slice(0, 3)) {
      recs.push(`Improve ${signal.metric.toLowerCase()} on ${signal.platformLabel}`);
    }

    for (const rec of (diagnostics?.unconnectedPlatformRecommendations || []).slice(0, 2)) {
      recs.push(`Connect ${rec.platformLabel} for roughly ${rec.expectedWeight}% stronger domain fit`);
    }

    if (recs.length === 0) {
      recs.push('Sync your latest stats to generate personalized goals and recommendations.');
    }

    return recs;
  }, [diagnostics]);

  const activePlatformsCount = PLATFORM_LIST.filter((platform) => Boolean(user?.[platform.field])).length;

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto p-2 md:p-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Target className="h-8 w-8 text-accent-green" />
            Goals and Targets
          </h1>
          <p className="text-muted mt-1">Dynamic progress goals powered by your real backend metrics.</p>
        </div>
        <Button onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
          {syncMutation.isPending ? 'Syncing...' : 'Sync and Refresh'}
        </Button>
      </div>

      {activePlatformsCount === 0 && (
        <Card className="border-2 border-dashed border-accent-cyan/30 bg-accent-cyan/5">
          <CardContent className="py-8 text-center space-y-3">
            <AlertCircle className="h-10 w-10 mx-auto text-accent-cyan" />
            <h2 className="text-lg font-bold">No platform data connected yet</h2>
            <p className="text-sm text-muted">Connect your coding profiles to unlock personalized goals.</p>
            <Button asChild size="sm">
              <Link to="/dashboard/settings">Connect Platforms</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {goalCards.map((goal) => {
          const progress = toProgress(goal.current, goal.target);
          const remaining = Math.max(0, goal.target - goal.current);
          const isComplete = goal.current >= goal.target;

          return (
            <Card key={goal.id} className="glass-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>{goal.label}</span>
                  <span className="text-sm text-muted">
                    {goal.current}{goal.suffix}
                  </span>
                </CardTitle>
                <CardDescription>{goal.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5">
                <div className="h-2 rounded-full bg-border overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${progress}%`, background: 'var(--accent-green)' }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-muted">
                  <span>Target: {goal.target}{goal.suffix}</span>
                  <span>{progress}%</span>
                </div>
                <p className="text-xs text-muted">
                  {isComplete
                    ? 'Goal complete. Time to set a higher milestone.'
                    : `${remaining}${goal.suffix} remaining to hit this goal.`}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-accent-cyan" />
            Recommended Next Actions
          </CardTitle>
          <CardDescription>Based on weak signals and missing domain coverage from DevScore diagnostics.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {recommendations.map((item, idx) => (
            <p key={idx} className="text-sm text-muted">• {item}</p>
          ))}
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Link2 className="h-5 w-5 text-accent-purple" />
            Goal Engine Inputs
          </CardTitle>
          <CardDescription>These goals are currently driven by live backend endpoints.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted space-y-1">
          <p>• DevScore and diagnostics: /api/score/:userId</p>
          <p>• DSA stats: /api/stats/dsa/:userId</p>
          <p>• GitHub stats: /api/stats/github/:userId</p>
          <p>• Extended platform stats: /api/stats/platforms/:userId</p>
        </CardContent>
      </Card>
    </div>
  );
}
