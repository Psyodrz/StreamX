import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { StreamXAPI } from '@streamx/shared';

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loginState: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      loginState: (user: User, token: string) => {
        StreamXAPI.setAuthToken(token);
        set({ user, token, isAuthenticated: true });
      },

      logout: () => {
        StreamXAPI.setAuthToken(null);
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: 'streamx-auth',
      onRehydrateStorage: () => (state) => {
        // Re-inject token to Axios client on reload
        if (state?.token) {
          StreamXAPI.setAuthToken(state.token);
        }
      },
    }
  )
);
