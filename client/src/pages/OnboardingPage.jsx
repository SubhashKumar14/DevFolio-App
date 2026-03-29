import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { integrationService } from '@/services/integrationService';
import { statsService } from '@/services/statsService';
import { useAuthStore } from '@/stores/authStore';
import apiClient from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';

// ─── 6 Archetypes ─────────────────────────────────
const ARCHETYPES = [
  { id: 'builder', label: 'Full-Stack Builder', icon: '🔨', desc: 'Builds production apps, contributes to OSS, blogs', color: '#06b6d4', recommended: ['github', 'gitlab', 'stackoverflow', 'devto', 'leetcode'] },
  { id: 'problem_solver', label: 'DSA Specialist', icon: '🧩', desc: 'Master of algorithms and data structures, contests', color: '#8b5cf6', recommended: ['leetcode', 'codeforces', 'codechef', 'atcoder', 'gfg', 'hackerrank'] },
  { id: 'ai_engineer', label: 'AI/ML Engineer', icon: '🤖', desc: 'ML models, datasets, Kaggle competitions', color: '#f59e0b', recommended: ['kaggle', 'huggingface', 'github', 'leetcode', 'stackoverflow'] },
  { id: 'security_expert', label: 'Security Researcher', icon: '🛡️', desc: 'CTF challenges, pen testing, security certs', color: '#ef4444', recommended: ['tryhackme', 'github', 'hackerrank', 'stackoverflow', 'codesignal'] },
  { id: 'open_source', label: 'Open Source Contributor', icon: '🌐', desc: 'Max contributions, community reputation', color: '#22c55e', recommended: ['github', 'gitlab', 'stackoverflow', 'devto', 'leetcode'] },
  { id: 'competitor', label: 'Competitive Programmer', icon: '⚔️', desc: 'Pure contest performance, ratings, speed-coding', color: '#ec4899', recommended: ['codeforces', 'atcoder', 'leetcode', 'codechef', 'hackerearth', 'gfg'] },
];

