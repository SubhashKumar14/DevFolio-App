import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { profileService } from '@/services/profileService';
import { integrationService } from '@/services/integrationService';
import { statsService } from '@/services/statsService';
import apiClient from '@/lib/apiClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle } from 'lucide-react';

// ─── Supported platforms ─────────────────────────
const ALL_PLATFORMS = [
  { id: 'github', field: 'githubUsername', label: 'GitHub', placeholder: 'your_github_username', color: '#39d353' },
  { id: 'leetcode', field: 'leetcodeUsername', label: 'LeetCode', placeholder: 'your_leetcode_username', color: '#FFA116' },
  { id: 'codeforces', field: 'codeforcesUsername', label: 'Codeforces', placeholder: 'your_codeforces_username', color: '#3B82F6' },
  { id: 'hackerrank', field: 'hackerrankUsername', label: 'HackerRank', placeholder: 'your_hackerrank_username', color: '#00C38C' },
  { id: 'codechef', field: 'codechefUsername', label: 'CodeChef', placeholder: 'your_codechef_username', color: '#B57044' },
  { id: 'kaggle', field: 'kaggleUsername', label: 'Kaggle', placeholder: 'your_kaggle_username', color: '#20BEFF' },
  { id: 'huggingface', field: 'huggingfaceUsername', label: 'Hugging Face', placeholder: 'your_huggingface_username', color: '#FFD533' },
];

