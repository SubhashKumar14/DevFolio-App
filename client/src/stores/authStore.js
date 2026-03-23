import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  accessToken: localStorage.getItem('accessToken') || null,
  isAuthenticated: !!localStorage.getItem('accessToken'),
  
  setUser: (user) => set({ user }),
  
  setAccessToken: (token) => {
    if (token) {
      localStorage.setItem('accessToken', token);
      set({ accessToken: token, isAuthenticated: true });
    } else {
      localStorage.removeItem('accessToken');
      set({ accessToken: null, isAuthenticated: false, user: null });
    }
  },
  
  logout: () => {
    localStorage.removeItem('accessToken');
    set({ user: null, accessToken: null, isAuthenticated: false });
  },
}));