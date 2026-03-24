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

const allPlatforms = [
  { id: 'github', name: 'GitHub', field: 'githubUsername', placeholder: 'e.g. SubhashKumar14', color: 'bg-[#333]/10 text-[#e6edf3] border-[#333]/30' },
  { id: 'leetcode', name: 'LeetCode', field: 'leetcodeUsername', placeholder: 'e.g. Subhash_Kumar14', color: 'bg-[#FFA116]/10 text-[#FFA116] border-[#FFA116]/20' },
  { id: 'codeforces', name: 'Codeforces', field: 'codeforcesUsername', placeholder: 'e.g. tourist', color: 'bg-[#1890FF]/10 text-[#1890FF] border-[#1890FF]/20' },
  { id: 'hackerrank', name: 'HackerRank', field: 'hackerrankUsername', placeholder: 'e.g. hr_user', color: 'bg-[#2EC866]/10 text-[#2EC866] border-[#2EC866]/20' },
  { id: 'codechef', name: 'CodeChef', field: 'codechefUsername', placeholder: 'e.g. chef_user', color: 'bg-[#5B4638]/10 text-[#D4A76A] border-[#5B4638]/20' },
  { id: 'kaggle', name: 'Kaggle', field: 'kaggleUsername', placeholder: 'e.g. kaggle_user', color: 'bg-[#20BEFF]/10 text-[#20BEFF] border-[#20BEFF]/20' },
  { id: 'gfg', name: 'GeeksforGeeks', field: 'gfgUsername', placeholder: 'e.g. gfg_user', color: 'bg-[#2F8D46]/10 text-[#2F8D46] border-[#2F8D46]/20' },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [handles, setHandles] = useState({
    githubUsername: '', leetcodeUsername: '', codeforcesUsername: '',
    hackerrankUsername: '', codechefUsername: '', kaggleUsername: '', gfgUsername: '',
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Save platform handles
  const connectMutation = useMutation({
    mutationFn: () => {
      const data = {};
      for (const p of allPlatforms) {
        if (handles[p.field]) data[p.field] = handles[p.field];
      }
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
        queryClient.invalidateQueries({ queryKey: ['platformStats'] });
        queryClient.invalidateQueries({ queryKey: ['user'] });
      } catch {
        // Sync may fail if platforms are invalid
      }
      setIsSyncing(false);
    },
  });

  const handleNext = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      const hasAny = allPlatforms.some((p) => handles[p.field]);
      if (hasAny) {
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
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
      <Card className="w-full max-w-xl animate-fade-in shadow-xl">
        <CardHeader className="pb-4">
          <div className="flex gap-2 mb-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${step >= s ? 'bg-accent-cyan' : 'bg-muted/20'}`} />
            ))}
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            {step === 1 && 'Welcome to DevFolio 🎉'}
            {step === 2 && 'Connect Platforms'}
            {step === 3 && (isSyncing ? 'Syncing Your Data...' : 'All Set! 🚀')}
          </CardTitle>
          <CardDescription>
            {step === 1 && 'Let\'s set up your developer profile in 30 seconds.'}
            {step === 2 && 'Enter your usernames for the platforms you use. You can add more later.'}
            {step === 3 && (isSyncing ? 'We\'re fetching your stats from all connected platforms.' : 'Your profile is ready. Head to your dashboard!')}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {step === 1 && (
            <div className="space-y-4 animate-slide-up">
              <p className="text-sm text-muted">DevFolio aggregates your coding profiles into a single, shareable developer portfolio. Connect your platforms and we'll compute your DevScore.</p>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {allPlatforms.map((p) => (
                  <div key={p.id} className={`px-3 py-2 rounded-lg border text-xs font-medium ${p.color}`}>{p.name}</div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3 animate-slide-up max-h-[50vh] overflow-y-auto pr-1">
              {allPlatforms.map((p) => (
                <div key={p.id} className="space-y-1">
                  <Label className="text-sm font-medium">{p.name}</Label>
                  <Input
                    placeholder={p.placeholder}
                    value={handles[p.field]}
                    onChange={(e) => setHandles((prev) => ({ ...prev, [p.field]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col items-center py-6 animate-slide-up">
              {isSyncing ? (
                <div className="w-12 h-12 border-4 border-accent-cyan/30 border-t-accent-cyan rounded-full animate-spin" />
              ) : (
                <div className="text-5xl mb-4">✅</div>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="border-t border-border pt-6 flex justify-between">
          {step > 1 && step < 3 && (
            <Button variant="outline" onClick={() => setStep(step - 1)}>Back</Button>
          )}
          <Button
            onClick={handleNext}
            disabled={connectMutation.isPending || isSyncing}
            className="ml-auto"
          >
            {step === 1 && 'Get Started'}
            {step === 2 && (connectMutation.isPending ? 'Connecting...' : 'Connect & Sync')}
            {step === 3 && (isSyncing ? 'Syncing...' : 'Go to Dashboard')}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
