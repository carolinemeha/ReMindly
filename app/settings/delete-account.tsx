import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Animated,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/auth.store';
import { authService } from '@/services/auth.service';

export default function DeleteAccountScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { user, signOut } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleDeleteAccount = async () => {
    if (confirmText.toLowerCase() !== 'supprimer') {
      Alert.alert('Erreur', 'Veuillez taper "SUPPRIMER" pour confirmer');
      return;
    }

    Alert.alert(
      'Confirmation finale',
      'Cette action est irréversible. Toutes vos données seront définitivement supprimées. Êtes-vous absolument sûr ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer définitivement',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              // Supprimer le compte via le service auth
              // Note: Une Edge Function devrait être créée pour supprimer toutes les données
              // associées (événements, groupes, fichiers, etc.) avant de supprimer le compte auth
              await authService.deleteAccount();
              
              // Signer l'utilisateur et rediriger
              await signOut();
              
              Alert.alert(
                'Compte supprimé',
                'Votre compte a été supprimé. Toutes vos données seront supprimées dans les 30 prochains jours.',
                [
                  {
                    text: 'OK',
                    onPress: () => router.replace('/(auth)/login'),
                  },
                ]
              );
            } catch (error: any) {
              Alert.alert('Erreur', error.message || 'Impossible de supprimer le compte');
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Supprimer mon compte</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Warning Section */}
          <View style={styles.warningBox}>
            <Ionicons name="warning" size={48} color="#FF3B30" />
            <Text style={styles.warningTitle}>Attention !</Text>
            <Text style={styles.warningText}>
              La suppression de votre compte est une action irréversible. Toutes vos données seront
              définitivement supprimées.
            </Text>
          </View>

          {/* What Will Be Deleted */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Données qui seront supprimées</Text>
            <View style={styles.deletedList}>
              {[
                'Tous vos événements et rappels',
                'Vos catégories personnalisées',
                'Vos groupes et membres',
                'Vos pièces jointes et notes vocales',
                'Vos préférences et paramètres',
                'Votre historique et statistiques',
                'Votre abonnement Premium (si actif)',
              ].map((item, index) => (
                <View key={index} style={styles.deletedItem}>
                  <Ionicons name="close-circle" size={20} color="#FF3B30" />
                  <Text style={styles.deletedText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Alternatives */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Alternatives</Text>
            <View style={styles.alternativesList}>
              <TouchableOpacity
                style={styles.alternativeItem}
                onPress={() => router.push('/settings/export')}
                activeOpacity={0.7}
              >
                <Ionicons name="download-outline" size={24} color="#007AFF" />
                <View style={styles.alternativeContent}>
                  <Text style={styles.alternativeTitle}>Exporter vos données</Text>
                  <Text style={styles.alternativeDescription}>
                    Sauvegardez vos données avant de supprimer votre compte
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirmation */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Confirmation</Text>
            <View style={styles.confirmBox}>
              <Text style={styles.confirmLabel}>
                Pour confirmer, tapez <Text style={styles.confirmBold}>SUPPRIMER</Text> ci-dessous :
              </Text>
              <TextInput
                style={styles.confirmInput}
                value={confirmText}
                onChangeText={setConfirmText}
                placeholder="SUPPRIMER"
                placeholderTextColor="#999"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Delete Button */}
          <TouchableOpacity
            style={[
              styles.deleteButton,
              (confirmText.toLowerCase() !== 'supprimer' || loading) && styles.deleteButtonDisabled,
            ]}
            onPress={handleDeleteAccount}
            disabled={confirmText.toLowerCase() !== 'supprimer' || loading}
            activeOpacity={0.7}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="trash" size={20} color="#fff" />
                <Text style={styles.deleteButtonText}>Supprimer mon compte définitivement</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e7',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  scrollView: {
    flex: 1,
  },
  warningBox: {
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    borderWidth: 2,
    borderColor: '#FF3B30',
  },
  warningTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FF3B30',
    marginTop: 12,
    marginBottom: 8,
  },
  warningText: {
    fontSize: 15,
    color: '#FF3B30',
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  deletedList: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e5e7',
  },
  deletedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  deletedText: {
    flex: 1,
    fontSize: 15,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  alternativesList: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e5e7',
    overflow: 'hidden',
  },
  alternativeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  alternativeContent: {
    flex: 1,
  },
  alternativeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  alternativeDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  confirmBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e5e7',
  },
  confirmLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  confirmBold: {
    fontWeight: '700',
    color: '#FF3B30',
  },
  confirmInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#e5e5e7',
    textTransform: 'uppercase',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF3B30',
    paddingVertical: 16,
    borderRadius: 12,
    margin: 20,
    marginTop: 32,
    gap: 8,
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});

