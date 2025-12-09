import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { statsService } from '@/services/stats.service';
import { UserStats } from '@/types';

export default function StatsScreen() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [paymentStats, setPaymentStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const [userStats, payments] = await Promise.all([
        statsService.getUserStats(),
        statsService.getPaymentStats(),
      ]);
      setStats(userStats);
      setPaymentStats(payments);
    } catch (error: any) {
      console.error('Erreur lors du chargement des statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!stats) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Statistiques</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text>Chargement...</Text>
        </View>
      </View>
    );
  }

  const completionRate = stats.total_events > 0
    ? Math.round((stats.completed_events / stats.total_events) * 100)
    : 0;

  const reminderSuccessRate = stats.total_reminders > 0
    ? Math.round((stats.sent_reminders / stats.total_reminders) * 100)
    : 0;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={loadStats} />
      }
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Statistiques</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {/* Statistiques générales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vue d'ensemble</Text>
          <View style={styles.statsGrid}>
            <StatCard
              icon="calendar"
              label="Événements totaux"
              value={stats.total_events.toString()}
              color="#E6F4FE"
            />
            <StatCard
              icon="checkmark-circle"
              label="Terminés"
              value={stats.completed_events.toString()}
              color="#4CAF50"
            />
            <StatCard
              icon="time"
              label="En attente"
              value={stats.pending_events.toString()}
              color="#FF9800"
            />
            <StatCard
              icon="notifications"
              label="Rappels envoyés"
              value={`${stats.sent_reminders}/${stats.total_reminders}`}
              color="#2196F3"
            />
          </View>
        </View>

        {/* Taux de réussite */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance</Text>
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Taux de complétion</Text>
              <Text style={styles.progressValue}>{completionRate}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${completionRate}%`, backgroundColor: '#4CAF50' },
                ]}
              />
            </View>
          </View>

          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Taux de réussite des rappels</Text>
              <Text style={styles.progressValue}>{reminderSuccessRate}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${reminderSuccessRate}%`, backgroundColor: '#2196F3' },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Statistiques de paiement */}
        {paymentStats && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Paiements</Text>
            <View style={styles.statsGrid}>
              <StatCard
                icon="card"
                label="Total"
                value={paymentStats.total.toString()}
                color="#9C27B0"
              />
              <StatCard
                icon="checkmark-circle"
                label="Payés"
                value={paymentStats.paid.toString()}
                color="#4CAF50"
              />
              <StatCard
                icon="alert-circle"
                label="En retard"
                value={paymentStats.overdue.toString()}
                color="#F44336"
              />
              <StatCard
                icon="calendar"
                label="À venir"
                value={paymentStats.upcoming.toString()}
                color="#FF9800"
              />
            </View>
          </View>
        )}

        {/* Activité hebdomadaire */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activité hebdomadaire</Text>
          <View style={styles.weeklyActivity}>
            {stats.weekly_activity.map((week, index) => (
              <View key={index} style={styles.weekBar}>
                <View
                  style={[
                    styles.weekBarFill,
                    {
                      height: `${Math.max((week.count / Math.max(...stats.weekly_activity.map((w) => w.count), 1)) * 100, 10)}%`,
                    },
                  ]}
                />
                <Text style={styles.weekLabel}>S{index + 1}</Text>
                <Text style={styles.weekCount}>{week.count}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color }]}>
        <Ionicons name={icon as any} size={24} color="#fff" />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '47%',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  progressCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#666',
  },
  progressValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  weeklyActivity: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 200,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
  },
  weekBar: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  weekBarFill: {
    width: '80%',
    backgroundColor: '#E6F4FE',
    borderRadius: 4,
    marginBottom: 8,
    minHeight: 20,
  },
  weekLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  weekCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
});

