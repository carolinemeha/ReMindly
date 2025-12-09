// Service de recherche avancée
import { supabase } from '@/lib/supabase';
import { Event } from '@/types';

class SearchService {
  async searchEvents(searchTerm: string, filters?: {
    categoryId?: string;
    startDate?: Date;
    endDate?: Date;
    status?: string;
  }): Promise<Event[]> {
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
      .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%`)
      .order('date_time', { ascending: true });

    if (filters?.categoryId) {
      query = query.eq('category_id', filters.categoryId);
    }
    if (filters?.startDate) {
      query = query.gte('date_time', filters.startDate.toISOString());
    }
    if (filters?.endDate) {
      query = query.lte('date_time', filters.endDate.toISOString());
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as Event[];
  }

  async searchByDateRange(startDate: Date, endDate: Date): Promise<Event[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non authentifié');

    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        category:categories(*),
        reminders:reminders(*)
      `)
      .eq('user_id', user.id)
      .gte('date_time', startDate.toISOString())
      .lte('date_time', endDate.toISOString())
      .order('date_time', { ascending: true });

    if (error) throw error;
    return (data || []) as Event[];
  }

  async getUpcomingEvents(limit: number = 10): Promise<Event[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non authentifié');

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        category:categories(*),
        reminders:reminders(*)
      `)
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .gte('date_time', now)
      .order('date_time', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return (data || []) as Event[];
  }

  async getPastEvents(limit: number = 10): Promise<Event[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non authentifié');

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        category:categories(*),
        reminders:reminders(*)
      `)
      .eq('user_id', user.id)
      .lt('date_time', now)
      .order('date_time', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as Event[];
  }
}

export const searchService = new SearchService();

