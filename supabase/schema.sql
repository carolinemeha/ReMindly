-- ReMindly: SQL schema for Supabase (PostgreSQL)
-- Includes tables, FKs, indexes, RLS policies, functions, and default data

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------- SCHEMA ----------

-- categories
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  icon text,
  color text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_categories_user ON public.categories (user_id);

-- events
CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  date_time timestamptz NOT NULL,
  location text,
  repeat_type text DEFAULT 'none' CHECK (repeat_type IN ('none', 'daily', 'weekly', 'monthly', 'yearly')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'done', 'cancelled')),
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_events_user_date ON public.events (user_id, date_time);
CREATE INDEX IF NOT EXISTS idx_events_category ON public.events (category_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events (status);
CREATE INDEX IF NOT EXISTS idx_events_date_time ON public.events (date_time);

-- reminders
CREATE TABLE IF NOT EXISTS public.reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  remind_before interval NOT NULL,
  scheduled_at timestamptz NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reminders_scheduled_at ON public.reminders (scheduled_at);
CREATE INDEX IF NOT EXISTS idx_reminders_event ON public.reminders (event_id);
CREATE INDEX IF NOT EXISTS idx_reminders_status ON public.reminders (status);

-- attachments
CREATE TABLE IF NOT EXISTS public.attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  file_type text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_attachments_event ON public.attachments (event_id);

-- voice_notes
CREATE TABLE IF NOT EXISTS public.voice_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  audio_url text NOT NULL,
  duration_seconds integer,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_voice_notes_event ON public.voice_notes (event_id);

-- groups
CREATE TABLE IF NOT EXISTS public.groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  description text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_groups_owner ON public.groups (owner_id);

-- group_members
CREATE TABLE IF NOT EXISTS public.group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at timestamptz DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_group_user ON public.group_members (group_id, user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON public.group_members (user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON public.group_members (group_id);

-- shared_events
CREATE TABLE IF NOT EXISTS public.shared_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  shared_with uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  can_edit boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_shared_events_user ON public.shared_events (shared_with);
CREATE INDEX IF NOT EXISTS idx_shared_events_event ON public.shared_events (event_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_shared_event_user ON public.shared_events (event_id, shared_with);

-- premium_subscriptions
CREATE TABLE IF NOT EXISTS public.premium_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text NOT NULL CHECK (plan IN ('monthly', 'yearly')),
  provider text CHECK (provider IN ('stripe', 'playstore', 'appstore')),
  provider_subscription_id text,
  is_active boolean DEFAULT true,
  start_at timestamptz,
  end_at timestamptz,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_premium_user ON public.premium_subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_premium_active ON public.premium_subscriptions (user_id, is_active) WHERE is_active = true;

-- geo_reminders
CREATE TABLE IF NOT EXISTS public.geo_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  radius_meters double precision DEFAULT 100 CHECK (radius_meters > 0),
  trigger_on text DEFAULT 'enter' CHECK (trigger_on IN ('enter', 'exit')),
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_geo_reminders_event ON public.geo_reminders (event_id);

-- secure_files (Premium)
CREATE TABLE IF NOT EXISTS public.secure_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  file_name text,
  encrypted boolean DEFAULT true,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_secure_files_user ON public.secure_files (user_id);

-- notifications_logs
CREATE TABLE IF NOT EXISTS public.notifications_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reminder_id uuid REFERENCES public.reminders(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  channel text CHECK (channel IN ('push', 'sms', 'email')),
  sent_at timestamptz DEFAULT now(),
  success boolean DEFAULT true,
  payload jsonb
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications_logs (user_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_reminder ON public.notifications_logs (reminder_id);
CREATE INDEX IF NOT EXISTS idx_notifications_sent_at ON public.notifications_logs (sent_at);

-- event_assignments: assign an event to a group or user (for shared ownership)
CREATE TABLE IF NOT EXISTS public.event_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  assigned_to_user uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_to_group uuid REFERENCES public.groups(id) ON DELETE CASCADE,
  role text CHECK (role IN ('owner', 'responsible', 'viewer')),
  created_at timestamptz DEFAULT now(),
  CHECK (
    (assigned_to_user IS NOT NULL AND assigned_to_group IS NULL) OR
    (assigned_to_user IS NULL AND assigned_to_group IS NOT NULL)
  )
);
CREATE INDEX IF NOT EXISTS idx_event_assignments_event ON public.event_assignments (event_id);
CREATE INDEX IF NOT EXISTS idx_event_assignments_user ON public.event_assignments (assigned_to_user);
CREATE INDEX IF NOT EXISTS idx_event_assignments_group ON public.event_assignments (assigned_to_group);

-- user_push_tokens: store push notification tokens
CREATE TABLE IF NOT EXISTS public.user_push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  token text NOT NULL,
  platform text CHECK (platform IN ('ios', 'android', 'web')),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, platform)
);
CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON public.user_push_tokens (user_id);

-- ---------- TRIGGERS ----------

-- Function to keep updated_at current
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for events
DROP TRIGGER IF EXISTS trg_events_updated_at ON public.events;
CREATE TRIGGER trg_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

-- Trigger for user_push_tokens
DROP TRIGGER IF EXISTS trg_push_tokens_updated_at ON public.user_push_tokens;
CREATE TRIGGER trg_push_tokens_updated_at
BEFORE UPDATE ON public.user_push_tokens
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

-- Function to compute scheduled_at for reminders when inserting
CREATE OR REPLACE FUNCTION public.compute_scheduled_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.scheduled_at IS NULL AND NEW.remind_before IS NOT NULL THEN
    SELECT (e.date_time - NEW.remind_before) INTO NEW.scheduled_at 
    FROM public.events e 
    WHERE e.id = NEW.event_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_reminders_compute_scheduled_at ON public.reminders;
CREATE TRIGGER trg_reminders_compute_scheduled_at
BEFORE INSERT ON public.reminders
FOR EACH ROW
EXECUTE FUNCTION public.compute_scheduled_at();

-- Function to create default categories for new users
CREATE OR REPLACE FUNCTION public.create_default_categories()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.categories (user_id, name, icon, color) VALUES
    (NEW.id, 'Réunion', 'people', '#2196F3'),
    (NEW.id, 'Paiement', 'card', '#4CAF50'),
    (NEW.id, 'Rendez-vous', 'calendar', '#FF9800'),
    (NEW.id, 'Vaccination', 'medical', '#F44336'),
    (NEW.id, 'Anniversaire', 'gift', '#E91E63'),
    (NEW.id, 'Autres', 'ellipse', '#9E9E9E');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_create_default_categories ON auth.users;
CREATE TRIGGER trg_create_default_categories
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.create_default_categories();

-- ---------- ROW LEVEL SECURITY (RLS) POLICIES ----------

-- Enable RLS for all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.premium_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geo_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secure_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_push_tokens ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "categories_owner" ON public.categories;
DROP POLICY IF EXISTS "events_owner" ON public.events;
DROP POLICY IF EXISTS "reminders_owner" ON public.reminders;
DROP POLICY IF EXISTS "attachments_owner" ON public.attachments;
DROP POLICY IF EXISTS "voice_notes_owner" ON public.voice_notes;
DROP POLICY IF EXISTS "groups_read_for_members" ON public.groups;
DROP POLICY IF EXISTS "groups_write_owner" ON public.groups;
DROP POLICY IF EXISTS "group_members_manage" ON public.group_members;
DROP POLICY IF EXISTS "shared_events_owner_or_target" ON public.shared_events;
DROP POLICY IF EXISTS "premium_owner" ON public.premium_subscriptions;
DROP POLICY IF EXISTS "geo_owner" ON public.geo_reminders;
DROP POLICY IF EXISTS "secure_files_owner" ON public.secure_files;
DROP POLICY IF EXISTS "notifications_owner" ON public.notifications_logs;
DROP POLICY IF EXISTS "event_assignments_owner_or_assignee" ON public.event_assignments;
DROP POLICY IF EXISTS "push_tokens_owner" ON public.user_push_tokens;

-- Categories policies
CREATE POLICY "categories_owner" ON public.categories
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Events policies
CREATE POLICY "events_owner" ON public.events
  FOR ALL
  USING (
    user_id = auth.uid()
    OR id IN (SELECT event_id FROM public.shared_events WHERE shared_with = auth.uid())
    OR id IN (
      SELECT event_id FROM public.event_assignments ea 
      JOIN public.group_members gm ON ea.assigned_to_group = gm.group_id 
      WHERE gm.user_id = auth.uid()
    )
  )
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- Reminders policies
CREATE POLICY "reminders_owner" ON public.reminders
  FOR ALL
  USING (
    event_id IN (SELECT id FROM public.events WHERE user_id = auth.uid())
    OR event_id IN (SELECT event_id FROM public.shared_events WHERE shared_with = auth.uid())
  )
  WITH CHECK (event_id IN (SELECT id FROM public.events WHERE user_id = auth.uid()));

-- Attachments policies
CREATE POLICY "attachments_owner" ON public.attachments
  FOR ALL
  USING (event_id IN (SELECT id FROM public.events WHERE user_id = auth.uid()))
  WITH CHECK (event_id IN (SELECT id FROM public.events WHERE user_id = auth.uid()));

-- Voice notes policies
CREATE POLICY "voice_notes_owner" ON public.voice_notes
  FOR ALL
  USING (event_id IN (SELECT id FROM public.events WHERE user_id = auth.uid()))
  WITH CHECK (event_id IN (SELECT id FROM public.events WHERE user_id = auth.uid()));

-- Groups policies
CREATE POLICY "groups_read_for_members" ON public.groups
  FOR SELECT
  USING (
    owner_id = auth.uid() 
    OR id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
  );

CREATE POLICY "groups_write_owner" ON public.groups
  FOR ALL
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Group members policies
CREATE POLICY "group_members_manage" ON public.group_members
  FOR ALL
  USING (
    group_id IN (SELECT id FROM public.groups WHERE owner_id = auth.uid()) 
    OR user_id = auth.uid()
  )
  WITH CHECK (
    user_id = auth.uid() 
    OR group_id IN (SELECT id FROM public.groups WHERE owner_id = auth.uid())
  );

-- Shared events policies
CREATE POLICY "shared_events_owner_or_target" ON public.shared_events
  FOR ALL
  USING (
    shared_with = auth.uid() 
    OR event_id IN (SELECT id FROM public.events WHERE user_id = auth.uid())
  )
  WITH CHECK (
    event_id IN (SELECT id FROM public.events WHERE user_id = auth.uid()) 
    OR shared_with = auth.uid()
  );

-- Premium subscriptions policies
CREATE POLICY "premium_owner" ON public.premium_subscriptions
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Geo reminders policies
CREATE POLICY "geo_owner" ON public.geo_reminders
  FOR ALL
  USING (event_id IN (SELECT id FROM public.events WHERE user_id = auth.uid()))
  WITH CHECK (event_id IN (SELECT id FROM public.events WHERE user_id = auth.uid()));

-- Secure files policies
CREATE POLICY "secure_files_owner" ON public.secure_files
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Notifications logs policies
CREATE POLICY "notifications_owner" ON public.notifications_logs
  FOR SELECT
  USING (user_id = auth.uid());

-- Event assignments policies
CREATE POLICY "event_assignments_owner_or_assignee" ON public.event_assignments
  FOR ALL
  USING (
    assigned_to_user = auth.uid()
    OR assigned_to_group IN (
      SELECT group_id FROM public.group_members WHERE user_id = auth.uid()
    )
    OR event_id IN (SELECT id FROM public.events WHERE user_id = auth.uid())
  )
  WITH CHECK (
    event_id IN (SELECT id FROM public.events WHERE user_id = auth.uid()) 
    OR assigned_to_user = auth.uid()
  );

-- Push tokens policies
CREATE POLICY "push_tokens_owner" ON public.user_push_tokens
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ---------- VIEWS ----------

-- View: upcoming reminders for the user
CREATE OR REPLACE VIEW public.user_upcoming_reminders AS
SELECT 
  r.id AS reminder_id, 
  r.event_id, 
  e.title, 
  e.date_time, 
  r.scheduled_at, 
  r.status, 
  e.user_id
FROM public.reminders r
JOIN public.events e ON e.id = r.event_id
WHERE r.scheduled_at >= now()
  AND r.status = 'pending';

-- View: user statistics
CREATE OR REPLACE VIEW public.user_statistics AS
SELECT 
  e.user_id,
  COUNT(DISTINCT e.id) AS total_events,
  COUNT(DISTINCT CASE WHEN e.status = 'done' THEN e.id END) AS completed_events,
  COUNT(DISTINCT CASE WHEN e.status = 'pending' THEN e.id END) AS pending_events,
  COUNT(DISTINCT r.id) AS total_reminders,
  COUNT(DISTINCT CASE WHEN r.status = 'sent' THEN r.id END) AS sent_reminders,
  COUNT(DISTINCT CASE WHEN r.status = 'failed' THEN r.id END) AS failed_reminders
FROM public.events e
LEFT JOIN public.reminders r ON r.event_id = e.id
GROUP BY e.user_id;

-- View: events with categories
CREATE OR REPLACE VIEW public.events_with_categories AS
SELECT 
  e.*,
  c.name AS category_name,
  c.icon AS category_icon,
  c.color AS category_color
FROM public.events e
LEFT JOIN public.categories c ON c.id = e.category_id;

-- View: group members with user info
CREATE OR REPLACE VIEW public.group_members_with_users AS
SELECT 
  gm.*,
  u.email AS user_email
FROM public.group_members gm
JOIN auth.users u ON u.id = gm.user_id;

-- ---------- FUNCTIONS ----------

-- Function to check if user is premium
CREATE OR REPLACE FUNCTION public.is_user_premium(user_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.premium_subscriptions 
    WHERE user_id = user_uuid 
      AND is_active = true 
      AND (end_at IS NULL OR end_at > now())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's active reminders count
CREATE OR REPLACE FUNCTION public.get_user_active_reminders_count(user_uuid uuid)
RETURNS integer AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::integer
    FROM public.reminders r
    JOIN public.events e ON e.id = r.event_id
    WHERE e.user_id = user_uuid
      AND r.status = 'pending'
      AND r.scheduled_at > now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check reminder limit (20 for free, unlimited for premium)
CREATE OR REPLACE FUNCTION public.can_create_reminder(user_uuid uuid)
RETURNS boolean AS $$
DECLARE
  is_premium boolean;
  active_count integer;
BEGIN
  is_premium := public.is_user_premium(user_uuid);
  
  IF is_premium THEN
    RETURN true;
  END IF;
  
  active_count := public.get_user_active_reminders_count(user_uuid);
  RETURN active_count < 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get events in date range
CREATE OR REPLACE FUNCTION public.get_events_in_range(
  user_uuid uuid,
  start_date timestamptz,
  end_date timestamptz
)
RETURNS TABLE (
  id uuid,
  title text,
  date_time timestamptz,
  status text,
  category_name text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.title,
    e.date_time,
    e.status,
    c.name AS category_name
  FROM public.events e
  LEFT JOIN public.categories c ON c.id = e.category_id
  WHERE e.user_id = user_uuid
    AND e.date_time >= start_date
    AND e.date_time <= end_date
  ORDER BY e.date_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old notification logs (older than 90 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_notification_logs()
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.notifications_logs
  WHERE sent_at < now() - INTERVAL '90 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------- COMMENTS ----------

COMMENT ON TABLE public.categories IS 'Catégories d''événements personnalisables par utilisateur';
COMMENT ON TABLE public.events IS 'Événements et rappels principaux';
COMMENT ON TABLE public.reminders IS 'Rappels programmés pour les événements';
COMMENT ON TABLE public.attachments IS 'Pièces jointes associées aux événements';
COMMENT ON TABLE public.voice_notes IS 'Notes vocales pour les événements';
COMMENT ON TABLE public.groups IS 'Groupes collaboratifs';
COMMENT ON TABLE public.group_members IS 'Membres des groupes';
COMMENT ON TABLE public.shared_events IS 'Événements partagés entre utilisateurs';
COMMENT ON TABLE public.premium_subscriptions IS 'Abonnements Premium';
COMMENT ON TABLE public.geo_reminders IS 'Rappels géolocalisés (Premium)';
COMMENT ON TABLE public.secure_files IS 'Fichiers sécurisés dans le coffre-fort (Premium)';
COMMENT ON TABLE public.notifications_logs IS 'Logs des notifications envoyées';
COMMENT ON TABLE public.event_assignments IS 'Assignation d''événements à des groupes ou utilisateurs';
COMMENT ON TABLE public.user_push_tokens IS 'Tokens push pour les notifications';
