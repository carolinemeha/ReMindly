import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';

type ThemeOption = 'light' | 'dark' | 'system';

export default function ThemesSettingsScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const colorScheme = useColorScheme();
  const [selectedTheme, setSelectedTheme] = useState<ThemeOption>('system');

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const themes: { value: ThemeOption; label: string; icon: string; description: string }[] = [
    {
      value: 'light',
      label: 'Clair',
      icon: 'sunny-outline',
      description: 'Thème clair pour une utilisation en journée',
    },
    {
      value: 'dark',
      label: 'Sombre',
      icon: 'moon-outline',
      description: 'Thème sombre pour une utilisation en soirée',
    },
    {
      value: 'system',
      label: 'Système',
      icon: 'phone-portrait-outline',
      description: 'Suivre les paramètres de votre appareil',
    },
  ];

  const premiumThemes = [
    {
      name: 'Gold',
      icon: 'star',
      color: '#FFD700',
      premium: true,
    },
    {
      name: 'Ocean',
      icon: 'water',
      color: '#007AFF',
      premium: true,
    },
    {
      name: 'Forest',
      icon: 'leaf',
      color: '#34C759',
      premium: true,
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
          <Text style={styles.headerTitle}>Thème</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Theme Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thème de l'application</Text>
            <View style={styles.sectionContent}>
              {themes.map((theme, index) => {
                const isSelected = selectedTheme === theme.value;
                return (
                  <TouchableOpacity
                    key={theme.value}
                    style={[
                      styles.themeOption,
                      index === themes.length - 1 && styles.lastItem,
                      isSelected && styles.themeOptionSelected,
                    ]}
                    onPress={() => setSelectedTheme(theme.value)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.themeOptionLeft}>
                      <View
                        style={[
                          styles.iconContainer,
                          isSelected && styles.iconContainerSelected,
                        ]}
                      >
                        <Ionicons
                          name={theme.icon as any}
                          size={24}
                          color={isSelected ? '#fff' : '#007AFF'}
                        />
                      </View>
                      <View style={styles.themeContent}>
                        <Text style={styles.themeLabel}>{theme.label}</Text>
                        <Text style={styles.themeDescription}>{theme.description}</Text>
                      </View>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Premium Themes */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Thèmes Premium</Text>
              <View style={styles.premiumBadge}>
                <Ionicons name="star" size={12} color="#FFD700" />
                <Text style={styles.premiumText}>Premium</Text>
              </View>
            </View>
            <View style={styles.premiumThemesGrid}>
              {premiumThemes.map((theme, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.premiumThemeCard}
                  activeOpacity={0.7}
                  onPress={() => router.push('/premium')}
                >
                  <View style={[styles.premiumThemeIcon, { backgroundColor: theme.color + '20' }]}>
                    <Ionicons name={theme.icon as any} size={32} color={theme.color} />
                  </View>
                  <Text style={styles.premiumThemeName}>{theme.name}</Text>
                  <View style={styles.premiumLock}>
                    <Ionicons name="lock-closed" size={16} color="#999" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={() => router.push('/premium')}
              activeOpacity={0.7}
            >
              <Ionicons name="star" size={20} color="#FFD700" />
              <Text style={styles.upgradeButtonText}>Passer à Premium</Text>
            </TouchableOpacity>
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
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e5e7',
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  themeOptionSelected: {
    backgroundColor: '#E6F4FE',
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  themeOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E6F4FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconContainerSelected: {
    backgroundColor: '#007AFF',
  },
  themeContent: {
    flex: 1,
  },
  themeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  themeDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  premiumText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FF9500',
  },
  premiumThemesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  premiumThemeCard: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5e5e7',
    position: 'relative',
  },
  premiumThemeIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  premiumThemeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  premiumLock: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFD700',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
});

