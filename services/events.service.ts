import { supabase } from '@/lib/supabase';
import { Event, CreateEventInput, Reminder, Category } from '@/types';
import { format } from 'date-fns';

class EventsService {
  async getEvents(filters?: {
    startDate?: Date;
    endDate?: Date;
    categoryId?: string;
    status?: string;
  }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non authentifié');

    let query = supabase
      .from('events')
      .select(`
        *,
        category:categories(*),
        reminders:reminders(*)
      `)
      .eq('user_id', user.id)
      .order('date_time', { ascending: true });

    if (filters?.startDate) {
      query = query.gte('date_time', filters.startDate.toISOString());
    }
    if (filters?.endDate) {
      query = query.lte('date_time', filters.endDate.toISOString());
    }
    if (filters?.categoryId) {
      query = query.eq('category_id', filters.categoryId);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as Event[];
  }

  async getEventById(id: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non authentifié');

    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        category:categories(*),
        reminders:reminders(*),
        attachments:attachments(*),
        voice_notes:voice_notes(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Événement non trouvé');
    
    // Vérifier que l'utilisateur a accès à cet événement
    if (data.user_id !== user.id) {
      // Vérifier si l'événement est partagé avec l'utilisateur
      const { data: shared } = await supabase
        .from('shared_events')
        .select('id')
        .eq('event_id', id)
        .eq('shared_with', user.id)
        .single();
      
      if (!shared) {
        throw new Error('Accès non autorisé à cet événement');
      }
    }

    return data as Event;
  }

  async createEvent(input: CreateEventInput) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non authentifié');

    // Créer l'événement
    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert({
        user_id: user.id,
        title: input.title,
        description: input.description,
        category_id: input.category_id,
        date_time: input.date_time.toISOString(),
        location: input.location,
        repeat_type: input.repeat_type,
        status: 'pending',
      })
      .select()
      .single();

    if (eventError) throw eventError;

    // Créer les rappels
    if (input.reminders && input.reminders.length > 0) {
      const reminders = input.reminders.map((remindBefore) => {
        const scheduledAt = this.calculateScheduledAt(input.date_time, remindBefore);
        return {
          event_id: event.id,
          remind_before: remindBefore,
          scheduled_at: scheduledAt.toISOString(),
          status: 'pending' as const,
        };
      });

      const { error: remindersError } = await supabase
        .from('reminders')
        .insert(reminders);

      if (remindersError) throw remindersError;
    }

    // Récupérer l'événement complet avec les relations
    const { data: completeEvent, error: fetchError } = await supabase
      .from('events')
      .select(`
        *,
        category:categories(*),
        reminders:reminders(*)
      `)
      .eq('id', event.id)
      .single();

    if (fetchError) throw fetchError;
    return completeEvent as Event;

    // Upload des pièces jointes si présentes
    // Note: Les pièces jointes doivent être uploadées séparément via attachmentsService
    // car elles nécessitent des permissions et des URIs de fichiers React Native

    return event as Event;
  }

  async updateEvent(id: string, updates: Partial<CreateEventInput>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non authentifié');

    const updateData: any = {};

    if (updates.title) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.category_id !== undefined) updateData.category_id = updates.category_id;
    if (updates.date_time) updateData.date_time = updates.date_time.toISOString();
    if (updates.location !== undefined) updateData.location = updates.location;
    if (updates.repeat_type) updateData.repeat_type = updates.repeat_type;

    const { data, error } = await supabase
      .from('events')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select(`
        *,
        category:categories(*),
        reminders:reminders(*)
      `)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Événement non trouvé ou non autorisé');
    return data as Event;
  }

  async deleteEvent(id: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non authentifié');

    // Vérifier que l'événement appartient à l'utilisateur
    const { data: event } = await supabase
      .from('events')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!event) throw new Error('Événement non trouvé');
    if (event.user_id !== user.id) {
      throw new Error('Non autorisé à supprimer cet événement');
    }

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
  }

  async markEventAsDone(id: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non authentifié');

    const { data, error } = await supabase
      .from('events')
      .update({ status: 'done' })
      .eq('id', id)
      .eq('user_id', user.id)
      .select(`
        *,
        category:categories(*),
        reminders:reminders(*)
      `)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Événement non trouvé ou non autorisé');
    return data as Event;
  }

  async createReminder(eventId: string, remindBefore: string) {
    const event = await this.getEventById(eventId);
    if (!event) throw new Error('Événement non trouvé');

    const scheduledAt = this.calculateScheduledAt(
      new Date(event.date_time),
      remindBefore
    );

    const { data, error } = await supabase
      .from('reminders')
      .insert({
        event_id: eventId,
        remind_before: remindBefore,
        scheduled_at: scheduledAt.toISOString(),
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;
    return data as Reminder;
  }

  async deleteReminder(id: string) {
    const { error } = await supabase
      .from('reminders')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  private calculateScheduledAt(eventDate: Date, remindBefore: string): Date {
    const eventTime = new Date(eventDate);
    const interval = this.parseInterval(remindBefore);
    
    return new Date(eventTime.getTime() - interval);
  }

  private parseInterval(interval: string): number {
    // Parse "5 minutes", "1 hour", "1 day", etc.
    const parts = interval.split(' ');
    const value = parseInt(parts[0]);
    const unit = parts[1].toLowerCase();

    const multipliers: Record<string, number> = {
      minute: 60 * 1000,
      minutes: 60 * 1000,
      hour: 60 * 60 * 1000,
      hours: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      days: 24 * 60 * 60 * 1000,
    };

    return value * (multipliers[unit] || 0);
  }


  async getCategories() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non authentifié');

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .order('name');

    if (error) throw error;
    return data as Category[];
  }

  async createCategory(name: string, icon?: string, color?: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non authentifié');

    const { data, error } = await supabase
      .from('categories')
      .insert({
        user_id: user.id,
        name,
        icon,
        color,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Category;
  }
}

export const eventsService = new EventsService();

