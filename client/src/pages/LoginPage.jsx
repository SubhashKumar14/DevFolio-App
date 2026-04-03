import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, Navigate } from 'react-router-dom';
import { Code2, Users, GraduationCap, ArrowLeft, ArrowRight, Shield } from 'lucide-react';
import { loginSchema } from '@/lib/schemas';
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
    description: 'Track your coding journey across core platforms, build your portfolio, and showcase your DevScore.',
    icon: Code2,
    color: '#06b6d4',
    bgColor: 'bg-accent-cyan/10',
    borderColor: 'border-accent-cyan',
    textColor: 'text-accent-cyan',
    features: ['Platform Tracking', 'DevScore Analytics', 'Portfolio Builder', 'Archetype Selection'],
  },
  {
    id: 'recruiter',
    title: 'Recruiter',
    description: 'Search and evaluate developer profiles by DevScore, archetype, and skills. Find the perfect candidate.',
    icon: Users,
    color: '#8b5cf6',
    bgColor: 'bg-accent-purple/10',
    borderColor: 'border-accent-purple',
    textColor: 'text-accent-purple',
    features: ['Developer Search', 'DevScore Filtering', 'Archetype Explorer', 'Profile Export'],
  },
  {
    id: 'mentor',
    title: 'Mentor',
    description: 'Guide developers, monitor their growth across platforms, and help them level up their skills.',
    icon: GraduationCap,
    color: '#22c55e',
    bgColor: 'bg-accent-green/10',
    borderColor: 'border-accent-green',
    textColor: 'text-accent-green',
    features: ['Mentee Tracking', 'Growth Analytics', 'Goal Setting', 'Progress Reports'],
  },
];

export default function LoginPage() {
  const [step, setStep] = useState('role'); // 'role' | 'login'
  const [selectedRole, setSelectedRole] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const { login, isLoggingIn } = useAuth();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isAuthHydrated = useAuthStore((state) => state.isAuthHydrated);
  const user = useAuthStore((state) => state.user);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' }
  });

  const onSubmit = async (data) => {
    setErrorMsg('');
    try {
      await login(data);
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials.');
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
              Welcome to <span className="text-gradient">DevFolio</span>
            </h1>
            <p className="text-muted text-lg">Choose how you'd like to use the platform</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {roles.map((role) => {
              const Icon = role.icon;
              const isSelected = selectedRole === role.id;
              return (
                <div
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  className={`role-card role-${role.id} ${isSelected ? 'selected' : ''}`}
                >
                  {/* Selection indicator */}
                  {isSelected && (
                    <div className="absolute top-4 right-4">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: role.color }}>
                        <Shield className="w-3.5 h-3.5 text-white" />
                      </div>
                    </div>
                  )}

                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 ${role.bgColor}`}>
                    <Icon className="w-8 h-8" style={{ color: role.color }} />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-foreground-bright">{role.title}</h3>
                  <p className="text-sm text-muted leading-relaxed mb-5">{role.description}</p>
                  
                  {/* Features */}
                  <div className="space-y-2">
                    {role.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-2 text-xs text-muted">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: role.color }} />
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={() => selectedRole && setStep('login')}
              disabled={!selectedRole}
              className="h-14 px-10 text-lg font-semibold rounded-full shadow-lg shadow-accent-cyan/25"
            >
              Continue as {selectedRoleInfo?.title || '...'}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>

          <p className="text-center text-sm text-muted">
            Don't have an account?{' '}
            <Link to="/register" className="text-accent-cyan hover:underline font-medium">
              Register here
            </Link>
          </p>
        </div>
      ) : (
        /* ─── Step 2: Login Form ─────────────── */
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
              Welcome back, <span style={{ color: selectedRoleInfo?.color }}>{selectedRoleInfo?.title}</span>
            </CardTitle>
            <CardDescription>
              Enter your credentials to access your {selectedRoleInfo?.title?.toLowerCase()} dashboard
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
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  {...register('email')}
                  disabled={isLoggingIn}
                  autoComplete="email"
                />
                {errors.email && <p className="text-xs text-accent-red">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  {...register('password')}
                  disabled={isLoggingIn}
                  autoComplete="current-password"
                />
                {errors.password && <p className="text-xs text-accent-red">{errors.password.message}</p>}
              </div>
              <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={isLoggingIn} style={{ backgroundColor: selectedRoleInfo?.color }}>
                {isLoggingIn ? 'Signing in...' : `Sign in as ${selectedRoleInfo?.title}`}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-border pt-6">
            <p className="text-sm text-muted">
              Don't have an account?{' '}
              <Link to="/register" className="hover:underline font-medium" style={{ color: selectedRoleInfo?.color }}>
                Register here
              </Link>
            </p>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
