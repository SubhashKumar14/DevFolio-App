import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { integrationService } from '@/services/integrationService';
import { statsService } from '@/services/statsService';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const popularPlatforms = [
  { id: 'leetcode', name: 'LeetCode', field: 'leetcodeUsername', color: 'bg-[#FFA116]/10 text-[#FFA116] border-[#FFA116]/20' },
  { id: 'codeforces', name: 'Codeforces', field: 'codeforcesUsername', color: 'bg-[#1890FF]/10 text-[#1890FF] border-[#1890FF]/20' },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [handles, setHandles] = useState({ leetcodeUsername: '', codeforcesUsername: '' });
  const [isSyncing, setIsSyncing] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Save platform handles
  const connectMutation = useMutation({
    mutationFn: () => {
      const data = {};
      if (handles.leetcodeUsername) data.leetcodeUsername = handles.leetcodeUsername;
      if (handles.codeforcesUsername) data.codeforcesUsername = handles.codeforcesUsername;
      return integrationService.connectDsa(data);
    },
    onSuccess: async () => {
      setStep(3);
      setIsSyncing(true);
      try {
        await statsService.syncStats();
        queryClient.invalidateQueries({ queryKey: ['githubStats'] });
        queryClient.invalidateQueries({ queryKey: ['dsaStats'] });
        queryClient.invalidateQueries({ queryKey: ['devScore'] });
        queryClient.invalidateQueries({ queryKey: ['user'] });
      } catch {
        // Sync may fail if platforms are invalid, that's okay
      }
      setIsSyncing(false);
    },
  });

  const handleNext = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      // Save handles and move to sync step
      if (handles.leetcodeUsername || handles.codeforcesUsername) {
        connectMutation.mutate();
      } else {
        setStep(3);
        setIsSyncing(false);
      }
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4">
      <div className="w-full max-w-2xl mb-8 flex items-center justify-between">
        {[1, 2, 3].map(s => (
          <div key={s} className="flex flex-col items-center flex-1">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mb-2 transition-colors ${step >= s ? 'bg-accent-cyan text-white shadow-lg shadow-accent-cyan/20' : 'bg-card-elevated text-muted border border-border'}`}>
              {s}
            </div>
            <span className="text-xs font-medium text-muted">
              {s === 1 ? 'Welcome' : s === 2 ? 'Connect' : 'Sync'}
            </span>
          </div>
        ))}
      </div>

      <Card className="w-full max-w-2xl animate-slide-up shadow-xl">
        {step === 1 && (
          <>
            <CardHeader className="text-center pt-10">
              <CardTitle className="text-3xl font-bold">Welcome to DevFolio</CardTitle>
              <CardDescription className="text-lg mt-2">
                Let's set up your developer profile.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4 pb-10">
              <p className="text-muted">
                To generate your DevScore and populate your dashboard, we need to connect at least one of your coding platforms.
              </p>
            </CardContent>
            <CardFooter className="justify-end border-t border-border pt-6">
              <Button onClick={handleNext} size="lg">Let's Go</Button>
            </CardFooter>
          </>
        )}

        {step === 2 && (
          <>
            <CardHeader>
              <CardTitle>Connect Your Platforms</CardTitle>
              <CardDescription>Enter your usernames for the platforms you use.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* GitHub OAuth */}
              <div className="flex items-center gap-4 p-4 rounded-xl border bg-foreground/5 border-foreground/20">
                <div className="flex-1">
                  <Label className="text-base font-semibold">GitHub</Label>
                  <p className="text-xs opacity-80">Connect via OAuth</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.location.href = `${import.meta.env.VITE_API_URL || '/api'}/auth/github`}
                >
                  Connect GitHub
                </Button>
              </div>

              {/* DSA Platforms */}
              {popularPlatforms.map(platform => (
                <div key={platform.id} className={`flex items-center gap-4 p-4 rounded-xl border ${platform.color}`}>
                  <div className="flex-1 space-y-1">
                    <Label htmlFor={platform.id} className="text-base font-semibold">{platform.name}</Label>
                    <p className="text-xs opacity-80">Enter your username</p>
                  </div>
                  <div className="flex-1">
                    <Input
                      id={platform.id}
                      placeholder={`${platform.name} username`}
                      value={handles[platform.field]}
                      onChange={(e) => setHandles({ ...handles, [platform.field]: e.target.value })}
                      className="bg-background/50"
                    />
                  </div>
                </div>
              ))}
            </CardContent>
            <CardFooter className="justify-between border-t border-border pt-6">
              <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={handleNext} disabled={connectMutation.isPending}>
                {connectMutation.isPending ? 'Saving...' : 'Continue'}
              </Button>
            </CardFooter>
          </>
        )}

        {step === 3 && (
          <>
            <CardHeader className="text-center pt-10">
              <CardTitle className="text-2xl">
                {isSyncing ? 'Syncing Your Profile...' : '✅ All Set!'}
              </CardTitle>
              <CardDescription>
                {isSyncing ? "We're fetching your data. This might take a few moments." : 'Your platforms are connected and data is synced.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center pb-10">
              {isSyncing ? (
                <div className="w-16 h-16 border-4 border-accent-cyan/30 border-t-accent-cyan rounded-full animate-spin" />
              ) : (
                <div className="text-6xl">🎉</div>
              )}
            </CardContent>
            <CardFooter className="justify-center border-t border-border pt-6">
              <Button onClick={handleNext} size="lg" className="px-8" disabled={isSyncing}>
                Go to Dashboard
              </Button>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  );
}
