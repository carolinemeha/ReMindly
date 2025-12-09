// Service pour gérer les notes vocales
import { supabase } from '@/lib/supabase';
import * as FileSystem from 'expo-file-system';
import { VoiceNote } from '@/types';
import { Audio } from 'expo-av';

class VoiceNotesService {
  async recordVoiceNote(eventId: string): Promise<VoiceNote> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non authentifié');

    try {
      // Demander les permissions
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Créer un enregistreur audio
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      // Note: L'utilisateur doit arrêter l'enregistrement manuellement
      // Cette fonction retourne l'objet recording, pas la note vocale finale
      // Vous devrez appeler stopRecordingAndSave pour sauvegarder
      
      return recording as any; // Type temporaire
    } catch (error) {
      throw new Error('Erreur lors de l\'enregistrement: ' + (error as Error).message);
    }
  }

  async stopRecordingAndSave(
    recording: Audio.Recording,
    eventId: string
  ): Promise<VoiceNote> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non authentifié');

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      if (!uri) {
        throw new Error('Aucun fichier audio enregistré');
      }

      // Lire le fichier
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        throw new Error('Le fichier audio n\'existe pas');
      }

      // Lire le fichier en base64 ou blob
      const fileContent = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convertir en blob
      const byteCharacters = atob(fileContent);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'audio/m4a' });

      // Upload vers Supabase Storage
      const filePath = `${user.id}/${eventId}/voice/${Date.now()}.m4a`;
      const { error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(filePath, blob, {
          contentType: 'audio/m4a',
        });

      if (uploadError) throw uploadError;

      // Récupérer l'URL
      const { data: { publicUrl } } = supabase.storage
        .from('attachments')
        .getPublicUrl(filePath);

      // Obtenir la durée (approximative)
      const status = await recording.getStatusAsync();
      const durationSeconds = status.isLoaded ? Math.floor(status.durationMillis! / 1000) : null;

      // Créer l'entrée dans la table
      const { data, error: dbError } = await supabase
        .from('voice_notes')
        .insert({
          event_id: eventId,
          audio_url: publicUrl,
          duration_seconds: durationSeconds,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Nettoyer le fichier local
      await FileSystem.deleteAsync(uri, { idempotent: true });

      return data as VoiceNote;
    } catch (error) {
      throw new Error('Erreur lors de la sauvegarde: ' + (error as Error).message);
    }
  }

  async getVoiceNotes(eventId: string): Promise<VoiceNote[]> {
    const { data, error } = await supabase
      .from('voice_notes')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as VoiceNote[];
  }

  async deleteVoiceNote(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non authentifié');

    // Récupérer la note vocale
    const { data: voiceNote, error: fetchError } = await supabase
      .from('voice_notes')
      .select('audio_url, event_id')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // Vérifier que l'événement appartient à l'utilisateur
    const { data: event } = await supabase
      .from('events')
      .select('user_id')
      .eq('id', voiceNote.event_id)
      .single();

    if (event?.user_id !== user.id) {
      throw new Error('Non autorisé');
    }

    // Extraire le chemin du fichier depuis l'URL
    const urlParts = voiceNote.audio_url.split('/');
    const attachmentsIndex = urlParts.findIndex(part => part === 'attachments');
    
    if (attachmentsIndex === -1) {
      throw new Error('URL de fichier invalide');
    }

    // Reconstruire le chemin: attachments/user_id/event_id/voice/filename
    const filePath = urlParts.slice(attachmentsIndex).join('/');

    // Supprimer du storage
    const { error: storageError } = await supabase.storage
      .from('attachments')
      .remove([filePath]);

    if (storageError) {
      console.warn('Erreur lors de la suppression du fichier audio du storage:', storageError);
    }

    // Supprimer de la base de données
    const { error: deleteError } = await supabase
      .from('voice_notes')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;
  }

  async playVoiceNote(voiceNote: VoiceNote): Promise<void> {
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: voiceNote.audio_url },
        { shouldPlay: true }
      );
      
      // Le son se jouera automatiquement
      // Vous pouvez retourner l'objet sound pour contrôler la lecture
    } catch (error) {
      throw new Error('Erreur lors de la lecture: ' + (error as Error).message);
    }
  }
}

export const voiceNotesService = new VoiceNotesService();

