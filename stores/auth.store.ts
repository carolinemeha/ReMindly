import { create } from 'zustand';
import { Session } from '@supabase/supabase-js';
import { authService } from '@/services/auth.service';
import { User } from '@/types';

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: { avatar_url?: string; timezone?: string }) => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  loading: false,
  initialized: false,

  initialize: async () => {
    set({ loading: true });
    try {
      const session = await authService.getSession();
      const user = session?.user ? {
        id: session.user.id,
        email: session.user.email || '',
        avatar_url: session.user.user_metadata?.avatar_url,
        timezone: session.user.user_metadata?.timezone,
        created_at: session.user.created_at,
      } : null;

      set({ session, user, initialized: true });
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de l\'auth:', error);
      set({ initialized: true });
    } finally {
      set({ loading: false });
    }
  },

  signIn: async (email: string, password: string) => {
    set({ loading: true });
    try {
      const { session } = await authService.signIn({ email, password });
      const user = session?.user ? {
        id: session.user.id,
        email: session.user.email || '',
        avatar_url: session.user.user_metadata?.avatar_url,
        timezone: session.user.user_metadata?.timezone,
        created_at: session.user.created_at,
      } : null;

      set({ session, user });
    } catch (error) {
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  signUp: async (email: string, password: string) => {
    set({ loading: true });
    try {
      const { session } = await authService.signUp({ email, password });
      const user = session?.user ? {
        id: session.user.id,
        email: session.user.email || '',
        avatar_url: session.user.user_metadata?.avatar_url,
        timezone: session.user.user_metadata?.timezone,
        created_at: session.user.created_at,
      } : null;

      set({ session, user });
    } catch (error) {
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    set({ loading: true });
    try {
      await authService.signOut();
      set({ session: null, user: null });
    } catch (error) {
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  resetPassword: async (email: string) => {
    set({ loading: true });
    try {
      await authService.resetPassword(email);
    } catch (error) {
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateProfile: async (data: { avatar_url?: string; timezone?: string }) => {
    set({ loading: true });
    try {
      await authService.updateProfile(data);
      const session = await authService.getSession();
      const user = session?.user ? {
        id: session.user.id,
        email: session.user.email || '',
        avatar_url: session.user.user_metadata?.avatar_url || data.avatar_url,
        timezone: session.user.user_metadata?.timezone || data.timezone,
        created_at: session.user.created_at,
      } : null;

      set({ session, user });
    } catch (error) {
      throw error;
    } finally {
      set({ loading: false });
    }
  },
}));

