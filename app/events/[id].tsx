import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEventsStore } from '@/stores/events.store';
import { attachmentsService } from '@/services/attachments.service';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Attachment } from '@/types';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { selectedEvent, fetchEventById, deleteEvent, markEventAsDone, loading } = useEventsStore();
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  useEffect(() => {
    if (id) {
      fetchEventById(id);
      loadAttachments();
    }
  }, [id]);

  const loadAttachments = async () => {
    if (!id) return;
    try {
      const data = await attachmentsService.getAttachments(id);
      setAttachments(data);
    } catch (error) {
      console.error('Erreur lors du chargement des pièces jointes:', error);
    }
  };

  const handleDelete = () => {
    if (!id) return;
    Alert.alert(
      'Supprimer l\'événement',
      'Êtes-vous sûr de vouloir supprimer cet événement ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEvent(id);
              router.back();
            } catch (error: any) {
              Alert.alert('Erreur', error.message);
            }
          },
        },
      ]
    );
  };

  const handleMarkAsDone = async () => {
    if (!id) return;
    try {
      await markEventAsDone(id);
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    }
  };

  const handleAddAttachment = async () => {
    try {
      const result = await attachmentsService.pickMultipleFiles();
      if (result.length > 0 && id) {
        // Uploader les fichiers
        for (const file of result) {
          await attachmentsService.uploadAttachment(
            id,
            file.uri,
            file.name,
            file.mimeType
          );
        }
        loadAttachments();
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    }
  };

  if (!selectedEvent || loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Événement</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text>Chargement...</Text>
        </View>
      </View>
    );
  }

  const eventDate = parseISO(selectedEvent.date_time);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => router.push(`/events/${id}/share` as any)}>
            <Ionicons name="share-outline" size={24} color="#1a1a1a" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push(`/events/${id}/edit` as any)}>
            <Ionicons name="create-outline" size={24} color="#1a1a1a" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>{selectedEvent.title}</Text>
          {selectedEvent.status === 'done' && (
            <View style={styles.statusBadge}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.statusText}>Terminé</Text>
            </View>
          )}
        </View>

        {selectedEvent.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{selectedEvent.description}</Text>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color="#666" />
            <Text style={styles.infoText}>
              {format(eventDate, 'EEEE d MMMM yyyy à HH:mm', { locale: fr })}
            </Text>
          </View>

          {selectedEvent.location && (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={20} color="#666" />
              <Text style={styles.infoText}>{selectedEvent.location}</Text>
            </View>
          )}

          {selectedEvent.category && (
            <View style={styles.infoRow}>
              <Ionicons name="pricetag-outline" size={20} color="#666" />
              <Text style={styles.infoText}>{selectedEvent.category.name}</Text>
            </View>
          )}
        </View>

        {/* Pièces jointes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pièces jointes</Text>
            <TouchableOpacity onPress={handleAddAttachment}>
              <Ionicons name="add-circle-outline" size={24} color="#E6F4FE" />
            </TouchableOpacity>
          </View>
          {attachments.length === 0 ? (
            <Text style={styles.emptyText}>Aucune pièce jointe</Text>
          ) : (
            attachments.map((attachment) => (
              <AttachmentItem key={attachment.id} attachment={attachment} />
            ))
          )}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {selectedEvent.status !== 'done' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.doneButton]}
              onPress={handleMarkAsDone}
            >
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Marquer comme terminé</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Supprimer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

function AttachmentItem({ attachment }: { attachment: Attachment }) {
  const isImage = attachment.file_type?.startsWith('image/');

  return (
    <View style={styles.attachmentItem}>
      {isImage ? (
        <Image source={{ uri: attachment.file_url }} style={styles.attachmentImage} />
      ) : (
        <View style={styles.attachmentIcon}>
          <Ionicons name="document" size={24} color="#666" />
        </View>
      )}
      <View style={styles.attachmentInfo}>
        <Text style={styles.attachmentName} numberOfLines={1}>
          {attachment.metadata?.file_name || 'Fichier'}
        </Text>
        <Text style={styles.attachmentType}>{attachment.file_type}</Text>
      </View>
      <TouchableOpacity>
        <Ionicons name="download-outline" size={20} color="#666" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
  },
  titleSection: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  infoText: {
    fontSize: 16,
    color: '#1a1a1a',
    flex: 1,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  attachmentImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
  },
  attachmentIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  attachmentInfo: {
    flex: 1,
  },
  attachmentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  attachmentType: {
    fontSize: 12,
    color: '#666',
  },
  actions: {
    marginTop: 24,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  doneButton: {
    backgroundColor: '#4CAF50',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

