// Edge Function Supabase pour envoyer les rappels automatiquement
// Déployer avec: supabase functions deploy send-reminders

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Gérer les requêtes OPTIONS pour CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Créer un client Supabase avec les clés de service
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

    // Récupérer les rappels à envoyer (scheduled_at <= maintenant et status = 'pending')
    const now = new Date().toISOString();
    const { data: reminders, error: remindersError } = await supabaseClient
      .from('reminders')
      .select(`
        *,
        event:events!inner(
          id,
          title,
          description,
          date_time,
          user_id,
          user:users!inner(
            id,
            email
          )
        )
      `)
      .eq('status', 'pending')
      .lte('scheduled_at', now);

    if (remindersError) {
      throw remindersError;
    }

    if (!reminders || reminders.length === 0) {
      return new Response(
        JSON.stringify({ message: 'Aucun rappel à envoyer', count: 0 }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Récupérer les tokens push des utilisateurs
    const userIds = [...new Set(reminders.map((r) => r.event.user_id))];
    const { data: pushTokens, error: tokensError } = await supabaseClient
      .from('user_push_tokens')
      .select('user_id, token, platform')
      .in('user_id', userIds);

    if (tokensError) {
      console.error('Erreur lors de la récupération des tokens push:', tokensError);
    }

    // Créer un map des tokens par utilisateur
    const tokensByUser = new Map<string, { token: string; platform: string }[]>();
    pushTokens?.forEach((pt) => {
      if (!tokensByUser.has(pt.user_id)) {
        tokensByUser.set(pt.user_id, []);
      }
      tokensByUser.get(pt.user_id)?.push({ token: pt.token, platform: pt.platform });
    });

    let sentCount = 0;
    let failedCount = 0;

    // Envoyer les notifications pour chaque rappel
    for (const reminder of reminders) {
      try {
        const event = reminder.event;
        const tokens = tokensByUser.get(event.user_id) || [];

        // Préparer le message de notification
        const notificationTitle = `Rappel: ${event.title}`;
        const notificationBody = event.description
          ? event.description.substring(0, 100)
          : `Événement prévu le ${new Date(event.date_time).toLocaleString('fr-FR')}`;

        // Envoyer les notifications push via Expo
        const notifications = tokens.map((tokenData) =>
          fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Accept-Encoding': 'gzip, deflate',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to: tokenData.token,
              sound: 'default',
              title: notificationTitle,
              body: notificationBody,
              data: {
                eventId: event.id,
                reminderId: reminder.id,
                type: 'reminder',
              },
              priority: 'high',
            }),
          })
        );

        const results = await Promise.allSettled(notifications);
        const success = results.some((r) => r.status === 'fulfilled');

        // Mettre à jour le statut du rappel
        await supabaseClient
          .from('reminders')
          .update({ status: success ? 'sent' : 'failed' })
          .eq('id', reminder.id);

        // Logger la notification
        await supabaseClient.from('notifications_logs').insert({
          reminder_id: reminder.id,
          user_id: event.user_id,
          channel: 'push',
          success,
          payload: {
            title: notificationTitle,
            body: notificationBody,
            event_id: event.id,
          },
        });

        if (success) {
          sentCount++;
        } else {
          failedCount++;
        }
      } catch (error) {
        console.error(`Erreur lors de l'envoi du rappel ${reminder.id}:`, error);
        failedCount++;

        // Marquer comme échoué
        await supabaseClient
          .from('reminders')
          .update({ status: 'failed' })
          .eq('id', reminder.id);
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Rappels traités',
        total: reminders.length,
        sent: sentCount,
        failed: failedCount,
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

