// Types principaux pour ReMindly

export type RepeatType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
export type EventStatus = 'pending' | 'done' | 'cancelled';
export type ReminderStatus = 'pending' | 'sent' | 'failed';
export type PremiumPlan = 'monthly' | 'yearly';
export type GroupRole = 'admin' | 'member';
export type EventRole = 'owner' | 'responsible' | 'viewer';
export type GeoTrigger = 'enter' | 'exit';
export type NotificationChannel = 'push' | 'sms' | 'email';

export interface Category {
  id: string;
  user_id: string;
  name: string;
  icon?: string;
  color?: string;
  created_at: string;
}

export interface Event {
  id: string;
  user_id: string;
  category_id?: string;
  title: string;
  description?: string;
  date_time: string;
  location?: string;
  repeat_type: RepeatType;
  status: EventStatus;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface Reminder {
  id: string;
  event_id: string;
  remind_before: string; // interval format (e.g., "5 minutes", "1 hour")
  scheduled_at: string;
  status: ReminderStatus;
  created_at: string;
  event?: Event;
}

export interface Attachment {
  id: string;
  event_id: string;
  file_url: string;
  file_type?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface VoiceNote {
  id: string;
  event_id: string;
  audio_url: string;
  duration_seconds?: number;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  owner_id: string;
  description?: string;
  created_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: GroupRole;
  joined_at: string;
}

export interface SharedEvent {
  id: string;
  event_id: string;
  shared_with: string;
  can_edit: boolean;
  created_at: string;
}

export interface PremiumSubscription {
  id: string;
  user_id: string;
  plan: PremiumPlan;
  provider?: string;
  provider_subscription_id?: string;
  is_active: boolean;
  start_at?: string;
  end_at?: string;
  created_at: string;
}

export interface GeoReminder {
  id: string;
  event_id: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  trigger_on: GeoTrigger;
  created_at: string;
}

export interface SecureFile {
  id: string;
  user_id: string;
  file_url: string;
  file_name?: string;
  encrypted: boolean;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface NotificationLog {
  id: string;
  reminder_id?: string;
  user_id?: string;
  channel: NotificationChannel;
  sent_at: string;
  success: boolean;
  payload?: Record<string, any>;
}

export interface EventAssignment {
  id: string;
  event_id: string;
  assigned_to_user?: string;
  assigned_to_group?: string;
  role: EventRole;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  avatar_url?: string;
  timezone?: string;
  created_at: string;
}

// Types pour les formulaires
export interface CreateEventInput {
  title: string;
  description?: string;
  category_id?: string;
  date_time: Date;
  location?: string;
  repeat_type: RepeatType;
  reminders?: string[]; // Array of intervals like ["5 minutes", "1 hour"]
  attachments?: string[]; // Array of file URIs (for React Native)
}

export interface CreateReminderInput {
  event_id: string;
  remind_before: string;
}

export interface CreateGroupInput {
  name: string;
  description?: string;
  member_emails?: string[];
}

// Types pour les statistiques
export interface UserStats {
  total_events: number;
  completed_events: number;
  pending_events: number;
  total_reminders: number;
  sent_reminders: number;
  missed_reminders: number;
  weekly_activity: {
    date: string;
    count: number;
  }[];
}

