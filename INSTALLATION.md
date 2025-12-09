# Guide d'installation complet - ReMindly

## 🔑 Étape 0 : Configuration des variables d'environnement

**IMPORTANT** : Avant de démarrer l'application, vous devez configurer vos identifiants Supabase.

1. Créez un fichier `.env` à la racine du projet (à côté de `package.json`)
2. Ajoutez vos identifiants Supabase :

```env
EXPO_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=votre-clé-anon-ici
EXPO_PUBLIC_PROJECT_ID=votre-project-id
```

**Où trouver ces valeurs :**
- Connectez-vous à votre projet Supabase
- Allez dans **Settings** > **API**
- **Project URL** = `EXPO_PUBLIC_SUPABASE_URL`
- **anon/public key** = `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- **Project ID** = `EXPO_PUBLIC_PROJECT_ID` (optionnel)

⚠️ **Sécurité** : Ne commitez JAMAIS le fichier `.env` dans Git ! Il est déjà dans `.gitignore`.

## 📋 Ordre d'exécution des scripts SQL

⚠️ **IMPORTANT** : Exécutez uniquement les fichiers `.sql` dans Supabase, pas les fichiers `.ts` (TypeScript) !

### Étape 1 : Créer le schéma de base de données

1. Ouvrez votre projet Supabase
2. Allez dans **SQL Editor** (dans le menu de gauche)
3. Cliquez sur **New Query**
4. Ouvrez le fichier `supabase/schema.sql` depuis votre projet
5. **Copiez TOUT le contenu** du fichier
6. **Collez-le** dans l'éditeur SQL de Supabase
7. Cliquez sur **Run** (ou appuyez sur Ctrl+Enter)
8. Vérifiez qu'il n'y a pas d'erreurs

✅ **Résultat attendu** : Toutes les tables, index, triggers et politiques RLS sont créés.

### Étape 2 : Créer les buckets de stockage

1. Allez dans **Storage** (dans le menu de gauche de Supabase)
2. Cliquez sur **New bucket**

**Bucket 1 : `attachments`**
- **Name** : `attachments`
- **Public bucket** : ✅ **Oui** (cochez cette case)
- **File size limit** : 50 MB (ou selon vos besoins)
- **Allowed MIME types** : `image/*,application/pdf,video/*,audio/*`
- Cliquez sur **Create bucket**

**Bucket 2 : `secure_files`**
- **Name** : `secure_files`
- **Public bucket** : ❌ **Non** (ne cochez PAS cette case)
- **File size limit** : 100 MB
- **Allowed MIME types** : `*/*`
- Cliquez sur **Create bucket**

### Étape 3 : Configurer les politiques de stockage

1. Retournez dans **SQL Editor**
2. Ouvrez le fichier `supabase/storage-policies.sql`
3. **Copiez TOUT le contenu** du fichier
4. **Collez-le** dans l'éditeur SQL de Supabase
5. Cliquez sur **Run**
6. Vérifiez qu'il n'y a pas d'erreurs

✅ **Résultat attendu** : Les politiques de stockage sont créées pour les deux buckets.

### Étape 4 : Ajouter les fonctions utilitaires (optionnel mais recommandé)

1. Dans **SQL Editor**
2. Ouvrez le fichier `supabase/functions.sql`
3. **Copiez TOUT le contenu** du fichier
4. **Collez-le** dans l'éditeur SQL de Supabase
5. Cliquez sur **Run**
6. Vérifiez qu'il n'y a pas d'erreurs

✅ **Résultat attendu** : Toutes les fonctions utilitaires sont créées.

## 🔍 Vérification

Après avoir exécuté tous les scripts, vérifiez que :

### Tables créées
1. Allez dans **Table Editor** dans Supabase
2. Vous devriez voir 14 tables :
   - categories
   - events
   - reminders
   - attachments
   - voice_notes
   - groups
   - group_members
   - shared_events
   - premium_subscriptions
   - geo_reminders
   - secure_files
   - notifications_logs
   - event_assignments
   - user_push_tokens

### Buckets créés
1. Allez dans **Storage**
2. Vous devriez voir 2 buckets : `attachments` et `secure_files`

### Politiques RLS
1. Allez dans **Authentication** > **Policies**
2. Vérifiez que les politiques RLS sont actives sur toutes les tables

## ⚠️ Erreurs courantes

### Erreur : "syntax error at or near 'export'"
**Cause** : Vous essayez d'exécuter un fichier TypeScript (`.ts`) au lieu d'un fichier SQL (`.sql`)

**Solution** : 
- ❌ Ne pas exécuter `lib/supabase.types.ts` dans Supabase
- ✅ Exécuter uniquement les fichiers dans le dossier `supabase/` qui ont l'extension `.sql`

### Erreur : "relation already exists"
**Cause** : Vous avez déjà exécuté le script

**Solution** : 
- Soit supprimez les tables existantes manuellement
- Soit le script utilise `IF NOT EXISTS` et devrait ignorer les éléments existants

### Erreur : "permission denied"
**Cause** : Vous n'êtes pas connecté en tant qu'administrateur

**Solution** : 
- Vérifiez que vous êtes connecté avec un compte administrateur du projet Supabase

## 📝 Fichiers à NE PAS exécuter dans Supabase

Ces fichiers sont pour votre application React Native, pas pour Supabase :

- ❌ `lib/supabase.types.ts` - Types TypeScript
- ❌ `lib/supabase.ts` - Configuration client Supabase
- ❌ Tous les fichiers dans `services/` - Services JavaScript/TypeScript
- ❌ Tous les fichiers dans `stores/` - Stores Zustand
- ❌ Tous les fichiers dans `app/` - Écrans React Native

## ✅ Fichiers à exécuter dans Supabase (dans l'ordre)

1. ✅ `supabase/schema.sql` - **OBLIGATOIRE**
2. ✅ `supabase/storage-policies.sql` - **OBLIGATOIRE** (après création des buckets)
3. ✅ `supabase/functions.sql` - **RECOMMANDÉ** (fonctions utilitaires)

## 🚀 Après l'installation

Une fois la base de données configurée :

1. Configurez vos variables d'environnement dans `.env` :
   ```
   EXPO_PUBLIC_SUPABASE_URL=votre_url_supabase
   EXPO_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon
   ```

2. Installez les dépendances :
   ```bash
   npm install
   ```

3. Lancez l'application :
   ```bash
   npm start
   ```

## 📚 Documentation supplémentaire

Pour plus de détails, consultez :
- `supabase/README.md` - Documentation détaillée de la base de données
- `README.md` - Documentation générale du projet

