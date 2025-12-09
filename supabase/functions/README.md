# Edge Functions Supabase pour ReMindly

Ce dossier contient les Edge Functions Supabase pour automatiser les rappels.

## Installation

1. Installer Supabase CLI :
```bash
npm install -g supabase
```

2. Se connecter à Supabase :
```bash
supabase login
```

3. Lier le projet :
```bash
supabase link --project-ref your-project-ref
```

## Déploiement

### Fonction send-reminders

Cette fonction envoie automatiquement les rappels programmés.

```bash
supabase functions deploy send-reminders
```

### Fonction geo-location-trigger

Cette fonction déclenche les rappels géolocalisés.

```bash
supabase functions deploy geo-location-trigger
```

## Configuration Cron

Pour exécuter automatiquement `send-reminders`, configurez un cron job dans Supabase :

1. Allez dans Dashboard > Database > Cron Jobs
2. Créez un nouveau cron job :
   - Nom : `send_reminders_cron`
   - Schedule : `* * * * *` (toutes les minutes)
   - SQL : 
   ```sql
   SELECT net.http_post(
     url := 'https://your-project-ref.supabase.co/functions/v1/send-reminders',
     headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
     body := '{}'::jsonb
   );
   ```

## Variables d'environnement

Les fonctions utilisent automatiquement les variables d'environnement Supabase :
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Ces variables sont automatiquement disponibles dans les Edge Functions.

## Test local

```bash
supabase functions serve send-reminders
```

Puis testez avec :
```bash
curl -i --location --request POST 'http://localhost:54321/functions/v1/send-reminders' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{}'
```

