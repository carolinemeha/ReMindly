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
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function NotificationsSettingsScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [reminderNotifications, setReminderNotifications] = useState(true);
  const [eventReminders, setEventReminders] = useState(true);
  const [dailyDigest, setDailyDigest] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(false);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const notificationSections = [
    {
      title: 'Types de notifications',
      items: [
        {
          icon: 'phone-portrait-outline',
          label: 'Notifications push',
          description: 'Recevoir des notifications sur votre appareil',
          value: pushNotifications,
          onValueChange: setPushNotifications,
        },
        {
          icon: 'mail-outline',
          label: 'Notifications par email',
          description: 'Recevoir des notifications par email',
          value: emailNotifications,
          onValueChange: setEmailNotifications,
        },
        {
          icon: 'chatbubble-outline',
          label: 'Notifications SMS',
          description: 'Recevoir des notifications par SMS (Premium)',
          value: smsNotifications,
          onValueChange: setSmsNotifications,
          premium: true,
        },
      ],
    },
    {
      title: 'Rappels',
      items: [
        {
          icon: 'notifications-outline',
          label: 'Rappels d\'événements',
          description: 'Recevoir des rappels pour vos événements',
          value: reminderNotifications,
          onValueChange: setReminderNotifications,
        },
        {
          icon: 'time-outline',
          label: 'Rappels personnalisés',
          description: 'Recevoir des rappels selon vos préférences',
          value: eventReminders,
          onValueChange: setEventReminders,
        },
      ],
    },
    {
      title: 'Résumés',
      items: [
        {
          icon: 'calendar-outline',
          label: 'Résumé quotidien',
          description: 'Recevoir un résumé de vos événements du jour',
          value: dailyDigest,
          onValueChange: setDailyDigest,
        },
        {
          icon: 'stats-chart-outline',
          label: 'Rapport hebdomadaire',
          description: 'Recevoir un rapport hebdomadaire de vos activités',
          value: weeklyReport,
          onValueChange: setWeeklyReport,
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
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {notificationSections.map((section, sectionIndex) => (
            <View key={sectionIndex} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.sectionContent}>
                {section.items.map((item, itemIndex) => (
                  <View
                    key={itemIndex}
                    style={[
                      styles.notificationItem,
                      itemIndex === section.items.length - 1 && styles.lastItem,
                    ]}
                  >
                    <View style={styles.notificationItemLeft}>
                      <View style={styles.iconContainer}>
                        <Ionicons name={item.icon as any} size={22} color="#007AFF" />
                      </View>
                      <View style={styles.notificationContent}>
                        <View style={styles.notificationHeader}>
                          <Text style={styles.notificationLabel}>{item.label}</Text>
                          {item.premium && (
                            <View style={styles.premiumBadge}>
                              <Ionicons name="star" size={12} color="#FFD700" />
                              <Text style={styles.premiumText}>Premium</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.notificationDescription}>{item.description}</Text>
                      </View>
                    </View>
                    <Switch
                      value={item.value}
                      onValueChange={item.onValueChange}
                      trackColor={{ false: '#e5e5e7', true: '#007AFF' }}
                      thumbColor="#fff"
                      disabled={item.premium}
                    />
                  </View>
                ))}
              </View>
            </View>
          ))}

          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={20} color="#007AFF" />
            <Text style={styles.infoText}>
              Les notifications push nécessitent que vous autorisiez les notifications dans les
              paramètres de votre appareil.
            </Text>
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
  notificationItem: {
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
  notificationItemLeft: {
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
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  notificationLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  premiumText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FF9500',
  },
  notificationDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E6F4FE',
    borderRadius: 12,
    padding: 16,
    margin: 20,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#007AFF',
    lineHeight: 18,
  },
});

