import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';

export interface SignUpData {
  email: string;
  password: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface UpdateProfileData {
  avatar_url?: string;
  timezone?: string;
}

class AuthService {
  async signUp(data: SignUpData) {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });

    if (error) throw error;
    return authData;
  }

  async signIn(data: SignInData) {
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) throw error;
    return authData;
  }

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'remindly://reset-password',
    });
    if (error) throw error;
  }

  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
  }

  async getSession(): Promise<Session | null> {
    if (!isSupabaseConfigured) return null;
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  }

  async getUser(): Promise<SupabaseUser | null> {
    if (!isSupabaseConfigured) return null;
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  }

  async updateProfile(data: UpdateProfileData) {
    const { data: userData, error } = await supabase.auth.updateUser({
      data: data,
    });
    if (error) throw error;
    return userData;
  }

  async deleteAccount() {
    // Note: La suppression de compte nécessite généralement une Edge Function
    // car elle doit supprimer toutes les données associées (événements, groupes, etc.)
    // Pour l'instant, on supprime juste la session et l'utilisateur devra contacter le support
    // pour une suppression complète via Edge Function
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non trouvé');

    // Option 1: Utiliser une Edge Function si disponible
    // const { error } = await supabase.functions.invoke('delete-user-account', {
    //   body: { userId: user.id }
    // });

    // Option 2: Supprimer manuellement les données (nécessite des permissions admin)
    // Pour l'instant, on signe juste l'utilisateur
    // Une Edge Function devrait gérer la suppression complète
    
    // Signer l'utilisateur
    await this.signOut();
    
    // Note: La suppression complète des données doit être gérée par une Edge Function
    // qui supprimera toutes les données associées (événements, groupes, etc.)
    // avant de supprimer le compte auth
  }

  onAuthStateChange(callback: (session: Session | null) => void) {
    return supabase.auth.onAuthStateChange((_event, session) => {
      callback(session);
    });
  }
}

export const authService = new AuthService();

