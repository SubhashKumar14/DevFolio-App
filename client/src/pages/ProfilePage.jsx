import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { profileService } from '@/services/profileService';
import { scoreService } from '@/services/scoreService';
import { statsService } from '@/services/statsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

export default function ProfilePage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const userId = user?._id;

  const { data: profile } = useQuery({
    queryKey: ['profile', userId],
    queryFn: () => profileService.getProfile(userId),
    enabled: !!userId,
  });

  const { data: devScore } = useQuery({
    queryKey: ['devScore', userId],
    queryFn: () => scoreService.getScore(userId),
    enabled: !!userId,
  });

  const { data: githubStats } = useQuery({
    queryKey: ['githubStats', userId],
    queryFn: () => statsService.getGithubStats(userId),
    enabled: !!userId,
    retry: false,
  });

  const [bio, setBio] = useState('');
  const [techStack, setTechStack] = useState('');

  const updateMutation = useMutation({
    mutationFn: (data) => profileService.updateProfile(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile'] }),
  });

  const handleSave = () => {
    const data = {};
    if (bio) data.bio = bio;
    if (techStack) data.techStack = techStack.split(',').map(s => s.trim()).filter(Boolean);
    updateMutation.mutate(data);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in p-2 md:p-0">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted mt-1">View and edit your developer profile.</p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-accent-cyan/10 flex items-center justify-center text-3xl font-bold text-accent-cyan border border-accent-cyan/20">
              {githubStats?.githubAvatarUrl ? (
                <img src={githubStats.githubAvatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                user?.displayName?.[0]?.toUpperCase() || 'D'
              )}
            </div>
            <div>
              <CardTitle className="text-2xl">{user?.displayName}</CardTitle>
              <p className="text-muted">{user?.email}</p>
              <div className="mt-2 text-transparent bg-clip-text bg-gradient-devscore font-bold text-lg">
                DevScore: {devScore?.overallScore || 0}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Bio</Label>
            <textarea
              className="flex min-h-[80px] w-full rounded-md border border-border bg-card-elevated px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan"
              value={bio || profile?.bio || ''}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell the world about yourself..."
            />
          </div>
          <div className="space-y-2">
            <Label>Tech Stack (comma-separated)</Label>
            <Input
              value={techStack || profile?.techStack?.join(', ') || ''}
              onChange={(e) => setTechStack(e.target.value)}
              placeholder="React, Node.js, Python, ..."
            />
          </div>
          {profile?.techStack?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {profile.techStack.map(t => (
                <span key={t} className="text-xs bg-accent-cyan/10 text-accent-cyan px-2 py-1 rounded-full">{t}</span>
              ))}
            </div>
          )}
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Saving...' : 'Save Profile'}
          </Button>
        </CardContent>
      </Card>

      {/* Connected Platforms */}
      <Card>
        <CardHeader>
          <CardTitle>Connected Platforms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: 'GitHub', value: user?.githubUsername },
            { label: 'LeetCode', value: user?.leetcodeUsername },
            { label: 'Codeforces', value: user?.codeforcesUsername },
          ].map(p => (
            <div key={p.label} className="flex items-center justify-between p-3 border border-border rounded-lg">
              <span className="font-medium">{p.label}</span>
              {p.value ? (
                <span className="text-sm text-accent-green">@{p.value}</span>
              ) : (
                <span className="text-sm text-muted">Not connected</span>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
