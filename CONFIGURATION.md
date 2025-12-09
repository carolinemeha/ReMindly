# 🔑 Configuration des Variables d'Environnement

## Problème : "Invalid supabaseUrl"

Si vous voyez l'erreur `Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL`, cela signifie que les variables d'environnement Supabase ne sont pas configurées.

## Solution rapide

### 1. Créer le fichier `.env`

Créez un fichier nommé `.env` à la racine du projet (dans le dossier `ReMindly/`, à côté de `package.json`).

### 2. Ajouter vos identifiants Supabase

Ouvrez le fichier `.env` et ajoutez :

```env
EXPO_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=votre-clé-anon-ici
EXPO_PUBLIC_PROJECT_ID=votre-project-id
```

### 3. Où trouver ces valeurs ?

1. **Connectez-vous à Supabase** : https://supabase.com
2. **Sélectionnez votre projet** (ou créez-en un nouveau)
3. **Allez dans Settings** (⚙️) > **API**
4. **Copiez les valeurs** :
   - **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - **Project ID** → `EXPO_PUBLIC_PROJECT_ID` (optionnel)

### 4. Exemple de fichier `.env`

```env
EXPO_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EXPO_PUBLIC_PROJECT_ID=abcdefghijklmnop
```

### 5. Redémarrer Expo

Après avoir créé le fichier `.env`, **redémarrez Expo** :

```bash
# Arrêtez le serveur (Ctrl+C)
# Puis relancez :
npx expo start --clear
```

Le flag `--clear` vide le cache pour s'assurer que les nouvelles variables sont chargées.

## ⚠️ Important

- **Ne commitez JAMAIS** le fichier `.env` dans Git (il est déjà dans `.gitignore`)
- **Ne partagez JAMAIS** vos clés Supabase publiquement
- La clé `anon/public` est publique et peut être utilisée côté client, mais ne la partagez quand même pas

## 🔍 Vérification

Si tout est bien configuré, vous ne devriez plus voir l'erreur `Invalid supabaseUrl` et l'application devrait démarrer correctement.

## 📚 Documentation complète

Pour plus de détails sur la configuration complète de Supabase, consultez `INSTALLATION.md`.

