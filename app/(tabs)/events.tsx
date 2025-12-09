import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEventsStore } from '@/stores/events.store';
import { format, parseISO, isPast, isToday, startOfDay, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Event } from '@/types';

type FilterType = 'all' | 'pending' | 'done';

export default function EventsScreen() {
  const { events, fetchEvents, fetchCategories, loading } = useEventsStore();
  const [filter, setFilter] = useState<FilterType>('all');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchEvents();
    fetchCategories();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const filteredEvents = events.filter((event) => {
    if (filter === 'pending') return event.status === 'pending';
    if (filter === 'done') return event.status === 'done';
    return true;
  });

  const sortedEvents = [...filteredEvents].sort((a, b) => {
    return parseISO(a.date_time).getTime() - parseISO(b.date_time).getTime();
  });

  const stats = {
    all: events.length,
    pending: events.filter((e) => e.status === 'pending').length,
    done: events.filter((e) => e.status === 'done').length,
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Événements</Text>
            <Text style={styles.headerSubtitle}>{stats.all} événement{stats.all > 1 ? 's' : ''}</Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/events/create')}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Filters */}
        <View style={styles.filters}>
          <FilterButton
            label="Tous"
            count={stats.all}
            active={filter === 'all'}
            onPress={() => setFilter('all')}
          />
          <FilterButton
            label="À venir"
            count={stats.pending}
            active={filter === 'pending'}
            onPress={() => setFilter('pending')}
          />
          <FilterButton
            label="Terminés"
            count={stats.done}
            active={filter === 'done'}
            onPress={() => setFilter('done')}
          />
        </View>

        <FlatList
          data={sortedEvents}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => <EventListItem event={item} index={index} />}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={() => fetchEvents()} tintColor="#007AFF" />
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="list-outline" size={64} color="#ccc" />
              </View>
              <Text style={styles.emptyTitle}>Aucun événement</Text>
              <Text style={styles.emptyText}>
                {filter === 'all'
                  ? 'Commencez par créer votre premier événement'
                  : filter === 'pending'
                  ? 'Aucun événement à venir'
                  : 'Aucun événement terminé'}
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push('/events/create')}
                activeOpacity={0.7}
              >
                <Ionicons name="add-circle-outline" size={20} color="#fff" />
                <Text style={styles.emptyButtonText}>Créer un événement</Text>
              </TouchableOpacity>
            </View>
          }
        />
      </Animated.View>
    </View>
  );
}

function FilterButton({
  label,
  count,
  active,
  onPress,
}: {
  label: string;
  count: number;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.filterButton, active && styles.filterButtonActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text>
      <View style={[styles.filterBadge, active && styles.filterBadgeActive]}>
        <Text style={[styles.filterBadgeText, active && styles.filterBadgeTextActive]}>
          {count}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function EventListItem({ event, index }: { event: Event; index: number }) {
  const eventDate = parseISO(event.date_time);
  const isPastEvent = isPast(eventDate);
  const isTodayEvent = isToday(eventDate);
  const daysUntil = differenceInDays(startOfDay(eventDate), startOfDay(new Date()));

  const getDateLabel = () => {
    if (isTodayEvent) return "Aujourd'hui";
    if (daysUntil === 1) return 'Demain';
    if (daysUntil > 1 && daysUntil <= 7) return `Dans ${daysUntil} jours`;
    return format(eventDate, 'd MMM yyyy', { locale: fr });
  };

  return (
    <TouchableOpacity
      style={[styles.eventItem, isPastEvent && styles.pastEvent]}
      onPress={() => router.push(`/events/${event.id}`)}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.eventColor,
          { backgroundColor: event.category?.color || '#007AFF' },
        ]}
      />
      <View style={styles.eventInfo}>
        <View style={styles.eventHeader}>
          <Text style={styles.eventTitle} numberOfLines={2}>
            {event.title}
          </Text>
          {event.status === 'done' && (
            <View style={styles.doneBadge}>
              <Ionicons name="checkmark-circle" size={20} color="#34C759" />
            </View>
          )}
        </View>

        <View style={styles.eventDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.detailText}>{getDateLabel()}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.detailText}>{format(eventDate, 'HH:mm', { locale: fr })}</Text>
          </View>
        </View>

        {event.location && (
          <View style={styles.detailItem}>
            <Ionicons name="location-outline" size={16} color="#666" />
            <Text style={styles.detailText} numberOfLines={1}>
              {event.location}
            </Text>
          </View>
        )}

        {event.category && (
          <View style={styles.categoryContainer}>
            <View
              style={[
                styles.categoryBadge,
                event.category.color && { backgroundColor: event.category.color + '20' },
              ]}
            >
              {event.category.icon && (
                <Ionicons
                  name={event.category.icon as any}
                  size={14}
                  color={event.category.color || '#666'}
                  style={styles.categoryIcon}
                />
              )}
              <Text
                style={[
                  styles.categoryText,
                  event.category.color && { color: event.category.color },
                ]}
              >
                {event.category.name}
              </Text>
            </View>
            {event.description && (
              <Text style={styles.description} numberOfLines={1}>
                {event.description}
              </Text>
            )}
          </View>
        )}
      </View>
      <View style={styles.eventActions}>
        <Ionicons
          name={event.status === 'done' ? 'checkmark-circle' : 'chevron-forward'}
          size={24}
          color={event.status === 'done' ? '#34C759' : '#ccc'}
        />
      </View>
    </TouchableOpacity>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e7',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e7',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    gap: 8,
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#fff',
  },
  filterBadge: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  filterBadgeActive: {
    backgroundColor: '#0051D5',
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
  },
  filterBadgeTextActive: {
    color: '#fff',
  },
  list: {
    padding: 20,
    paddingBottom: 40,
  },
  eventItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  pastEvent: {
    opacity: 0.6,
  },
  eventColor: {
    width: 4,
  },
  eventInfo: {
    flex: 1,
    padding: 16,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    flex: 1,
    marginRight: 8,
  },
  doneBadge: {
    marginTop: 2,
  },
  eventDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  categoryIcon: {
    marginRight: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  description: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
    flex: 1,
  },
  eventActions: {
    justifyContent: 'center',
    paddingRight: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
