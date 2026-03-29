import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { profileService } from '@/services/profileService';
import { scoreService } from '@/services/scoreService';
import { statsService } from '@/services/statsService';
import { QuickStats } from '@/components/dashboard/QuickStats';
import { PlatformCard } from '@/components/dashboard/PlatformCard';
import ActivityHeatmap from '@/components/dashboard/ActivityHeatmap';
import StreakCounter from '@/components/dashboard/StreakCounter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Code2, Share2, Mail, ExternalLink, FileCode, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

function PublicProfileSkeleton() {
  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-pulse p-4 md:p-0">
      <div className="h-44 rounded-xl bg-card" />
      <div className="h-24 rounded-xl bg-card" />
      <div className="h-[320px] rounded-xl bg-card" />
    </div>
  );
}

export default function PublicProfilePage() {
  const { handle } = useParams();

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['publicProfile', handle],
    queryFn: () => profileService.getProfile(handle),
    enabled: !!handle,
    retry: false,
  });

  const resolvedUserId = profile?.userId?._id || profile?.userId;
  const userName = profile?.userId?.displayName || handle;
  const userData = useMemo(() => profile?.userId || {}, [profile?.userId]);

  const { data: devScore } = useQuery({
    queryKey: ['publicDevScore', resolvedUserId],
    queryFn: () => scoreService.getScore(resolvedUserId),
    enabled: !!resolvedUserId,
    retry: false,
  });

  const { data: dsaStats } = useQuery({
    queryKey: ['publicDsaStats', resolvedUserId],
    queryFn: () => statsService.getDsaStats(resolvedUserId),
    enabled: !!resolvedUserId,
    retry: false,
  });

  const { data: githubStats } = useQuery({
    queryKey: ['publicGithubStats', resolvedUserId],
    queryFn: () => statsService.getGithubStats(resolvedUserId),
    enabled: !!resolvedUserId,
    retry: false,
  });

  const { data: platformStats } = useQuery({
    queryKey: ['publicPlatformStats', resolvedUserId],
    queryFn: () => statsService.getPlatformStats(resolvedUserId),
    enabled: !!resolvedUserId,
    retry: false,
  });

  const quickStats = {
    totalProblemsSolved: dsaStats?.leetcode?.totalSolved || 0,
    totalRepos: githubStats?.publicRepos || 0,
    activePlatforms: [
      userData?.githubUsername,
      userData?.leetcodeUsername,
      userData?.codeforcesUsername,
      userData?.hackerrankUsername,
      userData?.codechefUsername,
      userData?.kaggleUsername,
      userData?.huggingfaceUsername,
    ].filter(Boolean).length,
    currentStreak: 0,
  };

  const platforms = useMemo(() => {
    const list = [];
    if (userData?.leetcodeUsername) {
      const total = dsaStats?.leetcode?.totalSolved || 1;
      list.push({
        id: 'leetcode',
        username: userData.leetcodeUsername,
        primaryStat: `${dsaStats?.leetcode?.totalSolved || 0} Solved`,
        rating: '',
        breakdown: dsaStats?.leetcode
          ? {
              label1: 'Easy',
              pct1: Math.round(((dsaStats.leetcode.easySolved || 0) / total) * 100),
              label2: 'Medium',
              pct2: Math.round(((dsaStats.leetcode.mediumSolved || 0) / total) * 100),
              label3: 'Hard',
              pct3: Math.round(((dsaStats.leetcode.hardSolved || 0) / total) * 100),
            }
          : null,
      });
    }

    if (userData?.githubUsername) {
      list.push({
        id: 'github',
        username: userData.githubUsername,
        primaryStat: `${githubStats?.publicRepos || 0} Repos`,
        rating: `${githubStats?.starsReceived || 0}★`,
        breakdown: null,
      });
    }

    if (userData?.codeforcesUsername) {
      list.push({
        id: 'codeforces',
        username: userData.codeforcesUsername,
        primaryStat: `${dsaStats?.codeforces?.currentRating || 0}`,
        rating: dsaStats?.codeforces?.rank || 'unrated',
        breakdown: null,
      });
    }

    if (userData?.hackerrankUsername) {
      list.push({
        id: 'hackerrank',
        username: userData.hackerrankUsername,
        primaryStat: `${platformStats?.hackerrank?.totalBadges || 0} Badges`,
        rating: `${platformStats?.hackerrank?.totalStars || 0}★`,
        breakdown: null,
      });
    }

    if (userData?.codechefUsername) {
      list.push({
        id: 'codechef',
        username: userData.codechefUsername,
        primaryStat: `${platformStats?.codechef?.currentRating || 0}`,
        rating: platformStats?.codechef?.stars || '',
        breakdown: null,
      });
    }

    if (userData?.kaggleUsername) {
      list.push({
        id: 'kaggle',
        username: userData.kaggleUsername,
        primaryStat: platformStats?.kaggle?.tier || 'Unknown',
        rating: `${platformStats?.kaggle?.totalMedals || 0} Medals`,
        breakdown: null,
      });
    }

    return list;
  }, [userData, dsaStats, githubStats, platformStats]);

  const scoreBreakdown = devScore?.pillars
    ? [
        {
          label: 'Problem Solving',
          value: devScore.pillars.problemSolving?.score || 0,
          max: devScore.pillars.problemSolving?.max || 200,
        },
        {
          label: 'Building',
          value: devScore.pillars.building?.score || 0,
          max: devScore.pillars.building?.max || 200,
        },
        {
          label: 'Community',
          value: devScore.pillars.community?.score || 0,
          max: devScore.pillars.community?.max || 200,
        },
        {
          label: 'Consistency',
          value: devScore.pillars.consistency?.score || 0,
          max: devScore.pillars.consistency?.max || 200,
        },
        {
          label: 'Specialization',
          value: devScore.pillars.specialization?.score || 0,
          max: devScore.pillars.specialization?.max || 200,
        },
      ]
    : [];

  if (isLoading) return <PublicProfileSkeleton />;

  if (error || !profile) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <Code2 className="h-16 w-16 text-muted/30" />
        <h2 className="text-xl font-semibold text-muted">Profile not found</h2>
        <p className="text-sm text-muted/70">The profile "{handle}" does not exist or is private.</p>
        <Link to="/" className="text-accent-cyan hover:underline text-sm">Back to Home</Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in p-4 md:p-0">
      <div className="rounded-xl border border-border bg-card px-6 py-8 text-center">
        <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full border-2 border-accent-cyan/20 bg-gradient-to-br from-accent-cyan/30 to-accent-purple/30 text-3xl font-bold">
          {(userName || '?')[0]?.toUpperCase()}
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{userName}</h1>
        {(userData?.archetype || userData?.secondaryArchetype) && (
          <p className="mt-2 text-sm text-muted">
            {userData.archetype ? userData.archetype.replace('_', ' ') : 'None'}
            {userData.secondaryArchetype ? ` + ${userData.secondaryArchetype.replace('_', ' ')}` : ''}
          </p>
        )}
        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">{profile.bio || 'No bio yet.'}</p>
        {profile.college && <p className="mt-2 text-sm text-muted">{profile.college}</p>}

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast.success('Profile link copied');
            }}
          >
            <Share2 className="h-4 w-4" /> Share Profile
          </Button>
          <Button
            className="gap-2"
            onClick={() => {
              const subject = encodeURIComponent(`Interested in your profile - ${userName}`);
              const body = encodeURIComponent(
                `Hi ${userName},\n\nI found your DevFolio profile at ${window.location.href} and wanted to connect.\n\nBest regards`
              );
              window.open(`mailto:?subject=${subject}&body=${body}`);
            }}
          >
            <Mail className="h-4 w-4" /> Contact
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <Link to={`/portfolio/${encodeURIComponent(userName)}`} target="_blank">
              <ExternalLink className="h-4 w-4" /> View Portfolio
            </Link>
          </Button>
          {profile?.socialLinks?.resumeUrl && (
            <Button asChild variant="outline" className="gap-2">
              <a href={profile.socialLinks.resumeUrl} target="_blank" rel="noreferrer">
                <FileText className="h-4 w-4" /> View Resume
              </a>
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <StreakCounter
          githubCalendar={githubStats?.contributionCalendar || []}
          leetcodeCalendar={dsaStats?.leetcode?.dailyActivity || []}
          codeforcesCalendar={dsaStats?.codeforces?.dailySubmissions || []}
          hackerrankCalendar={platformStats?.hackerrank?.dailyActivity || []}
          codechefCalendar={platformStats?.codechef?.dailyActivity || []}
          kaggleCalendar={platformStats?.kaggle?.dailyActivity || []}
          huggingfaceCalendar={platformStats?.huggingface?.dailyActivity || []}
        />
      </div>

      <QuickStats stats={quickStats} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <ActivityHeatmap
            githubCalendar={githubStats?.contributionCalendar || []}
            leetcodeCalendar={dsaStats?.leetcode?.dailyActivity || []}
            codeforcesCalendar={dsaStats?.codeforces?.dailySubmissions || []}
            hackerrankCalendar={platformStats?.hackerrank?.dailyActivity || []}
            codechefCalendar={platformStats?.codechef?.dailyActivity || []}
            kaggleCalendar={platformStats?.kaggle?.dailyActivity || []}
            huggingfaceCalendar={platformStats?.huggingface?.dailyActivity || []}
          />
        </div>

        <div className="lg:col-span-4">
          <div className="h-full rounded-xl border border-border bg-card p-6 text-center">
            <h2 className="mb-4 text-lg font-semibold tracking-tight">DevScore</h2>
            <div className="relative inline-flex items-center justify-center">
              <svg className="h-36 w-36 -rotate-90">
                <circle cx="72" cy="72" r="60" stroke="var(--border)" strokeWidth="10" fill="none" />
                <circle
                  cx="72"
                  cy="72"
                  r="60"
                  stroke="url(#publicScoreGrad)"
                  strokeWidth="10"
                  fill="none"
                  strokeDasharray="377"
                  strokeDashoffset={377 - (377 * (devScore?.overallScore || 0)) / 1000}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
                <defs>
                  <linearGradient id="publicScoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="50%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="bg-gradient-devscore bg-clip-text text-3xl font-bold text-transparent">
                  {devScore?.overallScore || 0}
                </span>
                <span className="text-xs font-medium text-muted">/ 1000</span>
              </div>
            </div>

            <div className="mt-6 space-y-3 text-left">
              {scoreBreakdown.map((stat) => (
                <div key={stat.label}>
                  <div className="mb-1 flex justify-between text-xs font-semibold">
                    <span>{stat.label}</span>
                    <span>{stat.value}/{stat.max}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-card-elevated">
                    <div className="h-full rounded-full bg-accent-purple" style={{ width: `${Math.round((stat.value / Math.max(1, stat.max)) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">Connected Platforms</h2>
          {platforms.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {platforms.map((platform) => (
                <PlatformCard key={platform.id} platform={platform} readonly />
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center text-muted">
                <p className="font-medium">No platform stats available</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <FileCode className="h-5 w-5 text-accent-cyan" /> Portfolio and Resume
          </div>
          <div className="rounded-xl border border-border bg-card p-6 space-y-3">
            <Button asChild className="w-full gap-2">
              <Link to={`/portfolio/${encodeURIComponent(userName)}`} target="_blank">
                <ExternalLink className="h-4 w-4" /> View Portfolio
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full gap-2" disabled={!profile?.socialLinks?.resumeUrl}>
              {profile?.socialLinks?.resumeUrl ? (
                <a href={profile.socialLinks.resumeUrl} target="_blank" rel="noreferrer">
                  <FileText className="h-4 w-4" /> View Resume
                </a>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Resume unavailable
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

    </div>
  );
}
