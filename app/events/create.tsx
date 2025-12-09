import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
  Animated,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useEventsStore } from '@/stores/events.store';
import { CreateEventInput, RepeatType } from '@/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { attachmentsService } from '@/services/attachments.service';
import { voiceNotesService } from '@/services/voice-notes.service';
import { Audio } from 'expo-av';

const REMINDER_OPTIONS = [
  { label: '5 minutes avant', value: '5 minutes', icon: 'time-outline' },
  { label: '15 minutes avant', value: '15 minutes', icon: 'time-outline' },
  { label: '30 minutes avant', value: '30 minutes', icon: 'time-outline' },
  { label: '1 heure avant', value: '1 hour', icon: 'hourglass-outline' },
  { label: '1 jour avant', value: '1 day', icon: 'calendar-outline' },
];

const REPEAT_OPTIONS: { label: string; value: RepeatType; icon: string }[] = [
  { label: 'Aucune', value: 'none', icon: 'close-circle-outline' },
  { label: 'Quotidien', value: 'daily', icon: 'repeat-outline' },
  { label: 'Hebdomadaire', value: 'weekly', icon: 'calendar-outline' },
  { label: 'Mensuel', value: 'monthly', icon: 'calendar-number-outline' },
  { label: 'Annuel', value: 'yearly', icon: 'calendar-clear-outline' },
];

interface AttachmentPreview {
  uri: string;
  name: string;
  type: string;
}

