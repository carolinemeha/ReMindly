// Types générés pour Supabase
// Ces types peuvent être générés automatiquement avec supabase gen types typescript

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          icon: string | null;
          color: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          icon?: string | null;
          color?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          icon?: string | null;
          color?: string | null;
          created_at?: string;
        };
      };
      events: {
        Row: {
          id: string;
          user_id: string;
          category_id: string | null;
          title: string;
          description: string | null;
          date_time: string;
          location: string | null;
          repeat_type: string;
          status: string;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id?: string | null;
          title: string;
          description?: string | null;
          date_time: string;
          location?: string | null;
          repeat_type?: string;
          status?: string;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category_id?: string | null;
          title?: string;
          description?: string | null;
          date_time?: string;
          location?: string | null;
          repeat_type?: string;
          status?: string;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      reminders: {
        Row: {
          id: string;
          event_id: string;
          remind_before: string;
          scheduled_at: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          remind_before: string;
          scheduled_at: string;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          remind_before?: string;
          scheduled_at?: string;
          status?: string;
          created_at?: string;
        };
      };
      attachments: {
        Row: {
          id: string;
          event_id: string;
          file_url: string;
          file_type: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          file_url: string;
          file_type?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          file_url?: string;
          file_type?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
      };
      voice_notes: {
        Row: {
          id: string;
          event_id: string;
          audio_url: string;
          duration_seconds: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          audio_url: string;
          duration_seconds?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          audio_url?: string;
          duration_seconds?: number | null;
          created_at?: string;
        };
      };
      groups: {
        Row: {
          id: string;
          name: string;
          owner_id: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          owner_id: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          owner_id?: string;
          description?: string | null;
          created_at?: string;
        };
      };
      group_members: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          role: string;
          joined_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          user_id: string;
          role?: string;
          joined_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          user_id?: string;
          role?: string;
          joined_at?: string;
        };
      };
      shared_events: {
        Row: {
          id: string;
          event_id: string;
          shared_with: string;
          can_edit: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          shared_with: string;
          can_edit?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          shared_with?: string;
          can_edit?: boolean;
          created_at?: string;
        };
      };
      premium_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan: string;
          provider: string | null;
          provider_subscription_id: string | null;
          is_active: boolean;
          start_at: string | null;
          end_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan: string;
          provider?: string | null;
          provider_subscription_id?: string | null;
          is_active?: boolean;
          start_at?: string | null;
          end_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan?: string;
          provider?: string | null;
          provider_subscription_id?: string | null;
          is_active?: boolean;
          start_at?: string | null;
          end_at?: string | null;
          created_at?: string;
        };
      };
      geo_reminders: {
        Row: {
          id: string;
          event_id: string;
          latitude: number;
          longitude: number;
          radius_meters: number;
          trigger_on: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          latitude: number;
          longitude: number;
          radius_meters?: number;
          trigger_on?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          latitude?: number;
          longitude?: number;
          radius_meters?: number;
          trigger_on?: string;
          created_at?: string;
        };
      };
      secure_files: {
        Row: {
          id: string;
          user_id: string;
          file_url: string;
          file_name: string | null;
          encrypted: boolean;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          file_url: string;
          file_name?: string | null;
          encrypted?: boolean;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          file_url?: string;
          file_name?: string | null;
          encrypted?: boolean;
          metadata?: Json | null;
          created_at?: string;
        };
      };
      notifications_logs: {
        Row: {
          id: string;
          reminder_id: string | null;
          user_id: string | null;
          channel: string;
          sent_at: string;
          success: boolean;
          payload: Json | null;
        };
        Insert: {
          id?: string;
          reminder_id?: string | null;
          user_id?: string | null;
          channel: string;
          sent_at?: string;
          success?: boolean;
          payload?: Json | null;
        };
        Update: {
          id?: string;
          reminder_id?: string | null;
          user_id?: string | null;
          channel?: string;
          sent_at?: string;
          success?: boolean;
          payload?: Json | null;
        };
      };
      event_assignments: {
        Row: {
          id: string;
          event_id: string;
          assigned_to_user: string | null;
          assigned_to_group: string | null;
          role: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          assigned_to_user?: string | null;
          assigned_to_group?: string | null;
          role?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          assigned_to_user?: string | null;
          assigned_to_group?: string | null;
          role?: string;
          created_at?: string;
        };
      };
    };
  };
}

