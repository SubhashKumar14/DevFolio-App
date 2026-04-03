import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isAuthHydrated: false,

  setUser: (user) => set({ user }),
  setAuthHydrated: (isAuthHydrated) => set({ isAuthHydrated }),

  setAccessToken: (token) => {
    if (token) {
      set({ accessToken: token, isAuthenticated: true });
    } else {
      set({ accessToken: null, isAuthenticated: false, user: null });
    }
  },

  logout: () => {
    set({ user: null, accessToken: null, isAuthenticated: false, isAuthHydrated: true });
  },
}));