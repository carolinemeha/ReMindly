import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Animated,
  Platform,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/auth.store';

export default function ProfileScreen() {
  const { user, signOut } = useAuthStore();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleSignOut = async () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ? Vous devrez vous reconnecter pour accéder à vos données.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              // La redirection se fait automatiquement via le _layout.tsx
              router.replace('/(auth)/login');
            } catch (error: any) {
              Alert.alert('Erreur', error.message || 'Impossible de se déconnecter');
            }
          },
        },
      ]
    );
  };

  const menuSections = [
    {
      title: 'Compte',
      items: [
        {
          icon: 'person-outline',
          label: 'Mon profil',
          description: 'Gérer vos informations personnelles',
          onPress: () => router.push('/profile/edit'),
          color: '#007AFF',
        },
        {
          icon: 'settings-outline',
          label: 'Paramètres',
          description: 'Préférences et configuration',
          onPress: () => router.push('/settings'),
          color: '#8e8e93',
        },
      ],
    },
    {
      title: 'Fonctionnalités',
      items: [
        {
          icon: 'people-outline',
          label: 'Groupes',
          description: 'Gérer vos groupes d\'événements',
          onPress: () => router.push('/groups'),
          color: '#34C759',
        },
        {
          icon: 'search-outline',
          label: 'Recherche',
          description: 'Rechercher dans vos événements',
          onPress: () => router.push('/search'),
          color: '#FF9500',
        },
        {
          icon: 'stats-chart-outline',
          label: 'Statistiques',
          description: 'Voir vos statistiques',
          onPress: () => router.push('/stats'),
          color: '#AF52DE',
        },
      ],
    },
    {
      title: 'Premium',
      items: [
        {
          icon: 'star',
          label: 'Passer à Premium',
          description: 'Débloquer toutes les fonctionnalités',
          onPress: () => router.push('/premium'),
          color: '#FFD700',
          premium: true,
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          icon: 'help-circle-outline',
          label: 'Aide & Support',
          description: 'FAQ et assistance',
          onPress: () => router.push('/help'),
          color: '#5AC8FA',
        },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.avatarContainer}>
              {user?.avatar_url ? (
                <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={32} color="#007AFF" />
                </View>
              )}
              <TouchableOpacity
                style={styles.editAvatarButton}
                onPress={() => router.push('/profile/edit')}
                activeOpacity={0.7}
              >
                <Ionicons name="camera" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.name}>{user?.email?.split('@')[0] || 'Utilisateur'}</Text>
            <Text style={styles.email}>{user?.email || ''}</Text>
          </View>

          {/* Menu Sections */}
          {menuSections.map((section, sectionIndex) => (
            <View key={sectionIndex} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.sectionContent}>
                {section.items.map((item, itemIndex) => (
                  <TouchableOpacity
                    key={itemIndex}
                    style={[
                      styles.menuItem,
                      itemIndex === section.items.length - 1 && styles.lastItem,
                      item.premium && styles.menuItemPremium,
                    ]}
                    onPress={item.onPress}
                    activeOpacity={0.6}
                  >
                    <View style={styles.menuItemLeft}>
                      <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                        <Ionicons name={item.icon as any} size={22} color={item.color} />
                      </View>
                      <View style={styles.menuItemContent}>
                        <View style={styles.menuItemHeader}>
                          <Text style={styles.menuLabel}>{item.label}</Text>
                          {item.premium && (
                            <View style={styles.premiumBadge}>
                              <Ionicons name="star" size={10} color="#FFD700" />
                            </View>
                          )}
                        </View>
                        <Text style={styles.menuDescription}>{item.description}</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#c7c7cc" />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}

          {/* Sign Out Button */}
          <TouchableOpacity 
            style={styles.signOutButton} 
            onPress={handleSignOut}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
            <Text style={styles.signOutText}>Déconnexion</Text>
          </TouchableOpacity>

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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e7',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E6F4FE',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  name: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  email: {
    fontSize: 15,
    color: '#8e8e93',
    fontWeight: '500',
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
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e5e7',
    minHeight: 64,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  menuItemPremium: {
    backgroundColor: '#FFF9E6',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  premiumBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuDescription: {
    fontSize: 13,
    color: '#8e8e93',
    lineHeight: 18,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    margin: 20,
    marginTop: 32,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FF3B30',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF3B30',
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 24,
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

