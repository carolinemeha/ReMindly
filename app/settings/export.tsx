import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Animated,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { exportService } from '@/services/export.service';
import * as Sharing from 'expo-sharing';

export default function ExportDataScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleExport = async (format: 'json' | 'csv') => {
    setLoading(format);
    try {
      let fileUri: string;
      if (format === 'json') {
        fileUri = await exportService.exportEventsToJSON();
      } else {
        fileUri = await exportService.exportEventsToCSV();
      }

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: format === 'json' ? 'application/json' : 'text/csv',
          dialogTitle: `Exporter vos données en ${format.toUpperCase()}`,
        });
        Alert.alert('Succès', 'Vos données ont été exportées avec succès');
      } else {
        Alert.alert('Succès', `Fichier exporté: ${fileUri}`);
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible d\'exporter les données');
    } finally {
      setLoading(null);
    }
  };

  const exportOptions = [
    {
      icon: 'document-text-outline',
      label: 'Format JSON',
      description: 'Export complet avec toutes les données (événements, rappels, catégories)',
      format: 'json' as const,
      color: '#007AFF',
    },
    {
      icon: 'grid-outline',
      label: 'Format CSV',
      description: 'Export simplifié compatible avec Excel et Google Sheets',
      format: 'csv' as const,
      color: '#34C759',
    },
  ];

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
          <Text style={styles.headerTitle}>Exporter mes données</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Info Section */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={24} color="#007AFF" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Export de vos données</Text>
              <Text style={styles.infoText}>
                Vous pouvez exporter toutes vos données à tout moment. Les fichiers exportés
                contiennent vos événements, rappels, catégories et autres informations associées à
                votre compte.
              </Text>
            </View>
          </View>

          {/* Export Options */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Format d'export</Text>
            <View style={styles.optionsContainer}>
              {exportOptions.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.exportOption}
                  onPress={() => handleExport(option.format)}
                  disabled={loading !== null}
                  activeOpacity={0.7}
                >
                  <View style={[styles.exportIcon, { backgroundColor: option.color + '20' }]}>
                    <Ionicons name={option.icon as any} size={32} color={option.color} />
                  </View>
                  <View style={styles.exportContent}>
                    <Text style={styles.exportLabel}>{option.label}</Text>
                    <Text style={styles.exportDescription}>{option.description}</Text>
                  </View>
                  {loading === option.format ? (
                    <ActivityIndicator size="small" color={option.color} />
                  ) : (
                    <Ionicons name="download-outline" size={24} color={option.color} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* What's Included */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Données incluses</Text>
            <View style={styles.includedList}>
              {[
                'Événements et leurs détails',
                'Rappels associés',
                'Catégories personnalisées',
                'Groupes et membres',
                'Événements partagés',
                'Statistiques et préférences',
              ].map((item, index) => (
                <View key={index} style={styles.includedItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#34C759" />
                  <Text style={styles.includedText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Warning */}
          <View style={styles.warningBox}>
            <Ionicons name="warning-outline" size={24} color="#FF9500" />
            <View style={styles.warningContent}>
              <Text style={styles.warningTitle}>Important</Text>
              <Text style={styles.warningText}>
                Les fichiers exportés contiennent vos données personnelles. Assurez-vous de les
                stocker en sécurité et de ne pas les partager avec des personnes non autorisées.
              </Text>
            </View>
          </View>
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
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E6F4FE',
    borderRadius: 16,
    padding: 20,
    margin: 20,
    gap: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#007AFF',
    lineHeight: 20,
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
  optionsContainer: {
    gap: 12,
  },
  exportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e5e7',
    gap: 16,
  },
  exportIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exportContent: {
    flex: 1,
  },
  exportLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  exportDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  includedList: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e5e7',
  },
  includedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  includedText: {
    flex: 1,
    fontSize: 15,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF3E0',
    borderRadius: 16,
    padding: 20,
    margin: 20,
    marginBottom: 40,
    gap: 16,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF9500',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#FF9500',
    lineHeight: 20,
  },
});

