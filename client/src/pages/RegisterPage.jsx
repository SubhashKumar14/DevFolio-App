import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, Navigate } from 'react-router-dom';
import { Code2, Users, GraduationCap, ArrowLeft, ArrowRight, CheckCircle, Shield } from 'lucide-react';
import { registerSchema } from '@/lib/schemas';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useState } from 'react';
import { getDefaultRouteForRole } from '@/lib/roleRoutes';

const roles = [
  {
    id: 'developer',
    title: 'Developer',
    subtitle: 'Build your coding profile',
    description: 'Track your coding journey across core platforms, get a DevScore, and showcase your portfolio.',
    icon: Code2,
    color: '#06b6d4',
    bgColor: 'bg-accent-cyan/10',
    features: ['Platform Integration', 'DevScore 0-1000', 'Portfolio Builder', 'Activity Heatmap'],
  },
  {
    id: 'recruiter',
    title: 'Recruiter',
    subtitle: 'Find & evaluate talent',
    description: 'Search developers by DevScore, archetype, and skills. Access detailed candidate breakdowns.',
    icon: Users,
    color: '#8b5cf6',
    bgColor: 'bg-accent-purple/10',
    features: ['Advanced Dev Search', 'DevScore Filtering', 'Candidate Export', 'Team Shortlists'],
  },
  {
    id: 'mentor',
    title: 'Mentor',
    subtitle: 'Guide developer growth',
    description: 'Monitor mentees\' progress, set goals, and track improvements across platforms.',
    icon: GraduationCap,
    color: '#22c55e',
    bgColor: 'bg-accent-green/10',
    features: ['Mentee Dashboard', 'Growth Tracking', 'Goal Setting', 'Progress Reports'],
  },
];

export default function RegisterPage() {
  const [step, setStep] = useState('role'); // 'role' | 'form'
  const [selectedRole, setSelectedRole] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const { register: registerAction, isRegistering } = useAuth();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isAuthHydrated = useAuthStore((state) => state.isAuthHydrated);
  const user = useAuthStore((state) => state.user);

  const { register, handleSubmit, formState: { errors }, setValue } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', displayName: '', role: 'developer' }
  });

  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId);
    setValue('role', roleId);
  };

  const onSubmit = async (data) => {
    setErrorMsg('');
    try {
      await registerAction({ ...data, role: selectedRole });
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed. Please try again.');
    }
  };

  if (!isAuthHydrated) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-cyan border-t-transparent" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={getDefaultRouteForRole(user?.role)} replace />;
  }

  const selectedRoleInfo = roles.find(r => r.id === selectedRole);

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
      {step === 'role' ? (
        /* ─── Step 1: Role Selection ─────────── */
        <div className="w-full max-w-4xl animate-fade-in space-y-8">
          <div className="text-center space-y-3">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground-bright">
              Join <span className="text-gradient">DevFolio</span>
            </h1>
            <p className="text-muted text-lg">Choose your role to get started</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {roles.map((role) => {
              const Icon = role.icon;
              const isSelected = selectedRole === role.id;
              return (
                <button
                  key={role.id}
                  type="button"
                  aria-label={`Select ${role.title} role`}
                  aria-pressed={isSelected}
                  onClick={() => handleRoleSelect(role.id)}
                  className={`role-card role-${role.id} w-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-cyan ${isSelected ? 'selected' : ''}`}
                >
                  {isSelected && (
                    <div className="absolute top-4 right-4">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: role.color }}>
                        <CheckCircle className="w-3.5 h-3.5 text-white" />
                      </div>
                    </div>
                  )}

                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 ${role.bgColor}`}>
                    <Icon className="w-8 h-8" style={{ color: role.color }} />
                  </div>
                  <h3 className="text-xl font-bold mb-1 text-foreground-bright">{role.title}</h3>
                  <p className="text-xs font-medium mb-3" style={{ color: role.color }}>{role.subtitle}</p>
                  <p className="text-sm text-muted leading-relaxed mb-5">{role.description}</p>
                  
                  <div className="space-y-2">
                    {role.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-2 text-xs text-muted">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: role.color }} />
                        {feature}
                      </div>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={() => selectedRole && setStep('form')}
              disabled={!selectedRole}
              className="h-14 px-10 text-lg font-semibold rounded-full shadow-lg shadow-accent-cyan/25"
              style={selectedRoleInfo ? { backgroundColor: selectedRoleInfo.color } : {}}
            >
              Continue as {selectedRoleInfo?.title || '...'}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>

          <p className="text-center text-sm text-muted">
            Already have an account?{' '}
            <Link to="/login" className="text-accent-cyan hover:underline font-medium">
              Log in
            </Link>
          </p>
        </div>
      ) : (
        /* ─── Step 2: Registration Form ──────── */
        <Card className="w-full max-w-md animate-fade-in shadow-xl">
          <CardHeader className="space-y-1 items-center pb-8">
            <button
              onClick={() => setStep('role')}
              className="self-start flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Change role
            </button>

            <div className={`p-3 rounded-full mb-4 ${selectedRoleInfo?.bgColor}`}>
              {selectedRoleInfo && <selectedRoleInfo.icon className="h-8 w-8" style={{ color: selectedRoleInfo.color }} />}
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              Create your <span style={{ color: selectedRoleInfo?.color }}>{selectedRoleInfo?.title}</span> account
            </CardTitle>
            <CardDescription>
              {selectedRoleInfo?.subtitle} — get started in seconds
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {errorMsg && (
                <div className="p-3 bg-accent-red/10 border border-accent-red/20 rounded-md text-sm text-accent-red">
                  {errorMsg}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  placeholder="Alex Developer"
                  {...register('displayName')}
                  disabled={isRegistering}
                />
                {errors.displayName && <p className="text-xs text-accent-red">{errors.displayName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  {...register('email')}
                  disabled={isRegistering}
                  autoComplete="email"
                />
                {errors.email && <p className="text-xs text-accent-red">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Min 8 chars, 1 uppercase, 1 number"
                  {...register('password')}
                  disabled={isRegistering}
                  autoComplete="new-password"
                />
                {errors.password && <p className="text-xs text-accent-red">{errors.password.message}</p>}
              </div>

              {/* Hidden role field */}
              <input type="hidden" {...register('role')} value={selectedRole} />

              {/* Role indicator */}
              <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card-elevated/50">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${selectedRoleInfo?.color}20` }}>
                  {selectedRoleInfo && <selectedRoleInfo.icon className="w-4 h-4" style={{ color: selectedRoleInfo.color }} />}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Registering as {selectedRoleInfo?.title}</p>
                  <p className="text-xs text-muted">{selectedRoleInfo?.subtitle}</p>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold"
                disabled={isRegistering}
                style={{ backgroundColor: selectedRoleInfo?.color }}
              >
                {isRegistering ? 'Creating account...' : `Create ${selectedRoleInfo?.title} Account`}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-border pt-6">
            <p className="text-sm text-muted">
              Already have an account?{' '}
              <Link to="/login" className="hover:underline font-medium" style={{ color: selectedRoleInfo?.color }}>
                Log in
              </Link>
            </p>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
