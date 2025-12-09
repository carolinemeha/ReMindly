import { supabase } from '@/lib/supabase';
import { UserStats } from '@/types';
import { startOfWeek, endOfWeek, subWeeks, format } from 'date-fns';

class StatsService {
  async getUserStats(): Promise<UserStats> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non authentifié');

    // Récupérer tous les événements
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, status, date_time')
      .eq('user_id', user.id);

    if (eventsError) throw eventsError;

    // Récupérer tous les rappels
    const { data: reminders, error: remindersError } = await supabase
      .from('reminders')
      .select('id, status')
      .in('event_id', events?.map((e) => e.id) || []);

    if (remindersError) throw remindersError;

    // Calculer les statistiques
    const totalEvents = events?.length || 0;
    const completedEvents = events?.filter((e) => e.status === 'done').length || 0;
    const pendingEvents = events?.filter((e) => e.status === 'pending').length || 0;
    const totalReminders = reminders?.length || 0;
    const sentReminders = reminders?.filter((r) => r.status === 'sent').length || 0;
    const missedReminders = reminders?.filter((r) => r.status === 'failed').length || 0;

    // Calculer l'activité hebdomadaire (4 dernières semaines)
    const weeklyActivity = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = startOfWeek(subWeeks(new Date(), i));
      const weekEnd = endOfWeek(subWeeks(new Date(), i));
      
      const weekEvents = events?.filter((e) => {
        const eventDate = new Date(e.date_time);
        return eventDate >= weekStart && eventDate <= weekEnd;
      }).length || 0;

      weeklyActivity.push({
        date: format(weekStart, 'yyyy-MM-dd'),
        count: weekEvents,
      });
    }

    return {
      total_events: totalEvents,
      completed_events: completedEvents,
      pending_events: pendingEvents,
      total_reminders: totalReminders,
      sent_reminders: sentReminders,
      missed_reminders: missedReminders,
      weekly_activity: weeklyActivity,
    };
  }

  async getPaymentStats() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non authentifié');

    // Récupérer les événements de type paiement
    // Note: On doit d'abord trouver la catégorie "Paiement" puis filtrer par category_id
    const { data: paymentCategory } = await supabase
      .from('categories')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', 'Paiement')
      .single();

    if (!paymentCategory) {
      return { total: 0, paid: 0, overdue: 0, upcoming: 0 };
    }

    const { data: paymentEvents, error } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', user.id)
      .eq('category_id', paymentCategory.id);

    if (error) throw error;

    const now = new Date();
    const paid = paymentEvents?.filter((e) => {
      const eventDate = new Date(e.date_time);
      return eventDate < now && e.status === 'done';
    }).length || 0;

    const overdue = paymentEvents?.filter((e) => {
      const eventDate = new Date(e.date_time);
      return eventDate < now && e.status === 'pending';
    }).length || 0;

    const upcoming = paymentEvents?.filter((e) => {
      const eventDate = new Date(e.date_time);
      return eventDate >= now && e.status === 'pending';
    }).length || 0;

    return {
      total: paymentEvents?.length || 0,
      paid,
      overdue,
      upcoming,
    };
  }
}

export const statsService = new StatsService();

