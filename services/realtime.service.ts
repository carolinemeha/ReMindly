// Service pour les mises à jour en temps réel avec Supabase
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Event, Reminder } from '@/types';
import { RealtimeChannel } from '@supabase/supabase-js';

class RealtimeService {
  private channels: Map<string, RealtimeChannel> = new Map();

  // Écouter les changements sur les événements de l'utilisateur
  subscribeToEvents(
    userId: string,
    onInsert: (event: Event) => void,
    onUpdate: (event: Event) => void,
    onDelete: (eventId: string) => void
  ) {
    if (!isSupabaseConfigured) return;
    const channelName = `events:${userId}`;
    
    // Nettoyer le channel existant s'il y en a un
    if (this.channels.has(channelName)) {
      this.unsubscribe(channelName);
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'events',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          onInsert(payload.new as Event);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'events',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          onUpdate(payload.new as Event);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'events',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          onDelete(payload.old.id);
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);
    return channel;
  }

  // Écouter les changements sur les rappels
  subscribeToReminders(
    userId: string,
    onUpdate: (reminder: Reminder) => void
  ) {
    if (!isSupabaseConfigured) return;
    const channelName = `reminders:${userId}`;
    
    if (this.channels.has(channelName)) {
      this.unsubscribe(channelName);
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'reminders',
        },
        async (payload) => {
          // Vérifier que le rappel appartient à un événement de l'utilisateur
          const { data: event } = await supabase
            .from('events')
            .select('user_id')
            .eq('id', payload.new.event_id)
            .single();

          if (event?.user_id === userId) {
            onUpdate(payload.new as Reminder);
          }
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);
    return channel;
  }

  // Se désabonner d'un channel
  unsubscribe(channelName: string) {
    const channel = this.channels.get(channelName);
    if (channel) {
      supabase.removeChannel(channel);
      this.channels.delete(channelName);
    }
  }

  // Se désabonner de tous les channels
  unsubscribeAll() {
    this.channels.forEach((channel, name) => {
      supabase.removeChannel(channel);
    });
    this.channels.clear();
  }
}

export const realtimeService = new RealtimeService();