export default function CreateEventScreen() {
  const { createEvent, categories, fetchCategories, loading } = useEventsStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [dateTime, setDateTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [location, setLocation] = useState('');
  const [repeatType, setRepeatType] = useState<RepeatType>('none');
  const [selectedReminders, setSelectedReminders] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<AttachmentPreview[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fetchCategories();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fetchCategories]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      // Animation de pulsation pour l'indicateur d'enregistrement
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();

      interval = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      pulseAnim.setValue(1);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Le titre est requis';
    } else if (title.trim().length < 3) {
      newErrors.title = 'Le titre doit contenir au moins 3 caractères';
    }

    if (dateTime < new Date()) {
      newErrors.dateTime = 'La date ne peut pas être dans le passé';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleToggleReminder = (value: string) => {
    setSelectedReminders((prev) =>
      prev.includes(value)
        ? prev.filter((r) => r !== value)
        : [...prev, value]
    );
  };

  const handlePickImage = async () => {
    try {
      const result = await attachmentsService.pickImage();
      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setAttachments((prev) => [
          ...prev,
          {
            uri: asset.uri,
            name: asset.fileName || `image_${Date.now()}.jpg`,
            type: asset.type || 'image/jpeg',
          },
        ]);
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de sélectionner l\'image');
    }
  };

  const handlePickDocument = async () => {
    try {
      const result = await attachmentsService.pickDocument();
      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setAttachments((prev) => [
          ...prev,
          {
            uri: asset.uri,
            name: asset.name || `document_${Date.now()}.pdf`,
            type: asset.mimeType || 'application/pdf',
          },
        ]);
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de sélectionner le document');
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStartRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
      setRecordingDuration(0);
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de démarrer l\'enregistrement');
    }
  };

  const handleStopRecording = async () => {
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      setIsRecording(false);
      // La note vocale sera sauvegardée après la création de l'événement
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible d\'arrêter l\'enregistrement');
      setIsRecording(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert('Erreur de validation', 'Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    try {
      const input: CreateEventInput = {
        title: title.trim(),
        description: description.trim() || undefined,
        category_id: selectedCategory,
        date_time: dateTime,
        location: location.trim() || undefined,
        repeat_type: repeatType,
        reminders: selectedReminders.length > 0 ? selectedReminders : undefined,
      };

      const event = await createEvent(input);

      // Upload des pièces jointes
      if (attachments.length > 0 && event) {
        for (const attachment of attachments) {
          try {
            await attachmentsService.uploadAttachment(
              event.id,
              attachment.uri,
              attachment.name,
              attachment.type
            );
          } catch (error: any) {
            console.error('Erreur upload pièce jointe:', error);
            // Continue même si un upload échoue
          }
        }
      }

      // Sauvegarder la note vocale si présente
      if (recording && event) {
        try {
          await voiceNotesService.stopRecordingAndSave(recording, event.id);
        } catch (error: any) {
          console.error('Erreur sauvegarde note vocale:', error);
          // Continue même si la sauvegarde échoue
        }
      }

      router.back();
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de créer l\'événement');
    }
  };

  const selectedCategoryData = categories.find((c) => c.id === selectedCategory);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.headerButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Nouvel événement</Text>
          </View>
          <TouchableOpacity
            onPress={handleSave}
            disabled={loading}
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Text style={styles.saveButtonText}>Enregistrer</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Titre */}
          <View style={styles.section}>
            <Text style={styles.label}>
              Titre <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.title && styles.inputError]}
              placeholder="Ex: Réunion avec l'équipe"
              value={title}
              onChangeText={(text) => {
                setTitle(text);
                if (errors.title) {
                  setErrors((prev) => ({ ...prev, title: '' }));
                }
              }}
              placeholderTextColor="#999"
              maxLength={100}
            />
            {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Ajouter une description détaillée..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              placeholderTextColor="#999"
              maxLength={500}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{description.length}/500</Text>
          </View>

          {/* Catégorie */}
          <View style={styles.section}>
            <Text style={styles.label}>Catégorie</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categories}
              contentContainerStyle={styles.categoriesContent}
            >
              {categories.length === 0 ? (
                <Text style={styles.emptyText}>Aucune catégorie disponible</Text>
              ) : (
                categories.map((category) => {
                  const isSelected = selectedCategory === category.id;
                  return (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.categoryChip,
                        isSelected && styles.categoryChipSelected,
                        isSelected &&
                          category.color && {
                            backgroundColor: category.color,
                            borderColor: category.color,
                          },
                      ]}
                      onPress={() =>
                        setSelectedCategory(isSelected ? undefined : category.id)
                      }
                    >
                      {category.icon && (
                        <Ionicons
                          name={category.icon as any}
                          size={16}
                          color={isSelected ? '#fff' : '#666'}
                          style={styles.categoryIcon}
                        />
                      )}
                      <Text
                        style={[
                          styles.categoryText,
                          isSelected && styles.categoryTextSelected,
                        ]}
                      >
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>

          {/* Date et heure */}
          <View style={styles.section}>
            <Text style={styles.label}>
              Date et heure <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.dateTimeContainer}>
              <TouchableOpacity
                style={[styles.dateTimeButton, errors.dateTime && styles.inputError]}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="calendar-outline" size={22} color="#007AFF" />
                <View style={styles.dateTimeTextContainer}>
                  <Text style={styles.dateTimeLabel}>Date</Text>
                  <Text style={styles.dateTimeText}>
                    {format(dateTime, 'EEEE d MMMM yyyy', { locale: fr })}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowTimePicker(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="time-outline" size={22} color="#007AFF" />
                <View style={styles.dateTimeTextContainer}>
                  <Text style={styles.dateTimeLabel}>Heure</Text>
                  <Text style={styles.dateTimeText}>{format(dateTime, 'HH:mm')}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>
            </View>
            {errors.dateTime && <Text style={styles.errorText}>{errors.dateTime}</Text>}

            {showDatePicker && (
              <DateTimePicker
                value={dateTime}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  if (Platform.OS === 'android') {
                    setShowDatePicker(false);
                  }
                  if (selectedDate) {
                    const newDate = new Date(selectedDate);
                    newDate.setHours(dateTime.getHours());
                    newDate.setMinutes(dateTime.getMinutes());
                    setDateTime(newDate);
                    if (errors.dateTime) {
                      setErrors((prev) => ({ ...prev, dateTime: '' }));
                    }
                  }
                }}
                minimumDate={new Date()}
              />
            )}

            {showTimePicker && (
              <DateTimePicker
                value={dateTime}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedTime) => {
                  if (Platform.OS === 'android') {
                    setShowTimePicker(false);
                  }
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

          {/* Localisation */}
          <View style={styles.section}>
            <Text style={styles.label}>Localisation</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Bureau, Maison, Adresse..."
              value={location}
              onChangeText={setLocation}
              placeholderTextColor="#999"
            />
          </View>

          {/* Répétition */}
          <View style={styles.section}>
            <Text style={styles.label}>Répétition</Text>
            <View style={styles.repeatOptions}>
              {REPEAT_OPTIONS.map((option) => {
                const isSelected = repeatType === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.repeatOption,
                      isSelected && styles.repeatOptionSelected,
                    ]}
                    onPress={() => setRepeatType(option.value)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={option.icon as any}
                      size={18}
                      color={isSelected ? '#007AFF' : '#666'}
                    />
                    <Text
                      style={[
                        styles.repeatText,
                        isSelected && styles.repeatTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Rappels */}
          <View style={styles.section}>
            <Text style={styles.label}>Rappels</Text>
            <View style={styles.remindersContainer}>
              {REMINDER_OPTIONS.map((option) => {
                const isSelected = selectedReminders.includes(option.value);
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={styles.reminderOption}
                    onPress={() => handleToggleReminder(option.value)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        isSelected && styles.checkboxSelected,
                      ]}
                    >
                      {isSelected && (
                        <Ionicons name="checkmark" size={18} color="#fff" />
                      )}
                    </View>
                    <Ionicons
                      name={option.icon as any}
                      size={20}
                      color={isSelected ? '#007AFF' : '#999'}
                      style={styles.reminderIcon}
                    />
                    <Text
                      style={[
                        styles.reminderText,
                        isSelected && styles.reminderTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Pièces jointes */}
          <View style={styles.section}>
            <Text style={styles.label}>Pièces jointes</Text>
            <View style={styles.attachmentsActions}>
              <TouchableOpacity
                style={styles.attachmentButton}
                onPress={handlePickImage}
                activeOpacity={0.7}
              >
                <Ionicons name="image-outline" size={20} color="#007AFF" />
                <Text style={styles.attachmentButtonText}>Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.attachmentButton}
                onPress={handlePickDocument}
                activeOpacity={0.7}
              >
                <Ionicons name="document-outline" size={20} color="#007AFF" />
                <Text style={styles.attachmentButtonText}>Document</Text>
              </TouchableOpacity>
            </View>

            {attachments.length > 0 && (
              <View style={styles.attachmentsList}>
                {attachments.map((attachment, index) => (
                  <View key={index} style={styles.attachmentItem}>
                    {attachment.type.startsWith('image/') ? (
                      <Image
                        source={{ uri: attachment.uri }}
                        style={styles.attachmentImage}
                      />
                    ) : (
                      <View style={styles.attachmentIcon}>
                        <Ionicons name="document" size={24} color="#007AFF" />
                      </View>
                    )}
                    <View style={styles.attachmentInfo}>
                      <Text style={styles.attachmentName} numberOfLines={1}>
                        {attachment.name}
                      </Text>
                      <Text style={styles.attachmentType}>
                        {attachment.type.split('/')[1]?.toUpperCase() || 'FILE'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleRemoveAttachment(index)}
                      style={styles.removeButton}
                    >
                      <Ionicons name="close-circle" size={24} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Note vocale */}
          <View style={styles.section}>
            <Text style={styles.label}>Note vocale</Text>
            {!isRecording && !recording ? (
              <TouchableOpacity
                style={styles.voiceButton}
                onPress={handleStartRecording}
                activeOpacity={0.7}
              >
                <Ionicons name="mic-outline" size={24} color="#007AFF" />
                <Text style={styles.voiceButtonText}>Enregistrer une note</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.recordingContainer}>
                <View style={styles.recordingInfo}>
                  <Animated.View
                    style={[
                      styles.recordingIndicator,
                      { transform: [{ scale: pulseAnim }] },
                    ]}
                  >
                    <View style={styles.recordingDot} />
                  </Animated.View>
                  <Text style={styles.recordingText}>
                    {isRecording
                      ? `Enregistrement... ${formatDuration(recordingDuration)}`
                      : 'Note enregistrée'}
                  </Text>
                </View>
                {isRecording ? (
                  <TouchableOpacity
                    style={styles.stopButton}
                    onPress={handleStopRecording}
                  >
                    <Ionicons name="stop" size={20} color="#fff" />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setRecording(null);
                      setRecordingDuration(0);
                    }}
                  >
                    <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* Espace en bas pour le scroll */}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </Animated.View>
    </KeyboardAvoidingView>
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
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 56,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    marginRight: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  saveButton: {
    minWidth: 80,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 28,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 10,
  },
  required: {
    color: '#FF3B30',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#e5e5e7',
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  textArea: {
    height: 120,
    paddingTop: 16,
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  errorText: {
    fontSize: 13,
    color: '#FF3B30',
    marginTop: 6,
  },
  categories: {
    marginTop: 8,
  },
  categoriesContent: {
    paddingRight: 20,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#e5e5e7',
    marginRight: 10,
    backgroundColor: '#fff',
  },
  categoryChipSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  categoryIcon: {
    marginRight: 6,
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  categoryTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  dateTimeContainer: {
    gap: 12,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e5e7',
  },
  dateTimeTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  dateTimeLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  dateTimeText: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  repeatOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  repeatOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e5e7',
    gap: 6,
  },
  repeatOptionSelected: {
    backgroundColor: '#E6F4FE',
    borderColor: '#007AFF',
  },
  repeatText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  repeatTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  remindersContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e5e7',
    overflow: 'hidden',
  },
  reminderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#e5e5e7',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  checkboxSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  reminderIcon: {
    marginRight: 12,
  },
  reminderText: {
    fontSize: 16,
    color: '#1a1a1a',
    flex: 1,
  },
  reminderTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  attachmentsActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  attachmentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e5e7',
    gap: 8,
  },
  attachmentButtonText: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '500',
  },
  attachmentsList: {
    gap: 12,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e5e7',
  },
  attachmentImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  attachmentIcon: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#E6F4FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  attachmentInfo: {
    flex: 1,
  },
  attachmentName: {
    fontSize: 15,
    color: '#1a1a1a',
    fontWeight: '500',
    marginBottom: 2,
  },
  attachmentType: {
    fontSize: 12,
    color: '#999',
  },
  removeButton: {
    padding: 4,
  },
  voiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e5e7',
    gap: 10,
  },
  voiceButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  recordingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e5e7',
  },
  recordingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  recordingIndicator: {
    marginRight: 12,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF3B30',
  },
  recordingText: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  stopButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSpacer: {
    height: 40,
  },
});
