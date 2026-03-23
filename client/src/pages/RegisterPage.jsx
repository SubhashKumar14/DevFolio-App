import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, Navigate } from 'react-router-dom';
import { Code2 } from 'lucide-react';
import { registerSchema } from '@/lib/schemas';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useState } from 'react';

export default function RegisterPage() {
  const [errorMsg, setErrorMsg] = useState('');
  const { register: registerAction, isRegistering } = useAuth();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', displayName: '' }
  });

  const onSubmit = async (data) => {
    setErrorMsg('');
    try {
      await registerAction(data);
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed. Please try again.');
    }
  };

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
      <Card className="w-full max-w-md animate-fade-in shadow-xl">
        <CardHeader className="space-y-1 items-center pb-8">
          <div className="bg-accent-purple/10 p-3 rounded-full mb-4">
            <Code2 className="h-8 w-8 text-accent-purple" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Create an account</CardTitle>
          <CardDescription>
            Join DevFolio to track and showcase your developer journey
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
                placeholder="Minimum 8 characters"
                {...register('password')}
                disabled={isRegistering}
                autoComplete="new-password"
              />
              {errors.password && <p className="text-xs text-accent-red">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isRegistering}>
              {isRegistering ? 'Creating account...' : 'Create account'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t border-border pt-6">
          <p className="text-sm text-muted">
            Already have an account?{' '}
            <Link to="/login" className="text-accent-cyan hover:underline font-medium">
              Log in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
