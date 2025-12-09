import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useEventsStore } from '@/stores/events.store';
import { CreateEventInput, RepeatType } from '@/types';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

const REMINDER_OPTIONS = [
  { label: '5 minutes avant', value: '5 minutes' },
  { label: '15 minutes avant', value: '15 minutes' },
  { label: '30 minutes avant', value: '30 minutes' },
  { label: '1 heure avant', value: '1 hour' },
  { label: '1 jour avant', value: '1 day' },
];

const REPEAT_OPTIONS: { label: string; value: RepeatType }[] = [
  { label: 'Aucune', value: 'none' },
  { label: 'Quotidien', value: 'daily' },
  { label: 'Hebdomadaire', value: 'weekly' },
  { label: 'Mensuel', value: 'monthly' },
  { label: 'Annuel', value: 'yearly' },
];

export default function EditEventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    selectedEvent,
    fetchEventById,
    updateEvent,
    categories,
    fetchCategories,
    loading,
  } = useEventsStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [dateTime, setDateTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [location, setLocation] = useState('');
  const [repeatType, setRepeatType] = useState<RepeatType>('none');

  useEffect(() => {
    if (id) {
      fetchEventById(id);
      fetchCategories();
    }
  }, [id]);

  useEffect(() => {
    if (selectedEvent) {
      setTitle(selectedEvent.title);
      setDescription(selectedEvent.description || '');
      setSelectedCategory(selectedEvent.category_id || undefined);
      setDateTime(parseISO(selectedEvent.date_time));
      setLocation(selectedEvent.location || '');
      setRepeatType(selectedEvent.repeat_type as RepeatType);
    }
  }, [selectedEvent]);

  const handleSave = async () => {
    if (!title.trim() || !id) {
      Alert.alert('Erreur', 'Veuillez entrer un titre');
      return;
    }

    try {
      const updates: Partial<CreateEventInput> = {
        title: title.trim(),
        description: description.trim() || undefined,
        category_id: selectedCategory,
        date_time: dateTime,
        location: location.trim() || undefined,
        repeat_type: repeatType,
      };

      await updateEvent(id, updates);
      router.back();
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de modifier l\'événement');
    }
  };

  if (!selectedEvent && !loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={24} color="#1a1a1a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Modifier</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.centerContainer}>
          <Text>Événement non trouvé</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Modifier l'événement</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          <Text style={[styles.saveButton, loading && styles.saveButtonDisabled]}>
            Enregistrer
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.label}>Titre *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Réunion avec l'équipe"
            value={title}
            onChangeText={setTitle}
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Ajouter une description..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Catégorie</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryChip,
                  selectedCategory === category.id && styles.categoryChipSelected,
                  { borderColor: category.color || '#E6F4FE' },
                ]}
                onPress={() =>
                  setSelectedCategory(
                    selectedCategory === category.id ? undefined : category.id
                  )
                }
              >
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === category.id && styles.categoryTextSelected,
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Date et heure</Text>
          <View style={styles.dateTimeRow}>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color="#666" />
              <Text style={styles.dateTimeText}>
                {format(dateTime, 'EEEE d MMMM yyyy', { locale: fr })}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowTimePicker(true)}
            >
              <Ionicons name="time-outline" size={20} color="#666" />
              <Text style={styles.dateTimeText}>
                {format(dateTime, 'HH:mm')}
              </Text>
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={dateTime}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                setShowDatePicker(Platform.OS === 'ios');
                if (selectedDate) {
                  const newDate = new Date(selectedDate);
                  newDate.setHours(dateTime.getHours());
                  newDate.setMinutes(dateTime.getMinutes());
                  setDateTime(newDate);
                }
              }}
            />
          )}

          {showTimePicker && (
            <DateTimePicker
              value={dateTime}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedTime) => {
                setShowTimePicker(Platform.OS === 'ios');
                if (selectedTime) {
                  const newDate = new Date(dateTime);
                  newDate.setHours(selectedTime.getHours());
                  newDate.setMinutes(selectedTime.getMinutes());
                  setDateTime(newDate);
                }
              }}
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Localisation</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Bureau, Maison..."
            value={location}
            onChangeText={setLocation}
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Répétition</Text>
          <View style={styles.repeatOptions}>
            {REPEAT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.repeatOption,
                  repeatType === option.value && styles.repeatOptionSelected,
                ]}
                onPress={() => setRepeatType(option.value)}
              >
                <Text
                  style={[
                    styles.repeatText,
                    repeatType === option.value && styles.repeatTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
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
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E6F4FE',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1a1a1a',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  categories: {
    marginTop: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    marginRight: 8,
    backgroundColor: '#fff',
  },
  categoryChipSelected: {
    backgroundColor: '#E6F4FE',
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
  },
  categoryTextSelected: {
    color: '#1a1a1a',
    fontWeight: '600',
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateTimeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  dateTimeText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  repeatOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  repeatOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  repeatOptionSelected: {
    backgroundColor: '#E6F4FE',
  },
  repeatText: {
    fontSize: 14,
    color: '#666',
  },
  repeatTextSelected: {
    color: '#1a1a1a',
    fontWeight: '600',
  },
});

