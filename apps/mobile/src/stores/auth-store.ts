import { create } from 'zustand';
import type { Profile } from '@glint/types';

interface AuthState {
  profile: Profile | null;
  setProfile: (profile: Profile | null) => void;
  updateCredits: (credits: number) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  profile: null,

  setProfile: (profile) => set({ profile }),

  updateCredits: (credits) =>
    set((state) => ({
      profile: state.profile ? { ...state.profile, credits } : null,
    })),
}));
