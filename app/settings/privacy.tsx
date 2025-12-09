import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Animated,
  Switch,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function PrivacySettingsScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [personalizedAds, setPersonalizedAds] = useState(false);
  const [dataSharing, setDataSharing] = useState(false);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const privacySections = [
    {
      title: 'Données personnelles',
      items: [
        {
          icon: 'analytics-outline',
          label: 'Analyses et statistiques',
          description: 'Aidez-nous à améliorer l\'application en partageant des données anonymes',
          value: analyticsEnabled,
          onValueChange: setAnalyticsEnabled,
          type: 'switch',
        },
        {
          icon: 'megaphone-outline',
          label: 'Publicités personnalisées',
          description: 'Recevoir des publicités adaptées à vos intérêts',
          value: personalizedAds,
          onValueChange: setPersonalizedAds,
          type: 'switch',
        },
        {
          icon: 'people-outline',
          label: 'Partage de données',
          description: 'Autoriser le partage de données avec nos partenaires',
          value: dataSharing,
          onValueChange: setDataSharing,
          type: 'switch',
        },
      ],
    },
    {
      title: 'Confidentialité',
      items: [
        {
          icon: 'lock-closed-outline',
          label: 'Profil privé',
          description: 'Votre profil n\'est visible que par vous',
          value: true,
          type: 'info',
        },
        {
          icon: 'eye-off-outline',
          label: 'Masquer les statistiques',
          description: 'Ne pas afficher vos statistiques publiquement',
          value: false,
          type: 'switch',
        },
      ],
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
          <Text style={styles.headerTitle}>Confidentialité</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {privacySections.map((section, sectionIndex) => (
            <View key={sectionIndex} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.sectionContent}>
                {section.items.map((item, itemIndex) => (
                  <View
                    key={itemIndex}
                    style={[
                      styles.privacyItem,
                      itemIndex === section.items.length - 1 && styles.lastItem,
                    ]}
                  >
                    <View style={styles.privacyItemLeft}>
                      <View style={styles.iconContainer}>
                        <Ionicons name={item.icon as any} size={22} color="#007AFF" />
                      </View>
                      <View style={styles.privacyContent}>
                        <Text style={styles.privacyLabel}>{item.label}</Text>
                        <Text style={styles.privacyDescription}>{item.description}</Text>
                      </View>
                    </View>
                    {item.type === 'switch' ? (
                      <Switch
                        value={item.value}
                        onValueChange={item.onValueChange}
                        trackColor={{ false: '#e5e5e7', true: '#007AFF' }}
                        thumbColor="#fff"
                      />
                    ) : (
                      <Ionicons name="checkmark-circle" size={24} color="#34C759" />
                    )}
                  </View>
                ))}
              </View>
            </View>
          ))}

          <View style={styles.infoBox}>
            <Ionicons name="shield-checkmark" size={24} color="#007AFF" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Vos données sont sécurisées</Text>
              <Text style={styles.infoText}>
                Nous utilisons un chiffrement de bout en bout pour protéger vos données
                personnelles. Vos informations ne sont jamais partagées sans votre consentement
                explicite.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => router.push('/settings/privacy-policy')}
            activeOpacity={0.7}
          >
            <Ionicons name="document-text-outline" size={20} color="#007AFF" />
            <Text style={styles.linkButtonText}>Lire la politique de confidentialité</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
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
    marginBottom: 8,
  },
  sectionContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e5e7',
  },
  privacyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  privacyItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E6F4FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  privacyContent: {
    flex: 1,
  },
  privacyLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  privacyDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
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
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e5e5e7',
    gap: 12,
  },
  linkButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
});

