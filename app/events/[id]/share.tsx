import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  FlatList,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { sharedEventsService } from '@/services/shared-events.service';
import { SharedEvent } from '@/types';

export default function ShareEventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [email, setEmail] = useState('');
  const [canEdit, setCanEdit] = useState(false);
  const [sharedWith, setSharedWith] = useState<SharedEvent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadSharedWith();
    }
  }, [id]);

  const loadSharedWith = async () => {
    if (!id) return;
    try {
      const data = await sharedEventsService.getSharedWith(id);
      setSharedWith(data);
    } catch (error: any) {
      console.error('Erreur:', error);
    }
  };

  const handleShare = async () => {
    if (!email.trim() || !id) {
      Alert.alert('Erreur', 'Veuillez entrer un email');
      return;
    }

    setLoading(true);
    try {
      await sharedEventsService.shareEventWithUser(id, email.trim(), canEdit);
      setEmail('');
      setCanEdit(false);
      await loadSharedWith();
      Alert.alert('Succès', 'Événement partagé avec succès');
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUnshare = async (userId: string) => {
    if (!id) return;
    Alert.alert(
      'Arrêter de partager',
      'Êtes-vous sûr de vouloir arrêter de partager cet événement ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          style: 'destructive',
          onPress: async () => {
            try {
              await sharedEventsService.unshareEvent(id, userId);
              await loadSharedWith();
            } catch (error: any) {
              Alert.alert('Erreur', error.message);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Partager l'événement</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.label}>Partager avec</Text>
          <View style={styles.shareInputContainer}>
            <TextInput
              style={styles.shareInput}
              placeholder="email@exemple.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#999"
            />
            <TouchableOpacity
              style={[styles.shareButton, loading && styles.shareButtonDisabled]}
              onPress={handleShare}
              disabled={loading}
            >
              <Ionicons name="send" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setCanEdit(!canEdit)}
          >
            <View style={[styles.checkbox, canEdit && styles.checkboxChecked]}>
              {canEdit && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
            <Text style={styles.checkboxLabel}>
              Permettre la modification
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Partagé avec</Text>
          {sharedWith.length === 0 ? (
            <Text style={styles.emptyText}>Aucun partage</Text>
          ) : (
            <FlatList
              data={sharedWith}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.sharedItem}>
                  <View style={styles.sharedInfo}>
                    <Ionicons name="person" size={20} color="#666" />
                    <Text style={styles.sharedText}>
                      {item.shared_with} {item.can_edit && '(peut modifier)'}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => handleUnshare(item.shared_with)}>
                    <Ionicons name="close-circle" size={24} color="#F44336" />
                  </TouchableOpacity>
                </View>
              )}
              scrollEnabled={false}
            />
          )}
        </View>
      </View>
    </ScrollView>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  shareInputContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  shareInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1a1a1a',
  },
  shareButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E6F4FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButtonDisabled: {
    opacity: 0.5,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#E6F4FE',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#E6F4FE',
    borderColor: '#E6F4FE',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#1a1a1a',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  sharedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  sharedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  sharedText: {
    fontSize: 14,
    color: '#1a1a1a',
  },
});