// ─── All 15 platforms ─────────────────────────────
const ALL_PLATFORMS = [
  { id: 'github', name: 'GitHub', field: 'githubUsername', placeholder: 'e.g. SubhashKumar14', color: '#39d353' },
  { id: 'leetcode', name: 'LeetCode', field: 'leetcodeUsername', placeholder: 'e.g. Subhash_Kumar14', color: '#FFA116' },
  { id: 'codeforces', name: 'Codeforces', field: 'codeforcesUsername', placeholder: 'e.g. tourist', color: '#3B82F6' },
  { id: 'hackerrank', name: 'HackerRank', field: 'hackerrankUsername', placeholder: 'e.g. hr_user', color: '#00C38C' },
  { id: 'codechef', name: 'CodeChef', field: 'codechefUsername', placeholder: 'e.g. chef_user', color: '#B57044' },
  { id: 'kaggle', name: 'Kaggle', field: 'kaggleUsername', placeholder: 'e.g. kaggle_user', color: '#20BEFF' },
  { id: 'gfg', name: 'GeeksforGeeks', field: 'gfgUsername', placeholder: 'e.g. gfg_user', color: '#1FA759' },
  { id: 'atcoder', name: 'AtCoder', field: 'atcoderUsername', placeholder: 'e.g. atcoder_user', color: '#00BFFF' },
  { id: 'stackoverflow', name: 'Stack Overflow', field: 'stackoverflowUserId', placeholder: 'e.g. 1234567', color: '#F48024' },
  { id: 'hackerearth', name: 'HackerEarth', field: 'hackerEarthUsername', placeholder: 'e.g. @username', color: '#444CF7' },
  { id: 'huggingface', name: 'Hugging Face', field: 'huggingfaceUsername', placeholder: 'e.g. hf_user', color: '#FFD533' },
  { id: 'tryhackme', name: 'TryHackMe', field: 'tryhackmeUsername', placeholder: 'e.g. thm_user', color: '#D43232' },
  { id: 'codesignal', name: 'CodeSignal', field: 'codesignalUsername', placeholder: 'e.g. cs_user', color: '#8149F3' },
  { id: 'devto', name: 'Dev.to', field: 'devtoUsername', placeholder: 'e.g. devto_user', color: '#5A67D8' },
  { id: 'gitlab', name: 'GitLab', field: 'gitlabUsername', placeholder: 'e.g. gitlab_user', color: '#FC6D26' },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1); // 1=archetype, 2=platforms, 3=sync, 4=done
  const [selectedArchetype, setSelectedArchetype] = useState(null);
  const [handles, setHandles] = useState(
    Object.fromEntries(ALL_PLATFORMS.map((p) => [p.field, '']))
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();

  const archetypeInfo = ARCHETYPES.find((a) => a.id === selectedArchetype);
  const recommendedIds = archetypeInfo?.recommended || [];

  // Sort platforms: recommended first
  const sortedPlatforms = [...ALL_PLATFORMS].sort((a, b) => {
    const aRec = recommendedIds.includes(a.id) ? 0 : 1;
    const bRec = recommendedIds.includes(b.id) ? 0 : 1;
    return aRec - bRec;
  });

  // Save archetype
  const saveArchetypeMutation = useMutation({
    mutationFn: async (archetype) => {
      const res = await apiClient.put('/user/me', { archetype });
      return res;
    },
    onSuccess: (data) => {
      if (data.success) setUser(data.data);
    },
  });

  // Connect platforms
  const connectMutation = useMutation({
    mutationFn: () => {
      const data = {};
      for (const p of ALL_PLATFORMS) {
        if (handles[p.field]) data[p.field] = handles[p.field];
      }
      return integrationService.connectDsa(data);
    },
    onSuccess: async (response) => {
      const updatedUser = response.data?.data || response.data;
      if (updatedUser?._id) setUser(updatedUser);

      setStep(4);
      setIsSyncing(true);
      try {
        await statsService.syncStats();
        queryClient.invalidateQueries();
      } catch (err) {
        console.error('Auto-sync after onboarding failed:', err);
      }
      setIsSyncing(false);
    },
  });

  const handleNext = () => {
    if (step === 1) {
      if (selectedArchetype) {
        saveArchetypeMutation.mutate(selectedArchetype);
      }
      setStep(2);
    } else if (step === 2) {
      const hasAny = ALL_PLATFORMS.some((p) => handles[p.field]);
      if (hasAny) {
        connectMutation.mutate();
      } else {
        setStep(4);
      }
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
      <Card className="w-full max-w-2xl animate-fade-in shadow-xl">
        <CardHeader className="pb-4">
          <div className="flex gap-2 mb-4">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${step >= s ? 'bg-accent-cyan' : 'bg-muted/20'}`} />
            ))}
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            {step === 1 && '🎯 Choose Your Developer Identity'}
            {step === 2 && '🔗 Connect Your Platforms'}
            {step === 3 && '⚡ Syncing...'}
            {step === 4 && (isSyncing ? '⚡ Syncing Your Data...' : '🚀 All Set!')}
          </CardTitle>
          <CardDescription>
            {step === 1 && 'Your archetype personalizes your DevScore weights and dashboard experience.'}
            {step === 2 && `Enter your usernames. ${recommendedIds.length > 0 ? 'Recommended platforms for your archetype are shown first.' : 'You can add more later in Settings.'}`}
            {step === 4 && (isSyncing ? 'Fetching stats from all connected platforms...' : 'Your profile is ready. Head to your dashboard!')}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Step 1: Archetype Selection */}
          {step === 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-slide-up">
              {ARCHETYPES.map((arch) => {
                const isSelected = selectedArchetype === arch.id;
                return (
                  <button
                    key={arch.id}
                    onClick={() => setSelectedArchetype(arch.id)}
                    className={`relative p-4 rounded-xl border-2 text-left transition-all duration-300 hover:-translate-y-0.5 ${
                      isSelected ? 'shadow-lg' : 'border-border hover:border-opacity-60'
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
                    <p className="text-xs text-muted mt-1 leading-relaxed">{arch.desc}</p>
                  </button>
                );
              })}
            </div>
          )}

          {/* Step 2: Platform Handles */}
          {step === 2 && (
            <div className="space-y-3 animate-slide-up max-h-[50vh] overflow-y-auto pr-1">
              {sortedPlatforms.map((p) => {
                const isRecommended = recommendedIds.includes(p.id);
                return (
                  <div key={p.id} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                      <Label className="text-sm font-medium">{p.name}</Label>
                      {isRecommended && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent-cyan/10 text-accent-cyan flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" /> Recommended
                        </span>
                      )}
                    </div>
                    <Input
                      placeholder={p.placeholder}
                      value={handles[p.field]}
                      onChange={(e) => setHandles((prev) => ({ ...prev, [p.field]: e.target.value }))}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* Step 4: Done */}
          {step === 4 && (
            <div className="flex flex-col items-center py-8 animate-slide-up">
              {isSyncing ? (
                <div className="w-12 h-12 border-4 border-accent-cyan/30 border-t-accent-cyan rounded-full animate-spin" />
              ) : (
                <>
                  <div className="text-5xl mb-4">✅</div>
                  {archetypeInfo && (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card-elevated border border-border">
                      <span className="text-lg">{archetypeInfo.icon}</span>
                      <span className="font-bold text-sm" style={{ color: archetypeInfo.color }}>{archetypeInfo.label}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="border-t border-border pt-6 flex justify-between">
          {step > 1 && step < 4 && (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={connectMutation.isPending || isSyncing || saveArchetypeMutation.isPending}
            className="ml-auto gap-2"
            style={archetypeInfo ? { backgroundColor: archetypeInfo.color } : {}}
          >
            {step === 1 && (selectedArchetype ? `Continue as ${archetypeInfo?.label}` : 'Skip for now')}
            {step === 2 && (connectMutation.isPending ? 'Connecting...' : 'Connect & Sync')}
            {step === 4 && (isSyncing ? 'Syncing...' : 'Go to Dashboard')}
            {step < 4 && <ArrowRight className="w-4 h-4" />}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
