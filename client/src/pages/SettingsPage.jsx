import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { profileService } from '@/services/profileService';
import { integrationService } from '@/services/integrationService';
import { statsService } from '@/services/statsService';
import { authService } from '@/services/authService';
import apiClient from '@/lib/apiClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('profile');

  // Fetch profile data
  const { data: profile } = useQuery({
    queryKey: ['profile', user?._id],
    queryFn: () => profileService.getProfile(user?._id),
    enabled: !!user?._id,
  });

  // Profile form state
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');

  // Platform form state — initialized from user store
  const [githubUsername, setGithubUsername] = useState('');
  const [leetcodeUsername, setLeetcodeUsername] = useState('');
  const [codeforcesUsername, setCodeforcesUsername] = useState('');
  const [hackerrankUsername, setHackerrankUsername] = useState('');
  const [codechefUsername, setCodechefUsername] = useState('');
  const [kaggleUsername, setKaggleUsername] = useState('');
  const [gfgUsername, setGfgUsername] = useState('');

  // Initialize form when user/profile data loads
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setGithubUsername(user.githubUsername || '');
      setLeetcodeUsername(user.leetcodeUsername || '');
      setCodeforcesUsername(user.codeforcesUsername || '');
      setHackerrankUsername(user.hackerrankUsername || '');
      setCodechefUsername(user.codechefUsername || '');
      setKaggleUsername(user.kaggleUsername || '');
      setGfgUsername(user.gfgUsername || '');
    }
  }, [user]);

  useEffect(() => {
    if (profile) setBio(profile.bio || '');
  }, [profile]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data) => profileService.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  // Update user mutation (display name)
  const updateUserMutation = useMutation({
    mutationFn: async (data) => {
      const res = await apiClient.put('/user/me', data);
      return res;
    },
    onSuccess: (data) => {
      if (data.success) {
        setUser(data.data);
        queryClient.invalidateQueries({ queryKey: ['user'] });
      }
    },
  });

  // Connect platforms mutation
  const connectPlatformsMutation = useMutation({
    mutationFn: (data) => integrationService.connectDsa(data),
    onSuccess: async (response) => {
      // Update Zustand store with the returned user data
      const updatedUser = response.data?.data || response.data;
      if (updatedUser?._id) {
        setUser(updatedUser);
      }
      queryClient.invalidateQueries({ queryKey: ['user'] });

      // Now trigger sync (usernames are saved in DB at this point)
      try {
        await statsService.syncStats();
        queryClient.invalidateQueries({ queryKey: ['githubStats'] });
        queryClient.invalidateQueries({ queryKey: ['dsaStats'] });
        queryClient.invalidateQueries({ queryKey: ['devScore'] });
      } catch (err) {
        console.error('Auto-sync after connect failed:', err);
      }
    },
  });

  const handleSaveProfile = () => {
    if (displayName && displayName !== user?.displayName) {
      updateUserMutation.mutate({ displayName });
    }
    if (bio !== undefined) {
      updateProfileMutation.mutate({ bio });
    }
  };

  const handleConnectPlatforms = () => {
    const data = {};
    if (githubUsername) data.githubUsername = githubUsername;
    if (leetcodeUsername) data.leetcodeUsername = leetcodeUsername;
    if (codeforcesUsername) data.codeforcesUsername = codeforcesUsername;
    if (hackerrankUsername) data.hackerrankUsername = hackerrankUsername;
    if (codechefUsername) data.codechefUsername = codechefUsername;
    if (kaggleUsername) data.kaggleUsername = kaggleUsername;
    if (gfgUsername) data.gfgUsername = gfgUsername;
    if (Object.keys(data).length > 0) {
      connectPlatformsMutation.mutate(data);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in p-2 md:p-0">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted mt-1">Manage your account settings and connected platforms.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <aside className="md:w-64 space-y-1 shrink-0">
          {['profile', 'platforms', 'privacy'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab ? 'bg-card-elevated text-foreground font-semibold' : 'text-muted hover:bg-card-elevated/50'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)} Settings
            </button>
          ))}
        </aside>

        <div className="flex-1">
          {activeTab === 'profile' && (
            <Card className="animate-slide-up">
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Update your public profile display name and bio.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input 
                    id="displayName" 
                    value={displayName || user?.displayName || ''} 
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <textarea 
                    id="bio"
                    className="flex min-h-[100px] w-full rounded-md border border-border bg-card-elevated px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan"
                    placeholder="Briefly describe your developer journey..."
                    value={bio || profile?.bio || ''}
                    onChange={(e) => setBio(e.target.value)}
                  />
                </div>
              </CardContent>
              <CardFooter className="border-t border-border pt-6">
                <Button 
                  onClick={handleSaveProfile}
                  disabled={updateProfileMutation.isPending || updateUserMutation.isPending}
                >
                  {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardFooter>
            </Card>
          )}

          {activeTab === 'platforms' && (
            <Card className="animate-slide-up">
              <CardHeader>
                <CardTitle>Connected Platforms</CardTitle>
                <CardDescription>Enter your platform usernames (not full URLs) to connect and sync your stats.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* GitHub */}
                <div className="p-4 border border-border rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">GitHub</h4>
                    {user?.githubUsername && (
                      <span className="text-xs bg-accent-green/20 text-accent-green py-1 px-3 rounded-full font-medium">Connected</span>
                    )}
                  </div>
                  <Input 
                    placeholder="e.g. SubhashKumar14"
                    value={githubUsername}
                    onChange={(e) => setGithubUsername(e.target.value)}
                  />
                </div>

                {/* LeetCode */}
                <div className="p-4 border border-border rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">LeetCode</h4>
                    {user?.leetcodeUsername && (
                      <span className="text-xs bg-accent-green/20 text-accent-green py-1 px-3 rounded-full font-medium">Connected</span>
                    )}
                  </div>
                  <Input 
                    placeholder="e.g. Subhash_Kumar14"
                    value={leetcodeUsername}
                    onChange={(e) => setLeetcodeUsername(e.target.value)}
                  />
                </div>

                {/* Codeforces */}
                <div className="p-4 border border-border rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Codeforces</h4>
                    {user?.codeforcesUsername && (
                      <span className="text-xs bg-accent-green/20 text-accent-green py-1 px-3 rounded-full font-medium">Connected</span>
                    )}
                  </div>
                  <Input 
                    placeholder="e.g. tourist"
                    value={codeforcesUsername}
                    onChange={(e) => setCodeforcesUsername(e.target.value)}
                  />
                </div>

                {/* HackerRank */}
                <div className="p-4 border border-border rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">HackerRank</h4>
                    {user?.hackerrankUsername && (
                      <span className="text-xs bg-accent-green/20 text-accent-green py-1 px-3 rounded-full font-medium">Connected</span>
                    )}
                  </div>
                  <Input 
                    placeholder="e.g. hackerrank_user"
                    value={hackerrankUsername}
                    onChange={(e) => setHackerrankUsername(e.target.value)}
                  />
                </div>

                {/* CodeChef */}
                <div className="p-4 border border-border rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">CodeChef</h4>
                    {user?.codechefUsername && (
                      <span className="text-xs bg-accent-green/20 text-accent-green py-1 px-3 rounded-full font-medium">Connected</span>
                    )}
                  </div>
                  <Input 
                    placeholder="e.g. chef_user"
                    value={codechefUsername}
                    onChange={(e) => setCodechefUsername(e.target.value)}
                  />
                </div>

                {/* Kaggle */}
                <div className="p-4 border border-border rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Kaggle</h4>
                    {user?.kaggleUsername && (
                      <span className="text-xs bg-accent-green/20 text-accent-green py-1 px-3 rounded-full font-medium">Connected</span>
                    )}
                  </div>
                  <Input 
                    placeholder="e.g. kaggle_user"
                    value={kaggleUsername}
                    onChange={(e) => setKaggleUsername(e.target.value)}
                  />
                </div>

                {/* GeeksforGeeks */}
                <div className="p-4 border border-border rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">GeeksforGeeks</h4>
                    {user?.gfgUsername && (
                      <span className="text-xs bg-accent-green/20 text-accent-green py-1 px-3 rounded-full font-medium">Connected</span>
                    )}
                  </div>
                  <Input 
                    placeholder="e.g. gfg_user"
                    value={gfgUsername}
                    onChange={(e) => setGfgUsername(e.target.value)}
                  />
                </div>
              </CardContent>
              <CardFooter className="border-t border-border pt-6">
                <Button 
                  onClick={handleConnectPlatforms}
                  disabled={connectPlatformsMutation.isPending}
                >
                  {connectPlatformsMutation.isPending ? 'Syncing...' : 'Save & Sync'}
                </Button>
              </CardFooter>
            </Card>
          )}

          {activeTab === 'privacy' && (
            <Card className="animate-slide-up">
              <CardHeader>
                <CardTitle>Privacy & Visibility</CardTitle>
                <CardDescription>Control who can see your aggregated profile.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Public Profile</Label>
                    <p className="text-sm text-muted">Allow anyone to view your DevScore using your unique URL.</p>
                  </div>
                  <button 
                    className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${profile?.isPublic ? 'bg-accent-cyan' : 'bg-muted/30'}`}
                    onClick={() => updateProfileMutation.mutate({ isPublic: !profile?.isPublic })}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${profile?.isPublic ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
