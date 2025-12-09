import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Platform,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEventsStore } from '@/stores/events.store';
import { format, parseISO, isToday, isPast, startOfDay, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Event } from '@/types';

export default function CalendarScreen() {
  const { events, fetchEvents, fetchCategories, loading } = useEventsStore();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [markedDates, setMarkedDates] = useState<Record<string, any>>({});
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

  useEffect(() => {
    // Marquer les dates avec des événements
    const marked: Record<string, any> = {};
    events.forEach((event) => {
      const date = format(parseISO(event.date_time), 'yyyy-MM-dd');
      if (!marked[date]) {
        marked[date] = { marked: true, dots: [] };
      }
      marked[date].dots.push({
        color: event.category?.color || '#007AFF',
        selectedDotColor: event.category?.color || '#007AFF',
      });
    });

    // Marquer la date sélectionnée
    if (marked[selectedDate]) {
      marked[selectedDate].selected = true;
      marked[selectedDate].selectedColor = '#007AFF';
    } else {
      marked[selectedDate] = { selected: true, selectedColor: '#007AFF' };
    }

    setMarkedDates(marked);
  }, [events, selectedDate]);

  const dayEvents = events.filter((event) => {
    const eventDate = format(parseISO(event.date_time), 'yyyy-MM-dd');
    return eventDate === selectedDate;
  });

  const upcomingEvents = events
    .filter((event) => !isPast(parseISO(event.date_time)) && event.status === 'pending')
    .sort((a, b) => parseISO(a.date_time).getTime() - parseISO(b.date_time).getTime())
    .slice(0, 5);

  const todayEvents = events.filter((event) => {
    const eventDate = format(parseISO(event.date_time), 'yyyy-MM-dd');
    return eventDate === format(new Date(), 'yyyy-MM-dd');
  });

  const stats = {
    today: todayEvents.length,
    upcoming: upcomingEvents.length,
    total: events.length,
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerGreeting}>Bonjour 👋</Text>
            <Text style={styles.headerTitle}>Calendrier</Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/events/create')}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.statsContainer}
          contentContainerStyle={styles.statsContent}
        >
          <StatCard icon="today-outline" label="Aujourd'hui" value={stats.today} color="#007AFF" />
          <StatCard icon="time-outline" label="À venir" value={stats.upcoming} color="#34C759" />
          <StatCard icon="calendar-outline" label="Total" value={stats.total} color="#FF9500" />
        </ScrollView>

        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={() => fetchEvents()} tintColor="#007AFF" />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Calendar */}
          <View style={styles.calendarContainer}>
            <Calendar
              current={selectedDate}
              onDayPress={(day) => setSelectedDate(day.dateString)}
              markedDates={markedDates}
              markingType="multi-dot"
              theme={{
                backgroundColor: '#fff',
                calendarBackground: '#fff',
                textSectionTitleColor: '#666',
                selectedDayBackgroundColor: '#007AFF',
                selectedDayTextColor: '#fff',
                todayTextColor: '#007AFF',
                dayTextColor: '#1a1a1a',
                textDisabledColor: '#ccc',
                dotColor: '#007AFF',
                selectedDotColor: '#fff',
                arrowColor: '#007AFF',
                monthTextColor: '#1a1a1a',
                textDayFontWeight: '500',
                textMonthFontWeight: '700',
                textDayHeaderFontWeight: '600',
                textDayFontSize: 16,
                textMonthFontSize: 18,
                textDayHeaderFontSize: 13,
              }}
              style={styles.calendar}
              firstDay={1}
              locale="fr"
            />
          </View>

          {/* Selected Date Events */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                <Ionicons name="calendar" size={20} color="#007AFF" />
                <Text style={styles.sectionTitle}>
                  {isToday(parseISO(selectedDate + 'T00:00:00'))
                    ? "Aujourd'hui"
                    : format(parseISO(selectedDate + 'T00:00:00'), 'EEEE d MMMM', { locale: fr })}
                </Text>
              </View>
              {dayEvents.length > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{dayEvents.length}</Text>
                </View>
              )}
            </View>

            {dayEvents.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconContainer}>
                  <Ionicons name="calendar-outline" size={48} color="#ccc" />
                </View>
                <Text style={styles.emptyText}>Aucun événement ce jour</Text>
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => router.push('/events/create')}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add-circle-outline" size={20} color="#007AFF" />
                  <Text style={styles.emptyButtonText}>Créer un événement</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.eventsList}>
                {dayEvents.map((event, index) => (
                  <EventCard key={event.id} event={event} index={index} />
                ))}
              </View>
            )}
          </View>

          {/* Upcoming Events */}
          {upcomingEvents.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderLeft}>
                  <Ionicons name="time" size={20} color="#34C759" />
                  <Text style={styles.sectionTitle}>À venir</Text>
                </View>
                <TouchableOpacity onPress={() => router.push('/events')} activeOpacity={0.7}>
                  <Text style={styles.seeAllText}>Voir tout</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.eventsList}>
                {upcomingEvents.map((event, index) => (
                  <EventCard key={event.id} event={event} index={index} />
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </View>
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
  value: number;
  color: string;
}) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={[styles.statIconContainer, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function EventCard({ event, index }: { event: Event; index: number }) {
  const eventDate = parseISO(event.date_time);
  const isPastEvent = isPast(eventDate);
  const isTodayEvent = isToday(eventDate);
  const daysUntil = differenceInDays(startOfDay(eventDate), startOfDay(new Date()));

  return (
    <TouchableOpacity
      style={[styles.eventCard, isPastEvent && styles.pastEvent]}
      onPress={() => router.push(`/events/${event.id}`)}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.eventIndicator,
          { backgroundColor: event.category?.color || '#007AFF' },
        ]}
      />
      <View style={styles.eventContent}>
        <View style={styles.eventHeader}>
          <Text style={styles.eventTitle} numberOfLines={1}>
            {event.title}
          </Text>
          {event.status === 'done' && (
            <View style={styles.doneBadge}>
              <Ionicons name="checkmark-circle" size={18} color="#34C759" />
            </View>
          )}
        </View>
        <View style={styles.eventMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={14} color="#666" />
            <Text style={styles.eventTime}>
              {format(eventDate, 'HH:mm', { locale: fr })}
            </Text>
          </View>
          {event.location && (
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={14} color="#666" />
              <Text style={styles.eventLocation} numberOfLines={1}>
                {event.location}
              </Text>
            </View>
          )}
        </View>
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
                  size={12}
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
            {!isPastEvent && !isTodayEvent && daysUntil > 0 && (
              <Text style={styles.daysUntil}>
                Dans {daysUntil} jour{daysUntil > 1 ? 's' : ''}
              </Text>
            )}
          </View>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
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
  headerGreeting: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1a1a1a',
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
  statsContainer: {
    maxHeight: 120,
  },
  statsContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    width: 110,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  calendarContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  calendar: {
    borderRadius: 12,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    textTransform: 'capitalize',
  },
  badge: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  eventsList: {
    gap: 12,
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
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
  eventIndicator: {
    width: 4,
    height: '100%',
    borderRadius: 2,
    marginRight: 12,
    minHeight: 50,
  },
  eventContent: {
    flex: 1,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  doneBadge: {
    marginLeft: 8,
  },
  eventMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventTime: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  eventLocation: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
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
  daysUntil: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    borderStyle: 'dashed',
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 20,
    fontWeight: '500',
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
