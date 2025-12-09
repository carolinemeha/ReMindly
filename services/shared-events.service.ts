// Service pour gérer les événements partagés
import { supabase } from '@/lib/supabase';
import { Event, SharedEvent } from '@/types';

class SharedEventsService {
  // Partager un événement avec un utilisateur
  async shareEventWithUser(eventId: string, userEmail: string, canEdit: boolean = false) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non authentifié');

    // Vérifier que l'événement appartient à l'utilisateur
    const { data: event } = await supabase
      .from('events')
      .select('user_id')
      .eq('id', eventId)
      .single();

    if (!event) throw new Error('Événement non trouvé');
    if (event.user_id !== user.id) {
      throw new Error('Seul le propriétaire peut partager l\'événement');
    }

    // Récupérer l'ID de l'utilisateur par email (via fonction RPC)
    const { data: targetUser, error: userError } = await supabase.rpc(
      'get_users_by_emails',
      { emails: [userEmail] }
    ).catch(() => ({ data: null, error: null }));

    if (userError || !targetUser || targetUser.length === 0) {
      throw new Error('Utilisateur non trouvé');
    }

    const targetUserId = targetUser[0].id;

    // Vérifier si le partage existe déjà
    const { data: existing } = await supabase
      .from('shared_events')
      .select('id')
      .eq('event_id', eventId)
      .eq('shared_with', targetUserId)
      .single();

    if (existing) {
      // Mettre à jour le partage existant
      const { error: updateError } = await supabase
        .from('shared_events')
        .update({ can_edit: canEdit })
        .eq('id', existing.id);

      if (updateError) throw updateError;
      return;
    }

    // Créer le partage
    const { error: shareError } = await supabase
      .from('shared_events')
      .insert({
        event_id: eventId,
        shared_with: targetUserId,
        can_edit: canEdit,
      });

    if (shareError) throw shareError;
  }

  // Récupérer les événements partagés avec l'utilisateur
  async getSharedEvents(): Promise<Event[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non authentifié');

    const { data, error } = await supabase
      .from('shared_events')
      .select(`
        *,
        event:events(
          *,
          category:categories(*),
          reminders:reminders(*)
        )
      `)
      .eq('shared_with', user.id);

    if (error) throw error;
    return (data || []).map((se: any) => se.event).filter(Boolean) as Event[];
  }

  // Récupérer les utilisateurs avec qui un événement est partagé
  async getSharedWith(eventId: string): Promise<SharedEvent[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non authentifié');

    // Vérifier que l'événement appartient à l'utilisateur
    const { data: event } = await supabase
      .from('events')
      .select('user_id')
      .eq('id', eventId)
      .single();

    if (!event || event.user_id !== user.id) {
      throw new Error('Événement non trouvé ou non autorisé');
    }

    const { data, error } = await supabase
      .from('shared_events')
      .select('*')
      .eq('event_id', eventId);

    if (error) throw error;
    return (data || []) as SharedEvent[];
  }

  // Arrêter de partager un événement avec un utilisateur
  async unshareEvent(eventId: string, userId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non authentifié');

    // Vérifier que l'événement appartient à l'utilisateur
    const { data: event } = await supabase
      .from('events')
      .select('user_id')
      .eq('id', eventId)
      .single();

    if (!event || event.user_id !== user.id) {
      throw new Error('Seul le propriétaire peut arrêter de partager');
    }

    const { error } = await supabase
      .from('shared_events')
      .delete()
      .eq('event_id', eventId)
      .eq('shared_with', userId);

    if (error) throw error;
  }
}

export const sharedEventsService = new SharedEventsService();

