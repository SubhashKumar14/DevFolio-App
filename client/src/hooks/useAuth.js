import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/authService';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { getDefaultRouteForRole } from '@/lib/roleRoutes';

export function useAuth() {
  const { setAccessToken, setUser, logout: clearStore, isAuthenticated, user: storeUser } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: ({ email, password }) => authService.login(email, password),
    onSuccess: (data) => {
      setAccessToken(data.accessToken);
      setUser(data.user);
      queryClient.setQueryData(['user', 'me'], data.user);
      navigate(getDefaultRouteForRole(data.user?.role));
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data) => authService.register(data),
    onSuccess: (data) => {
      setAccessToken(data.accessToken);
      setUser(data.user);
      queryClient.setQueryData(['user', 'me'], data.user);
      if (data.user?.role === 'developer') {
        navigate('/onboarding');
      } else {
        navigate(getDefaultRouteForRole(data.user?.role));
      }
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => authService.logout(),
    onSettled: () => {
      clearStore();
      queryClient.clear();
      navigate('/login');
    },
  });

  // Auto-fetch user on mount if authenticated
  const { data: currentUser, isLoading } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: async () => {
      const data = await authService.getMe();
      setUser(data);
      return data;
    },
    enabled: isAuthenticated && !storeUser,
    retry: false,
    staleTime: 5 * 60 * 1000,
    initialData: storeUser || undefined,
  });

  return {
    user: currentUser,
    isLoading,
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    register: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    logout: logoutMutation.mutateAsync,
  };
}