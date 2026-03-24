import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/authService';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';

export function useAuth() {
  const { setAccessToken, setUser, logout: clearStore, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: ({ email, password }) => authService.login(email, password),
    onSuccess: (data) => {
      setAccessToken(data.accessToken);
      setUser(data.user);
      navigate('/dashboard');
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data) => authService.register(data),
    onSuccess: (data) => {
      setAccessToken(data.accessToken);
      setUser(data.user);
      navigate('/onboarding');
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
    enabled: isAuthenticated,
    retry: false,
    staleTime: 5 * 60 * 1000,
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