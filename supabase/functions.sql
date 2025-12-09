-- Fonctions utilitaires supplémentaires pour ReMindly

-- Function to get users by emails (for group invitations)
-- Note: Cette fonction nécessite des permissions spéciales car elle accède à auth.users
CREATE OR REPLACE FUNCTION public.get_users_by_emails(emails text[])
RETURNS TABLE (
  id uuid,
  email text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email::text
  FROM auth.users u
  WHERE u.email = ANY(emails);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user profile information
CREATE OR REPLACE FUNCTION public.get_user_profile(user_uuid uuid)
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamptz,
  total_events bigint,
  total_groups bigint,
  is_premium boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email::text,
    u.created_at,
    (SELECT COUNT(*) FROM public.events WHERE user_id = user_uuid)::bigint AS total_events,
    (SELECT COUNT(*) FROM public.group_members WHERE user_id = user_uuid)::bigint AS total_groups,
    public.is_user_premium(user_uuid) AS is_premium;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search events
CREATE OR REPLACE FUNCTION public.search_events(
  user_uuid uuid,
  search_term text,
  category_id_filter uuid DEFAULT NULL,
  start_date_filter timestamptz DEFAULT NULL,
  end_date_filter timestamptz DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  date_time timestamptz,
  category_name text,
  status text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.title,
    e.description,
    e.date_time,
    c.name AS category_name,
    e.status
  FROM public.events e
  LEFT JOIN public.categories c ON c.id = e.category_id
  WHERE e.user_id = user_uuid
    AND (
      e.title ILIKE '%' || search_term || '%'
      OR e.description ILIKE '%' || search_term || '%'
      OR e.location ILIKE '%' || search_term || '%'
    )
    AND (category_id_filter IS NULL OR e.category_id = category_id_filter)
    AND (start_date_filter IS NULL OR e.date_time >= start_date_filter)
    AND (end_date_filter IS NULL OR e.date_time <= end_date_filter)
  ORDER BY e.date_time DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get upcoming events for a user
CREATE OR REPLACE FUNCTION public.get_upcoming_events(
  user_uuid uuid,
  limit_count integer DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  title text,
  date_time timestamptz,
  category_name text,
  location text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.title,
    e.date_time,
    c.name AS category_name,
    e.location
  FROM public.events e
  LEFT JOIN public.categories c ON c.id = e.category_id
  WHERE e.user_id = user_uuid
    AND e.status = 'pending'
    AND e.date_time >= now()
  ORDER BY e.date_time ASC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get events by date range with statistics
CREATE OR REPLACE FUNCTION public.get_events_with_stats(
  user_uuid uuid,
  start_date timestamptz,
  end_date timestamptz
)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'events', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', e.id,
          'title', e.title,
          'date_time', e.date_time,
          'status', e.status,
          'category', jsonb_build_object(
            'id', c.id,
            'name', c.name,
            'color', c.color
          )
        )
      )
      FROM public.events e
      LEFT JOIN public.categories c ON c.id = e.category_id
      WHERE e.user_id = user_uuid
        AND e.date_time >= start_date
        AND e.date_time <= end_date
    ),
    'statistics', jsonb_build_object(
      'total', COUNT(*),
      'completed', COUNT(*) FILTER (WHERE status = 'done'),
      'pending', COUNT(*) FILTER (WHERE status = 'pending'),
      'cancelled', COUNT(*) FILTER (WHERE status = 'cancelled')
    )
  ) INTO result
  FROM public.events
  WHERE user_id = user_uuid
    AND date_time >= start_date
    AND date_time <= end_date;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to duplicate an event (useful for recurring events)
CREATE OR REPLACE FUNCTION public.duplicate_event(
  event_uuid uuid,
  new_date timestamptz
)
RETURNS uuid AS $$
DECLARE
  new_event_id uuid;
  old_event record;
BEGIN
  -- Get the original event
  SELECT * INTO old_event
  FROM public.events
  WHERE id = event_uuid;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event not found';
  END IF;
  
  -- Create new event
  INSERT INTO public.events (
    user_id,
    category_id,
    title,
    description,
    date_time,
    location,
    repeat_type,
    status,
    is_public
  ) VALUES (
    old_event.user_id,
    old_event.category_id,
    old_event.title || ' (Copie)',
    old_event.description,
    new_date,
    old_event.location,
    'none', -- Reset repeat_type for duplicated event
    'pending',
    old_event.is_public
  ) RETURNING id INTO new_event_id;
  
  -- Copy reminders
  INSERT INTO public.reminders (event_id, remind_before, scheduled_at, status)
  SELECT 
    new_event_id,
    remind_before,
    new_date - remind_before,
    'pending'
  FROM public.reminders
  WHERE event_id = event_uuid;
  
  RETURN new_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get group statistics
CREATE OR REPLACE FUNCTION public.get_group_stats(group_uuid uuid)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'group_id', g.id,
    'group_name', g.name,
    'member_count', (
      SELECT COUNT(*) FROM public.group_members WHERE group_id = group_uuid
    ),
    'event_count', (
      SELECT COUNT(*) 
      FROM public.event_assignments 
      WHERE assigned_to_group = group_uuid
    ),
    'members', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'user_id', gm.user_id,
          'role', gm.role,
          'joined_at', gm.joined_at
        )
      )
      FROM public.group_members gm
      WHERE gm.group_id = group_uuid
    )
  ) INTO result
  FROM public.groups g
  WHERE g.id = group_uuid;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

