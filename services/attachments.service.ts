import { supabase } from '@/lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Attachment } from '@/types';

class AttachmentsService {
  async uploadAttachment(eventId: string, fileUri: string, fileName: string, fileType: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non authentifié');

    const fileExt = fileName.split('.').pop();
    const filePath = `${user.id}/${eventId}/${Date.now()}.${fileExt}`;

    // Lire le fichier depuis l'URI
    const response = await fetch(fileUri);
    const blob = await response.blob();

    // Upload vers Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('attachments')
      .upload(filePath, blob, {
        cacheControl: '3600',
        upsert: false,
        contentType: fileType,
      });

    if (uploadError) throw uploadError;

    // Récupérer l'URL publique
    const { data: { publicUrl } } = supabase.storage
      .from('attachments')
      .getPublicUrl(filePath);

    // Créer l'entrée dans la table attachments
    const { data, error: dbError } = await supabase
      .from('attachments')
      .insert({
        event_id: eventId,
        file_url: publicUrl,
        file_type: fileType,
        metadata: {
          file_name: fileName,
          file_size: blob.size,
          uploaded_at: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (dbError) throw dbError;
    return data as Attachment;
  }

  async pickImage(): Promise<ImagePicker.ImagePickerResult> {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Permission d\'accès à la galerie refusée');
    }

    return await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
  }

  async pickDocument(): Promise<DocumentPicker.DocumentPickerResult> {
    return await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
    });
  }

  async pickMultipleFiles(): Promise<{ type: 'image' | 'document'; uri: string; name: string; mimeType: string }[]> {
    const files: { type: 'image' | 'document'; uri: string; name: string; mimeType: string }[] = [];

    // Permettre de choisir entre image et document
    // Pour simplifier, on utilise le sélecteur de documents qui peut aussi sélectionner des images
    const result = await this.pickDocument();
    
    if (!result.canceled && result.assets) {
      result.assets.forEach((asset) => {
        files.push({
          type: asset.mimeType?.startsWith('image/') ? 'image' : 'document',
          uri: asset.uri,
          name: asset.name || 'file',
          mimeType: asset.mimeType || 'application/octet-stream',
        });
      });
    }

    return files;
  }

  async getAttachments(eventId: string): Promise<Attachment[]> {
    const { data, error } = await supabase
      .from('attachments')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Attachment[];
  }

  async deleteAttachment(id: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non authentifié');

    // Récupérer l'attachement pour obtenir l'URL
    const { data: attachment, error: fetchError } = await supabase
      .from('attachments')
      .select('file_url, event_id')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // Vérifier que l'événement appartient à l'utilisateur
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('user_id')
      .eq('id', attachment.event_id)
      .single();

    if (eventError || event?.user_id !== user.id) {
      throw new Error('Non autorisé');
    }

    // Extraire le chemin du fichier depuis l'URL
    // Format d'URL Supabase: https://project.supabase.co/storage/v1/object/public/attachments/user_id/event_id/filename
    const urlParts = attachment.file_url.split('/');
    const attachmentsIndex = urlParts.findIndex(part => part === 'attachments');
    
    if (attachmentsIndex === -1) {
      throw new Error('URL de fichier invalide');
    }

    // Reconstruire le chemin: attachments/user_id/event_id/filename
    const filePath = urlParts.slice(attachmentsIndex).join('/');

    // Supprimer du storage
    const { error: storageError } = await supabase.storage
      .from('attachments')
      .remove([filePath]);

    if (storageError) {
      console.warn('Erreur lors de la suppression du fichier du storage:', storageError);
      // On continue quand même pour supprimer l'entrée de la base de données
    }

    // Supprimer de la base de données
    const { error: deleteError } = await supabase
      .from('attachments')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;
  }

  async downloadAttachment(attachment: Attachment): Promise<string> {
    // Pour le téléchargement, on peut utiliser l'URL publique
    // ou créer une URL signée pour plus de sécurité
    return attachment.file_url;
  }
}

export const attachmentsService = new AttachmentsService();

