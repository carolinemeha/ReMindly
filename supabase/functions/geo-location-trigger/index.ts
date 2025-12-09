// Edge Function pour déclencher les rappels géolocalisés
// Cette fonction doit être appelée périodiquement ou via un webhook de localisation

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Fonction pour calculer la distance entre deux points (formule de Haversine)
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Rayon de la Terre en mètres
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { userId, latitude, longitude } = await req.json();

    if (!userId || latitude === undefined || longitude === undefined) {
      return new Response(
        JSON.stringify({ error: 'userId, latitude et longitude requis' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Récupérer tous les rappels géolocalisés actifs pour cet utilisateur
    const { data: geoReminders, error: geoError } = await supabaseClient
      .from('geo_reminders')
      .select(`
        *,
        event:events!inner(
          id,
          title,
          description,
          user_id,
          status
        )
      `)
      .eq('event.user_id', userId)
      .eq('event.status', 'pending');

    if (geoError) throw geoError;

    if (!geoReminders || geoReminders.length === 0) {
      return new Response(
        JSON.stringify({ message: 'Aucun rappel géolocalisé trouvé' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    let triggeredCount = 0;

    // Vérifier chaque rappel géolocalisé
    for (const geoReminder of geoReminders) {
      const distance = calculateDistance(
        latitude,
        longitude,
        geoReminder.latitude,
        geoReminder.longitude
      );

      const isWithinRadius = distance <= geoReminder.radius_meters;
      const shouldTrigger =
        (geoReminder.trigger_on === 'enter' && isWithinRadius) ||
        (geoReminder.trigger_on === 'exit' && !isWithinRadius);

      if (shouldTrigger) {
        // Récupérer les tokens push
        const { data: tokens } = await supabaseClient
          .from('user_push_tokens')
          .select('token, platform')
          .eq('user_id', userId);

        // Envoyer la notification
        if (tokens && tokens.length > 0) {
          const event = geoReminder.event;
          const notificationTitle = `📍 ${event.title}`;
          const notificationBody = `Vous êtes ${geoReminder.trigger_on === 'enter' ? 'arrivé' : 'parti'} de la zone`;

          const notifications = tokens.map((tokenData) =>
            fetch('https://exp.host/--/api/v2/push/send', {
              method: 'POST',
              headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                to: tokenData.token,
                sound: 'default',
                title: notificationTitle,
                body: notificationBody,
                data: {
                  eventId: event.id,
                  geoReminderId: geoReminder.id,
                  type: 'geo_reminder',
                },
                priority: 'high',
              }),
            })
          );

          await Promise.allSettled(notifications);

          // Logger
          await supabaseClient.from('notifications_logs').insert({
            user_id: userId,
            channel: 'push',
            success: true,
            payload: {
              title: notificationTitle,
              body: notificationBody,
              event_id: event.id,
              geo_reminder_id: geoReminder.id,
            },
          });

          triggeredCount++;
        }
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Vérification géolocalisée terminée',
        triggered: triggeredCount,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