// ─── 6 Archetypes ─────────────────────────────────
const ARCHETYPES = [
  { id: 'builder', label: 'Full-Stack Builder', icon: '🔨', desc: 'Builds production apps, contributes to OSS', color: '#06b6d4' },
  { id: 'problem_solver', label: 'DSA Specialist', icon: '🧩', desc: 'Algorithms, data structures, contests', color: '#8b5cf6' },
  { id: 'ai_engineer', label: 'AI/ML Engineer', icon: '🤖', desc: 'ML models, datasets, competitions', color: '#f59e0b' },
  { id: 'security_expert', label: 'Security Researcher', icon: '🛡️', desc: 'CTF challenges, pen testing, certs', color: '#ef4444' },
  { id: 'open_source', label: 'Open Source Contributor', icon: '🌐', desc: 'Max contributions, code reviews', color: '#22c55e' },
  { id: 'competitor', label: 'Competitive Programmer', icon: '⚔️', desc: 'Pure contest performance, ratings', color: '#ec4899' },
];

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('profile');

  const { data: profile } = useQuery({
    queryKey: ['profile', user?._id],
    queryFn: () => profileService.getProfile(user?._id),
    enabled: !!user?._id,
  });

  // Profile form state
  const [displayNameDraft, setDisplayNameDraft] = useState(undefined);
  const [bioDraft, setBioDraft] = useState(undefined);
  const [avatarUrlDraft, setAvatarUrlDraft] = useState(undefined);
  const [selectedArchetypeDraft, setSelectedArchetypeDraft] = useState(undefined);
  const [selectedSecondaryArchetypeDraft, setSelectedSecondaryArchetypeDraft] = useState(undefined);

  // Platform form state
  const [platformHandles, setPlatformHandles] = useState({});
  const [disconnectingPlatformId, setDisconnectingPlatformId] = useState(null);

  const displayName = displayNameDraft ?? user?.displayName ?? '';
  const bio = bioDraft ?? profile?.bio ?? '';
  const avatarUrl = avatarUrlDraft ?? profile?.avatarUrl ?? '';
  const selectedArchetype = selectedArchetypeDraft ?? user?.archetype ?? '';
  const selectedSecondaryArchetype = selectedSecondaryArchetypeDraft ?? user?.secondaryArchetype ?? '';

  const updatePlatformHandle = (field, value) => {
    setPlatformHandles((prev) => ({ ...prev, [field]: value }));
  };

  // Mutations
  const updateProfileMutation = useMutation({
    mutationFn: (data) => profileService.updateProfile(data),
    onSuccess: () => {
      setBioDraft(undefined);
      setAvatarUrlDraft(undefined);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (data) => {
      const res = await apiClient.put('/user/me', data);
      return res;
    },
    onSuccess: (data) => {
      if (data.success) {
        setUser(data.data);
        setDisplayNameDraft(undefined);
        setSelectedArchetypeDraft(undefined);
        setSelectedSecondaryArchetypeDraft(undefined);
        queryClient.invalidateQueries({ queryKey: ['user'] });
      }
    },
  });

  const connectPlatformsMutation = useMutation({
    mutationFn: (data) => integrationService.connectDsa(data),
    onSuccess: async (response) => {
      const updatedUser = response?.data?._id
        ? response.data
        : (response?._id ? response : null);
      if (updatedUser?._id) setUser(updatedUser);
      setPlatformHandles({});
      queryClient.invalidateQueries({ queryKey: ['user'] });

      try {
        await statsService.syncStats();
        queryClient.invalidateQueries();
      } catch (err) {
        console.error('Auto-sync after connect failed:', err);
      }
    },
  });

  const disconnectPlatformMutation = useMutation({
    mutationFn: (platformId) => integrationService.disconnectPlatform(platformId),
    onMutate: (platformId) => {
      setDisconnectingPlatformId(platformId);
    },
    onSuccess: (response, platformId) => {
      const updatedUser = response?.data?._id
        ? response.data
        : (response?._id ? response : null);

      if (updatedUser?._id) {
        setUser(updatedUser);
      }

      const disconnectedPlatform = ALL_PLATFORMS.find((platform) => platform.id === platformId);
      if (disconnectedPlatform) {
        setPlatformHandles((prev) => ({
          ...prev,
          [disconnectedPlatform.field]: '',
        }));
      }

      queryClient.invalidateQueries();
    },
    onSettled: () => {
      setDisconnectingPlatformId(null);
    },
  });

  const handleSaveProfile = () => {
    const updates = {};
    if (displayName && displayName !== user?.displayName) updates.displayName = displayName;
    if (selectedArchetype && selectedArchetype !== user?.archetype) updates.archetype = selectedArchetype;
    if (selectedSecondaryArchetype !== (user?.secondaryArchetype ?? '')) {
      updates.secondaryArchetype = selectedSecondaryArchetype || null;
    }
    if (updates.secondaryArchetype && updates.secondaryArchetype === updates.archetype) {
      updates.secondaryArchetype = null;
    }
    if (Object.keys(updates).length > 0) updateUserMutation.mutate(updates);

    const profileUpdates = {};
    if (bio !== (profile?.bio || '')) profileUpdates.bio = bio;
    if (avatarUrl !== (profile?.avatarUrl || '')) profileUpdates.avatarUrl = avatarUrl.trim() || null;
    if (Object.keys(profileUpdates).length > 0) updateProfileMutation.mutate(profileUpdates);
  };

  const handleConnectPlatforms = () => {
    const data = {};
    for (const p of ALL_PLATFORMS) {
      const value = (platformHandles[p.field] ?? user?.[p.field] ?? '').trim();
      if (value) data[p.field] = value;
    }
    if (Object.keys(data).length > 0) connectPlatformsMutation.mutate(data);
  };

  const handleDisconnectPlatform = (platformId) => {
    if (!platformId || disconnectPlatformMutation.isPending) return;
    disconnectPlatformMutation.mutate(platformId);
  };

  const tabs = ['profile', 'platforms', 'archetype', 'privacy'];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in p-2 md:p-0">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted mt-1">Manage your account, platforms, and developer identity.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <aside className="md:w-64 space-y-1 shrink-0">
          {tabs.map(tab => (
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
          {/* ─── Profile Tab ──────────────────── */}
          {activeTab === 'profile' && (
            <Card className="animate-slide-up">
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Update your public profile display name and bio.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input id="displayName" value={displayName} onChange={(e) => setDisplayNameDraft(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <textarea
                    id="bio"
                    className="flex min-h-[100px] w-full rounded-md border border-border bg-card-elevated px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan"
                    placeholder="Briefly describe your developer journey..."
                    value={bio}
                    onChange={(e) => setBioDraft(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="avatarUrl">Avatar URL</Label>
                  <Input
                    id="avatarUrl"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrlDraft(e.target.value)}
                    placeholder="https://..."
                  />
                  <p className="text-xs text-muted">Used in the top navbar avatar and public profile card.</p>
                </div>
              </CardContent>
              <CardFooter className="border-t border-border pt-6">
                <Button onClick={handleSaveProfile} disabled={updateProfileMutation.isPending || updateUserMutation.isPending}>
                  {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* ─── Platforms Tab ─────────────────── */}
          {activeTab === 'platforms' && (
            <Card className="animate-slide-up">
              <CardHeader>
                <CardTitle>Connected Platforms ({ALL_PLATFORMS.filter((p) => user?.[p.field]).length}/{ALL_PLATFORMS.length})</CardTitle>
                <CardDescription>Enter your platform usernames to connect and sync. Use Disconnect for soft-delete (history retained, reconnect anytime).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {ALL_PLATFORMS.map((p) => (
                  <div key={p.field} className="p-4 border border-border rounded-xl space-y-3 hover:border-opacity-60 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                        <h4 className="font-semibold text-sm">{p.label}</h4>
                      </div>
                      {user?.[p.field] && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-accent-green/20 text-accent-green py-1 px-3 rounded-full font-medium flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Connected
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 border-accent-red/40 px-2 text-xs text-accent-red hover:bg-accent-red/10"
                            onClick={() => handleDisconnectPlatform(p.id)}
                            disabled={disconnectPlatformMutation.isPending}
                          >
                            {disconnectingPlatformId === p.id ? 'Disconnecting...' : 'Disconnect'}
                          </Button>
                        </div>
                      )}
                    </div>
                    <Input
                      placeholder={p.placeholder}
                      value={platformHandles[p.field] ?? user?.[p.field] ?? ''}
                      onChange={(e) => updatePlatformHandle(p.field, e.target.value)}
                    />
                  </div>
                ))}
              </CardContent>
              <CardFooter className="border-t border-border pt-6">
                <Button onClick={handleConnectPlatforms} disabled={connectPlatformsMutation.isPending}>
                  {connectPlatformsMutation.isPending ? 'Syncing...' : 'Save & Sync All'}
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* ─── Archetype Tab ────────────────── */}
          {activeTab === 'archetype' && (
            <Card className="animate-slide-up">
              <CardHeader>
                <CardTitle>Developer Identity</CardTitle>
                <CardDescription>Choose your primary archetype and an optional secondary archetype. DevScore v2 blends them 70/30.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ARCHETYPES.map((arch) => {
                    const isSelected = selectedArchetype === arch.id;
                    return (
                      <button
                        key={arch.id}
                        onClick={() => {
                          setSelectedArchetypeDraft(arch.id);
                          if (selectedSecondaryArchetype === arch.id) {
                            setSelectedSecondaryArchetypeDraft('');
                          }
                        }}
                        className={`relative p-4 rounded-xl border-2 text-left transition-all duration-300 hover:-translate-y-0.5 ${
                          isSelected
                            ? 'shadow-lg'
                            : 'border-border hover:border-opacity-60'
                        }`}
                        style={isSelected ? { borderColor: arch.color, boxShadow: `0 0 20px ${arch.color}20` } : {}}
                      >
                        {isSelected && (
                          <div className="absolute top-3 right-3">
                            <CheckCircle className="w-5 h-5" style={{ color: arch.color }} />
                          </div>
                        )}
                        <span className="text-2xl">{arch.icon}</span>
                        <h4 className="font-bold text-sm mt-2" style={isSelected ? { color: arch.color } : {}}>{arch.label}</h4>
                        <p className="text-xs text-muted mt-1">{arch.desc}</p>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-6 space-y-2">
                  <Label htmlFor="secondaryArchetype">Secondary Archetype</Label>
                  <select
                    id="secondaryArchetype"
                    className="h-10 w-full rounded-md border border-border bg-card-elevated px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent-cyan"
                    value={selectedSecondaryArchetype}
                    onChange={(e) => setSelectedSecondaryArchetypeDraft(e.target.value)}
                  >
                    <option value="">None</option>
                    {ARCHETYPES.filter((arch) => arch.id !== selectedArchetype).map((arch) => (
                      <option key={arch.id} value={arch.id}>{arch.label}</option>
                    ))}
                  </select>
                  <p className="text-xs text-muted">Optional. Secondary archetype contributes 30% of the scoring blend.</p>
                </div>
              </CardContent>
              <CardFooter className="border-t border-border pt-6">
                <Button
                  onClick={() => {
                    const updates = {};
                    if (selectedArchetype) updates.archetype = selectedArchetype;
                    updates.secondaryArchetype = selectedSecondaryArchetype || null;
                    if (updates.secondaryArchetype === updates.archetype) updates.secondaryArchetype = null;
                    if (Object.keys(updates).length > 0) updateUserMutation.mutate(updates);
                  }}
                  disabled={updateUserMutation.isPending || (!selectedArchetype && selectedSecondaryArchetype === (user?.secondaryArchetype ?? ''))}
                >
                  {updateUserMutation.isPending ? 'Saving...' : 'Save Identity'}
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* ─── Privacy Tab ──────────────────── */}
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
