import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { profileService } from '@/services/profileService';
import { scoreService } from '@/services/scoreService';
import { statsService } from '@/services/statsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Code2, Trophy, Clock, Share2 } from 'lucide-react';

export default function PublicProfilePage() {
  const { handle } = useParams();

  // For now, handle is the userId — we can add username-based lookup later
  const userId = handle;

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['publicProfile', userId],
    queryFn: () => profileService.getProfile(userId),
    enabled: !!userId,
    retry: false,
  });

  const { data: devScore } = useQuery({
    queryKey: ['publicDevScore', userId],
    queryFn: () => scoreService.getScore(userId),
    enabled: !!userId,
    retry: false,
  });

  const { data: dsaStats } = useQuery({
    queryKey: ['publicDsaStats', userId],
    queryFn: () => statsService.getDsaStats(userId),
    enabled: !!userId,
    retry: false,
  });

  const { data: githubStats } = useQuery({
    queryKey: ['publicGithubStats', userId],
    queryFn: () => statsService.getGithubStats(userId),
    enabled: !!userId,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-cyan border-t-transparent" />
      </div>
    );
  }

  if (error || !profile) {
    return <div className="text-center py-20 animate-fade-in text-muted">Profile not found or is private.</div>;
  }

  const userName = profile.userId?.displayName || 'Developer';
  const totalSolved = (dsaStats?.leetcode?.totalSolved || 0) + (githubStats?.publicRepos || 0);

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl animate-fade-in space-y-8">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
        <div className="w-24 h-24 rounded-full bg-accent-cyan/10 flex items-center justify-center text-4xl font-bold text-accent-cyan border border-accent-cyan/20">
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt={userName} className="w-full h-full rounded-full object-cover" />
          ) : (
            userName.charAt(0).toUpperCase()
          )}
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
            <h1 className="text-3xl font-bold">{userName}</h1>
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => navigator.clipboard.writeText(window.location.href)}
            >
              <Share2 className="h-4 w-4" /> Share Profile
            </Button>
          </div>
          <p className="text-muted-foreground max-w-2xl">{profile.bio || 'No bio yet.'}</p>
          {profile.college && <p className="text-sm text-muted">🎓 {profile.college}</p>}
          {profile.techStack?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {profile.techStack.map((tech) => (
                <span key={tech} className="text-xs bg-accent-cyan/10 text-accent-cyan px-2 py-1 rounded-full">{tech}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card-elevated border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted uppercase flex items-center gap-2">
              <Trophy className="h-4 w-4" /> DevScore
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-devscore">
              {devScore?.overallScore || 0}
            </div>
            <p className="text-xs text-muted mt-1">/ 100</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card-elevated border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted uppercase flex items-center gap-2">
              <Code2 className="h-4 w-4" /> LeetCode Solved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{dsaStats?.leetcode?.totalSolved || 0}</div>
            <p className="text-xs text-muted mt-1">
              E: {dsaStats?.leetcode?.easySolved || 0} · M: {dsaStats?.leetcode?.mediumSolved || 0} · H: {dsaStats?.leetcode?.hardSolved || 0}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card-elevated border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted uppercase flex items-center gap-2">
              <Clock className="h-4 w-4" /> GitHub Repos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{githubStats?.publicRepos || 0}</div>
            <p className="text-xs text-muted mt-1">⭐ {githubStats?.starsReceived || 0} stars</p>
          </CardContent>
        </Card>
      </div>

      <div className="text-center pt-8 border-t border-border mt-8">
        <p className="text-muted mb-4">Build your own unified developer profile.</p>
        <Button asChild>
          <Link to="/register">Join DevFolio</Link>
        </Button>
      </div>
    </div>
  );
}
