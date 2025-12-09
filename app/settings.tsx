import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  Animated,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/auth.store';

export default function SettingsScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { user } = useAuthStore();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const settingsSections = [
    {
      title: 'Général',
      items: [
        {
          icon: 'notifications-outline',
          label: 'Notifications',
          onPress: () => router.push('/settings/notifications'),
          showArrow: true,
        },
        {
          icon: 'color-palette-outline',
          label: 'Thème',
          onPress: () => router.push('/settings/themes'),
          showArrow: true,
        },
        {
          icon: 'cloud-offline-outline',
          label: 'Mode hors ligne',
          value: offlineMode,
          onValueChange: setOfflineMode,
          type: 'switch',
        },
      ],
    },
    {
      title: 'Compte',
      items: [
        {
          icon: 'person-outline',
          label: 'Mon profil',
          onPress: () => router.push('/profile/edit'),
          showArrow: true,
        },
        {
          icon: 'lock-closed-outline',
          label: 'Sécurité',
          onPress: () => router.push('/settings/security'),
          showArrow: true,
        },
        {
          icon: 'shield-checkmark-outline',
          label: 'Confidentialité',
          onPress: () => router.push('/settings/privacy'),
          showArrow: true,
        },
      ],
    },
    {
      title: 'Données',
      items: [
        {
          icon: 'download-outline',
          label: 'Exporter mes données',
          onPress: () => router.push('/settings/export'),
          showArrow: true,
        },
        {
          icon: 'trash-outline',
          label: 'Supprimer mon compte',
          onPress: () => router.push('/settings/delete-account'),
          showArrow: true,
          destructive: true,
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          icon: 'help-circle-outline',
          label: 'Aide & Support',
          onPress: () => router.push('/help'),
          showArrow: true,
        },
        {
          icon: 'document-text-outline',
          label: 'Conditions d\'utilisation',
          onPress: () => router.push('/settings/terms'),
          showArrow: true,
        },
        {
          icon: 'shield-outline',
          label: 'Politique de confidentialité',
          onPress: () => router.push('/settings/privacy-policy'),
          showArrow: true,
        },
      ],
    },
    {
      title: 'À propos',
      items: [
        {
          icon: 'information-circle-outline',
          label: 'Version',
          value: '1.0.0',
          showArrow: false,
        },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Header avec gradient */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Paramètres</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>
          
          {/* User Info Card */}
          <View style={styles.userCard}>
            <View style={styles.userInfo}>
              <View style={styles.avatarContainer}>
                {user?.avatar_url ? (
                  <View style={styles.avatarWrapper}>
                    <Ionicons name="person" size={24} color="#007AFF" />
                  </View>
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person" size={24} color="#007AFF" />
                  </View>
                )}
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.userName}>{user?.email?.split('@')[0] || 'Utilisateur'}</Text>
                <Text style={styles.userEmail}>{user?.email || ''}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.editProfileButton}
              onPress={() => router.push('/profile/edit')}
              activeOpacity={0.7}
            >
              <Ionicons name="create-outline" size={18} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {settingsSections.map((section, sectionIndex) => (
            <View key={sectionIndex} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.sectionContent}>
                {section.items.map((item, itemIndex) => (
                  <TouchableOpacity
                    key={itemIndex}
                    style={[
                      styles.settingItem,
                      itemIndex === section.items.length - 1 && styles.lastItem,
                      item.destructive && styles.settingItemDestructive,
                    ]}
                    onPress={item.onPress}
                    disabled={item.type === 'switch'}
                    activeOpacity={0.6}
                  >
                    <View style={styles.settingItemLeft}>
                      <View
                        style={[
                          styles.iconContainer,
                          item.destructive && styles.iconContainerDestructive,
                        ]}
                      >
                        <Ionicons
                          name={item.icon as any}
                          size={20}
                          color={item.destructive ? '#FF3B30' : '#007AFF'}
                        />
                      </View>
                      <View style={styles.labelContainer}>
                        <Text
                          style={[
                            styles.settingLabel,
                            item.destructive && styles.settingLabelDestructive,
                          ]}
                        >
                          {item.label}
                        </Text>
                        {item.description && (
                          <Text style={styles.settingDescription}>{item.description}</Text>
                        )}
                      </View>
                    </View>
                    <View style={styles.settingItemRight}>
                      {item.type === 'switch' ? (
                        <Switch
                          value={item.value}
                          onValueChange={item.onValueChange}
                          trackColor={{ false: '#e5e5e7', true: '#007AFF' }}
                          thumbColor="#fff"
                          ios_backgroundColor="#e5e5e7"
                        />
                      ) : item.value ? (
                        <Text style={styles.settingValue}>{item.value}</Text>
                      ) : null}
                      {item.showArrow && (
                        <Ionicons name="chevron-forward" size={18} color="#c7c7cc" />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
          
          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>ReMindly v1.0.0</Text>
            <Text style={styles.footerSubtext}>© 2024 Tous droits réservés</Text>
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7',
  },
  content: {
    flex: 1,
  },
  header: {
    backgroundColor: '#fff',
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
    borderRadius: 20,
    backgroundColor: '#f5f5f7',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1a1a1a',
    letterSpacing: -0.5,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e5e7',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatarWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E6F4FE',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E6F4FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: '#666',
  },
  editProfileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E6F4FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8e8e93',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginLeft: 4,
  },
  sectionContent: {
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e5e7',
    minHeight: 56,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  settingItemDestructive: {
    borderBottomWidth: 0,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E6F4FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconContainerDestructive: {
    backgroundColor: '#FFEBEE',
  },
  labelContainer: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  settingLabelDestructive: {
    color: '#FF3B30',
  },
  settingDescription: {
    fontSize: 12,
    color: '#8e8e93',
    marginTop: 2,
  },
  settingItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingValue: {
    fontSize: 15,
    color: '#8e8e93',
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8e8e93',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 11,
    color: '#c7c7cc',
  },
});

