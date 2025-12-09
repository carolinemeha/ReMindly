// Service pour gérer les événements récurrents
import { supabase } from '@/lib/supabase';
import { Event, RepeatType } from '@/types';
import { addDays, addWeeks, addMonths, addYears, format } from 'date-fns';

class RecurringService {
  // Générer les occurrences futures d'un événement récurrent
  async generateRecurringEvents(
    baseEvent: Event,
    untilDate: Date
  ): Promise<Event[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non authentifié');

    if (baseEvent.repeat_type === 'none') {
      return [];
    }

    const occurrences: Event[] = [];
    let currentDate = new Date(baseEvent.date_time);

    while (currentDate <= untilDate) {
      // Ne pas inclure l'événement original
      if (currentDate.getTime() !== new Date(baseEvent.date_time).getTime()) {
        occurrences.push({
          ...baseEvent,
          id: `${baseEvent.id}-${format(currentDate, 'yyyy-MM-dd-HH-mm')}`,
          date_time: currentDate.toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      // Calculer la prochaine occurrence
      currentDate = this.getNextOccurrence(currentDate, baseEvent.repeat_type);
    }

    return occurrences;
  }

  private getNextOccurrence(date: Date, repeatType: RepeatType): Date {
    switch (repeatType) {
      case 'daily':
        return addDays(date, 1);
      case 'weekly':
        return addWeeks(date, 1);
      case 'monthly':
        return addMonths(date, 1);
      case 'yearly':
        return addYears(date, 1);
      default:
        return date;
    }
  }

  // Créer les occurrences futures dans la base de données
  async createRecurringInstances(
    baseEventId: string,
    untilDate: Date
  ): Promise<void> {
    const baseEvent = await supabase
      .from('events')
      .select('*')
      .eq('id', baseEventId)
      .single();

    if (baseEvent.error) throw baseEvent.error;

    const occurrences = await this.generateRecurringEvents(
      baseEvent.data as Event,
      untilDate
    );

    if (occurrences.length > 0) {
      const eventsToInsert = occurrences.map((event) => ({
        user_id: event.user_id,
        category_id: event.category_id,
        title: event.title,
        description: event.description,
        date_time: event.date_time,
        location: event.location,
        repeat_type: 'none' as RepeatType, // Les instances individuelles ne sont pas récurrentes
        status: 'pending' as const,
        is_public: event.is_public,
      }));

      const { error } = await supabase
        .from('events')
        .insert(eventsToInsert);

      if (error) throw error;
    }
  }

  // Mettre à jour tous les événements récurrents d'une série
  async updateRecurringSeries(
    baseEventId: string,
    updates: Partial<Event>
  ): Promise<void> {
    const baseEvent = await supabase
      .from('events')
      .select('*')
      .eq('id', baseEventId)
      .single();

    if (baseEvent.error) throw baseEvent.error;

    const event = baseEvent.data as Event;

    // Mettre à jour l'événement de base
    const { error: baseError } = await supabase
      .from('events')
      .update(updates)
      .eq('id', baseEventId);

    if (baseError) throw baseError;

    // Si l'événement est récurrent, on peut choisir de mettre à jour toutes les occurrences futures
    // Pour l'instant, on met à jour uniquement l'événement de base
    // Une fonctionnalité avancée pourrait permettre de mettre à jour toute la série
  }
}

export const recurringService = new RecurringService();

