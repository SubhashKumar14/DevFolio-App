import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/stores/authStore';

export function AuthBootstrap() {
  const queryClient = useQueryClient();
  const isAuthHydrated = useAuthStore((state) => state.isAuthHydrated);
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const setUser = useAuthStore((state) => state.setUser);
  const setAuthHydrated = useAuthStore((state) => state.setAuthHydrated);

  useEffect(() => {
    if (isAuthHydrated) return;

    let isCancelled = false;

    const bootstrapAuth = async () => {
      try {
        const refreshData = await authService.refreshToken();
        const accessToken = refreshData?.accessToken;

        if (!accessToken) {
          throw new Error('No access token returned during bootstrap');
        }

        if (isCancelled) return;
        setAccessToken(accessToken);

        const user = await authService.getMe();
        if (isCancelled) return;

        setUser(user);
        queryClient.setQueryData(['user', 'me'], user);
      } catch {
        if (isCancelled) return;
        setAccessToken(null);
        setUser(null);
        queryClient.removeQueries({ queryKey: ['user', 'me'] });
      } finally {
        if (!isCancelled) {
          setAuthHydrated(true);
        }
      }
    };

    bootstrapAuth();

    return () => {
      isCancelled = true;
    };
  }, [isAuthHydrated, queryClient, setAccessToken, setAuthHydrated, setUser]);

  return null;
}
