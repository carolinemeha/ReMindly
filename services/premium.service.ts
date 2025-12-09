import { supabase } from '@/lib/supabase';
import { PremiumSubscription, GeoReminder, SecureFile } from '@/types';

class PremiumService {
  async getSubscription(): Promise<PremiumSubscription | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non authentifié');

    const { data, error } = await supabase
      .from('premium_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
    return data as PremiumSubscription | null;
  }

  async isPremium(): Promise<boolean> {
    const subscription = await this.getSubscription();
    if (!subscription) return false;

    // Vérifier si l'abonnement est toujours valide
    if (subscription.end_at) {
      return new Date(subscription.end_at) > new Date();
    }

    return subscription.is_active;
  }

  async createSubscription(plan: 'monthly' | 'yearly', provider: string, providerSubscriptionId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non authentifié');

    const startAt = new Date();
    const endAt = new Date();
    if (plan === 'monthly') {
      endAt.setMonth(endAt.getMonth() + 1);
    } else {
      endAt.setFullYear(endAt.getFullYear() + 1);
    }

    const { data, error } = await supabase
      .from('premium_subscriptions')
      .insert({
        user_id: user.id,
        plan,
        provider,
        provider_subscription_id: providerSubscriptionId,
        is_active: true,
        start_at: startAt.toISOString(),
        end_at: endAt.toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data as PremiumSubscription;
  }

  async cancelSubscription() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non authentifié');

    const { error } = await supabase
      .from('premium_subscriptions')
      .update({ is_active: false })
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (error) throw error;
  }

  // Geo Reminders
  async createGeoReminder(eventId: string, latitude: number, longitude: number, radiusMeters: number = 100, triggerOn: 'enter' | 'exit' = 'enter') {
    const isPremium = await this.isPremium();
    if (!isPremium) {
      throw new Error('Les rappels géolocalisés sont une fonctionnalité Premium');
    }

    const { data, error } = await supabase
      .from('geo_reminders')
      .insert({
        event_id: eventId,
        latitude,
        longitude,
        radius_meters: radiusMeters,
        trigger_on: triggerOn,
      })
      .select()
      .single();

    if (error) throw error;
    return data as GeoReminder;
  }

  async getGeoReminders(eventId?: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non authentifié');

    // Récupérer d'abord les IDs des événements de l'utilisateur
    const { data: userEvents } = await supabase
      .from('events')
      .select('id')
      .eq('user_id', user.id);

    if (!userEvents || userEvents.length === 0) {
      return [];
    }

    const eventIds = userEvents.map((e) => e.id);

    let query = supabase
      .from('geo_reminders')
      .select('*')
      .in('event_id', eventIds);

    if (eventId) {
      query = query.eq('event_id', eventId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as GeoReminder[];
  }

  async deleteGeoReminder(id: string) {
    const { error } = await supabase
      .from('geo_reminders')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Secure Files
  async uploadSecureFile(fileUri: string, fileName: string, encrypted: boolean = true) {
    const isPremium = await this.isPremium();
    if (!isPremium) {
      throw new Error('Le coffre-fort sécurisé est une fonctionnalité Premium');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non authentifié');

    const fileExt = fileName.split('.').pop();
    const filePath = `${user.id}/secure/${Date.now()}.${fileExt}`;

    // Lire le fichier depuis l'URI
    const response = await fetch(fileUri);
    const blob = await response.blob();

    // Upload vers Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('secure_files')
      .upload(filePath, blob, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Récupérer l'URL (pour les fichiers privés, on utilise getPublicUrl mais avec les politiques RLS)
    const { data: { publicUrl } } = supabase.storage
      .from('secure_files')
      .getPublicUrl(filePath);

    // Créer l'entrée dans la table
    const { data, error: dbError } = await supabase
      .from('secure_files')
      .insert({
        user_id: user.id,
        file_url: publicUrl,
        file_name: fileName,
        encrypted,
      })
      .select()
      .single();

    if (dbError) throw dbError;
    return data as SecureFile;
  }

  async getSecureFiles() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non authentifié');

    const { data, error } = await supabase
      .from('secure_files')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as SecureFile[];
  }

  async deleteSecureFile(id: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non authentifié');

    // Récupérer le fichier pour obtenir l'URL
    const { data: file, error: fetchError } = await supabase
      .from('secure_files')
      .select('file_url')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError) throw fetchError;
    if (!file) throw new Error('Fichier non trouvé');

    // Extraire le chemin du fichier depuis l'URL
    const urlParts = file.file_url.split('/');
    const secureFilesIndex = urlParts.findIndex(part => part === 'secure_files');
    
    if (secureFilesIndex === -1) {
      throw new Error('URL de fichier invalide');
    }

    // Reconstruire le chemin: secure_files/user_id/secure/filename
    const filePath = urlParts.slice(secureFilesIndex).join('/');

    // Supprimer du storage
    const { error: storageError } = await supabase.storage
      .from('secure_files')
      .remove([filePath]);

    if (storageError) {
      console.warn('Erreur lors de la suppression du fichier du storage:', storageError);
    }

    // Supprimer de la base de données
    const { error: deleteError } = await supabase
      .from('secure_files')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) throw deleteError;
  }
}

export const premiumService = new PremiumService();

