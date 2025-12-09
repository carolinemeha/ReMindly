# Configuration de la base de données Supabase pour ReMindly

Ce dossier contient tous les scripts SQL nécessaires pour configurer la base de données Supabase.

## 📋 Étapes d'installation

### 1. Créer le schéma de base de données

1. Ouvrez votre projet Supabase
2. Allez dans **SQL Editor**
3. Copiez et exécutez le contenu de `schema.sql`
4. Vérifiez qu'il n'y a pas d'erreurs

### 2. Créer les buckets de stockage

1. Allez dans **Storage** dans le menu Supabase
2. Créez deux buckets :

   **Bucket 1: `attachments`**
   - Nom : `attachments`
   - Public : ✅ Oui (pour permettre l'accès aux fichiers)
   - File size limit : 50 MB (ou selon vos besoins)
   - Allowed MIME types : `image/*,application/pdf,video/*,audio/*`

   **Bucket 2: `secure_files`**
   - Nom : `secure_files`
   - Public : ❌ Non (privé, pour les fichiers Premium)
   - File size limit : 100 MB
   - Allowed MIME types : `*/*`

### 3. Configurer les politiques de stockage

1. Allez dans **Storage** > **Policies**
2. Exécutez le contenu de `storage-policies.sql` dans le **SQL Editor**
3. Vérifiez que les politiques sont créées pour les deux buckets

### 4. Ajouter les fonctions utilitaires (optionnel mais recommandé)

1. Exécutez le contenu de `functions.sql` dans le **SQL Editor**
2. Ces fonctions ajoutent des fonctionnalités utiles comme :
   - Recherche d'événements
   - Statistiques utilisateur
   - Duplication d'événements
   - Gestion des groupes

### 5. Vérifier les Edge Functions (optionnel)

Les Edge Functions sont dans le dossier `functions/`. Pour les déployer :

```bash
# Installer Supabase CLI
npm install -g supabase

# Se connecter
supabase login

# Lier le projet
supabase link --project-ref your-project-ref

# Déployer les fonctions
supabase functions deploy send-reminders
supabase functions deploy geo-location-trigger
```

## 🔍 Vérification

Après l'installation, vérifiez que :

1. ✅ Toutes les tables sont créées (14 tables)
2. ✅ Toutes les politiques RLS sont actives
3. ✅ Les deux buckets de stockage existent
4. ✅ Les politiques de stockage sont configurées
5. ✅ Les fonctions et triggers sont créés
6. ✅ Les vues sont créées

## 📊 Tables créées

- `categories` - Catégories d'événements
- `events` - Événements principaux
- `reminders` - Rappels programmés
- `attachments` - Pièces jointes
- `voice_notes` - Notes vocales
- `groups` - Groupes collaboratifs
- `group_members` - Membres des groupes
- `shared_events` - Événements partagés
- `premium_subscriptions` - Abonnements Premium
- `geo_reminders` - Rappels géolocalisés
- `secure_files` - Fichiers sécurisés
- `notifications_logs` - Logs des notifications
- `event_assignments` - Assignations d'événements
- `user_push_tokens` - Tokens push

## 🔐 Sécurité

- **Row Level Security (RLS)** : Activé sur toutes les tables
- **Politiques de stockage** : Configurées pour les buckets
- **Validation des données** : Contraintes CHECK sur les colonnes importantes
- **Index** : Optimisés pour les requêtes fréquentes

## 🎯 Fonctionnalités automatiques

- **Catégories par défaut** : Créées automatiquement pour chaque nouvel utilisateur (Réunion, Paiement, Rendez-vous, Vaccination, Anniversaire, Autres)
- **Calcul automatique** : `scheduled_at` calculé automatiquement pour les rappels
- **Mise à jour automatique** : `updated_at` mis à jour automatiquement
- **Validation des données** : Contraintes CHECK sur les colonnes importantes
- **Index optimisés** : Index sur toutes les colonnes fréquemment utilisées

## 🔧 Fonctions utilitaires disponibles

Après avoir exécuté `functions.sql`, vous avez accès à :

- `is_user_premium(user_uuid)` : Vérifie si un utilisateur a un abonnement Premium actif
- `can_create_reminder(user_uuid)` : Vérifie si un utilisateur peut créer un rappel (limite de 20 pour les gratuits)
- `get_user_active_reminders_count(user_uuid)` : Compte les rappels actifs d'un utilisateur
- `get_events_in_range(user_uuid, start_date, end_date)` : Récupère les événements dans une plage de dates
- `search_events(user_uuid, search_term, ...)` : Recherche d'événements avec filtres
- `get_upcoming_events(user_uuid, limit)` : Récupère les prochains événements
- `duplicate_event(event_uuid, new_date)` : Duplique un événement à une nouvelle date
- `get_group_stats(group_uuid)` : Statistiques d'un groupe
- `cleanup_old_notification_logs()` : Nettoie les logs de plus de 90 jours

## 📝 Notes importantes

1. Les catégories par défaut sont créées automatiquement via un trigger après l'inscription d'un utilisateur
2. La limite de 20 rappels actifs pour les utilisateurs gratuits est gérée par la fonction `can_create_reminder()`
3. Les fichiers Premium nécessitent un abonnement actif
4. Les logs de notifications sont conservés pendant 90 jours (fonction de nettoyage disponible)

## 🐛 Dépannage

### Erreur : "relation already exists"
Si vous avez déjà exécuté le script, utilisez `DROP TABLE IF EXISTS` ou supprimez les tables manuellement.

### Erreur : "permission denied"
Vérifiez que vous êtes connecté en tant qu'administrateur du projet Supabase.

### Les catégories par défaut ne sont pas créées
Vérifiez que le trigger `trg_create_default_categories` est actif sur la table `auth.users`.

## 🔄 Mise à jour

Pour mettre à jour le schéma :

1. Sauvegardez vos données
2. Exécutez les nouvelles migrations dans `schema.sql`
3. Vérifiez que tout fonctionne correctement

