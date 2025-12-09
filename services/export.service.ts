// Service pour exporter les données
import { supabase } from '@/lib/supabase';
import { Event } from '@/types';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

class ExportService {
  // Exporter toutes les données au format JSON
  async exportEventsToJSON(): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non authentifié');

    // Récupérer tous les événements avec relations
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select(`
        *,
        category:categories(*),
        reminders:reminders(*)
      `)
      .eq('user_id', user.id)
      .order('date_time', { ascending: true });

    if (eventsError) throw eventsError;

    // Récupérer les catégories
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id);

    if (categoriesError) throw categoriesError;

    // Récupérer les groupes
    const { data: groups, error: groupsError } = await supabase
      .from('groups')
      .select(`
        *,
        members:group_members(*)
      `)
      .or(`owner_id.eq.${user.id},id.in.(select group_id from group_members where user_id.eq.${user.id})`);

    if (groupsError) throw groupsError;

    // Récupérer les événements partagés
    const { data: sharedEvents, error: sharedError } = await supabase
      .from('shared_events')
      .select('*')
      .eq('shared_with', user.id);

    if (sharedError) throw sharedError;

    const exportData = {
      export_date: new Date().toISOString(),
      user_id: user.id,
      user_email: user.email,
      data: {
        events: events || [],
        categories: categories || [],
        groups: groups || [],
        shared_events: sharedEvents || [],
      },
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const fileUri = `${FileSystem.documentDirectory}remindly_export_${Date.now()}.json`;

    await FileSystem.writeAsStringAsync(fileUri, jsonString);

    return fileUri;
  }

  // Exporter les événements au format CSV
  async exportEventsToCSV(): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non authentifié');

    const { data: events, error } = await supabase
      .from('events')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('user_id', user.id)
      .order('date_time', { ascending: true });

    if (error) throw error;

    // En-têtes CSV
    const headers = ['Titre', 'Description', 'Date', 'Heure', 'Localisation', 'Catégorie', 'Statut', 'Répétition'];
    const rows = (events || []).map((event) => {
      const date = new Date(event.date_time);
      return [
        event.title,
        event.description || '',
        date.toLocaleDateString('fr-FR'),
        date.toLocaleTimeString('fr-FR'),
        event.location || '',
        event.category?.name || '',
        event.status,
        event.repeat_type,
      ].map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const fileUri = `${FileSystem.documentDirectory}remindly_export_${Date.now()}.csv`;

    await FileSystem.writeAsStringAsync(fileUri, csvContent);

    return fileUri;
  }

  // Partager le fichier exporté
  async shareExport(fileUri: string) {
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(fileUri);
    } else {
      throw new Error('Le partage n\'est pas disponible sur cet appareil');
    }
  }
}

export const exportService = new ExportService();

