import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { profileService } from '@/services/profileService';
import { scoreService } from '@/services/scoreService';
import { statsService } from '@/services/statsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Code2, Trophy, Clock, Share2, Mail, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PublicProfilePage() {
  const { handle } = useParams();

  // First resolve handle → profile (profile.userId._id gives us the real ObjectId)
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['publicProfile', handle],
    queryFn: () => profileService.getProfile(handle),
    enabled: !!handle,
    retry: false,
  });

  // Extract the real MongoDB userId from the populated profile
  const resolvedUserId = profile?.userId?._id || profile?.userId;
  const userName = profile?.userId?.displayName || handle;

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

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="text-muted animate-pulse text-lg">Loading profile...</div></div>;
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Code2 className="h-16 w-16 text-muted/30" />
        <h2 className="text-xl font-semibold text-muted">Profile not found</h2>
        <p className="text-sm text-muted/70">The profile "{handle}" doesn't exist or is private.</p>
        <Link to="/" className="text-accent-cyan hover:underline text-sm">← Back to Home</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in p-4 md:p-0">
      {/* ─── Profile Header ──────── */}
      <div className="text-center space-y-4 py-8">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-accent-cyan/30 to-accent-purple/30 mx-auto flex items-center justify-center text-3xl font-bold border-2 border-accent-cyan/20">
          {(userName || '?')[0]?.toUpperCase()}
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{userName}</h1>
        <div className="flex gap-2 justify-center flex-wrap">
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast.success('Profile link copied!');
            }}
          >
            <Share2 className="h-4 w-4" /> Share Profile
          </Button>
          <Button 
            className="gap-2"
            onClick={() => {
              const subject = encodeURIComponent(`Interested in your profile — ${userName}`);
              const body = encodeURIComponent(`Hi ${userName},\n\nI found your DevFolio profile at ${window.location.href} and I'm interested in connecting with you.\n\nBest regards`);
              window.open(`mailto:?subject=${subject}&body=${body}`);
            }}
          >
            <Mail className="h-4 w-4" /> Hire Me
          </Button>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">{profile.bio || 'No bio yet.'}</p>
        {profile.college && <p className="text-sm text-muted">🎓 {profile.college}</p>}

        {/* Social Links */}
        {(profile.socialLinks?.linkedin || profile.socialLinks?.website) && (
          <div className="flex gap-3 justify-center">
            {profile.socialLinks?.linkedin && (
              <a href={profile.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-accent-cyan hover:underline text-sm flex items-center gap-1">
                <ExternalLink className="h-3 w-3" /> LinkedIn
              </a>
            )}
            {profile.socialLinks?.website && (
              <a href={profile.socialLinks.website} target="_blank" rel="noopener noreferrer" className="text-accent-cyan hover:underline text-sm flex items-center gap-1">
                <ExternalLink className="h-3 w-3" /> Website
              </a>
            )}
          </div>
        )}
      </div>

      {/* ─── DevScore ──────────────── */}
      {devScore && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-accent-orange" /> DevScore</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="text-5xl font-black text-accent-cyan tabular-nums">{devScore.overallScore || 0}</div>
              <div className="text-sm text-muted">out of 100</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── DSA Stats ─────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {dsaStats?.leetcode?.totalSolved > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium">LeetCode</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div className="text-2xl font-bold">{dsaStats.leetcode.totalSolved} Solved</div>
              <div className="flex gap-3 text-xs text-muted">
                <span className="text-green-400">Easy: {dsaStats.leetcode.easySolved}</span>
                <span className="text-yellow-400">Med: {dsaStats.leetcode.mediumSolved}</span>
                <span className="text-red-400">Hard: {dsaStats.leetcode.hardSolved}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {dsaStats?.codeforces?.currentRating > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium">Codeforces</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dsaStats.codeforces.currentRating}</div>
              <div className="text-xs text-muted capitalize">{dsaStats.codeforces.rank || 'unrated'}</div>
            </CardContent>
          </Card>
        )}

        {githubStats?.publicRepos > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium">GitHub</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{githubStats.publicRepos} Repos</div>
              <div className="text-xs text-muted">{githubStats.totalCommits || 0} commits · {githubStats.followers || 0} followers</div>
            </CardContent>
          </Card>
        )}

        {platformStats?.hackerrank?.totalBadges > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium">HackerRank</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{platformStats.hackerrank.totalBadges} Badges</div>
              <div className="text-xs text-muted">{platformStats.hackerrank.totalStars}★</div>
            </CardContent>
          </Card>
        )}

        {platformStats?.codechef?.currentRating > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium">CodeChef</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{platformStats.codechef.currentRating}</div>
              <div className="text-xs text-muted">{platformStats.codechef.stars}</div>
            </CardContent>
          </Card>
        )}

        {platformStats?.kaggle?.tier && platformStats.kaggle.tier !== 'Unknown' && (
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium">Kaggle</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{platformStats.kaggle.tier}</div>
              <div className="text-xs text-muted">{platformStats.kaggle.totalMedals} medals · {platformStats.kaggle.notebooks} notebooks</div>
            </CardContent>
          </Card>
        )}

        {platformStats?.gfg?.totalProblemsSolved > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium">GeeksforGeeks</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{platformStats.gfg.totalProblemsSolved} Solved</div>
              <div className="text-xs text-muted">Score: {platformStats.gfg.score}</div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ─── Footer ──────────────── */}
      <div className="text-center py-6 text-xs text-muted border-t border-border">
        <Clock className="h-3 w-3 inline mr-1" />
        Profile powered by <Link to="/" className="text-accent-cyan hover:underline">DevFolio</Link>
      </div>
    </div>
  );
}
