import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  full_name: string;
  mobile: string;
  email?: string;
  flat_number?: string;
  building_name?: string;
  role: 'CUSTOMER' | 'ADMIN' | 'EMPLOYEE';
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) => set({ user, token, isAuthenticated: true }),
      setUser: (user) => set((state) => ({ 
        user: { ...state.user, ...user } 
      })),
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        localStorage.removeItem('auth-storage'); // Clean up
      },
    }),
    {
      name: 'auth-storage', // Key in localStorage
    }
  )
);