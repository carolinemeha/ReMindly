# ReMindly - Votre assistant intelligent de rappels et d'organisation

Application mobile React Native développée avec Expo pour planifier, organiser et recevoir des rappels automatiques.

## 🚀 Fonctionnalités

### Authentification
- Inscription et connexion via Supabase Auth
- Réinitialisation de mot de passe
- Gestion du profil utilisateur

### Gestion des événements
- Création, modification et suppression d'événements
- Catégories personnalisables (Réunion, Paiement, Rendez-vous, Vaccination, Anniversaire, etc.)
- Répétition (quotidien, hebdomadaire, mensuel, annuel)
- Rappels multiples (5 min, 15 min, 30 min, 1h, 1 jour avant)
- Localisation optionnelle

### Calendrier
- Vue calendrier avec événements marqués
- Filtres par date et catégorie
- Vue des événements à venir

### Notifications
- Notifications push automatiques
- Notifications locales programmées
- Support des rappels multiples

### Fonctionnalités Premium (à venir)
- Rappels illimités
- Rappels géolocalisés
- Coffre-fort chiffré
- Assistant IA
- Notifications SMS et Email
- Synchronisation multi-appareils

## 📋 Prérequis

- Node.js 18+ et npm/yarn
- Expo CLI (`npm install -g expo-cli`)
- Compte Supabase
- Expo Go (pour tester sur appareil mobile)

## 🛠 Installation

1. **Cloner le projet**
```bash
git clone <repository-url>
cd ReMindly
```

2. **Installer les dépendances**
```bash
npm install
# ou
yarn install
```

3. **Configurer les variables d'environnement**

Créez un fichier `.env` à la racine du projet :
```env
EXPO_PUBLIC_SUPABASE_URL=votre_url_supabase
EXPO_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon_supabase
EXPO_PUBLIC_PROJECT_ID=votre_project_id_expo
```

4. **Configurer Supabase**

Exécutez le script SQL fourni dans `supabase/schema.sql` dans votre projet Supabase pour créer toutes les tables nécessaires.

5. **Créer le bucket de stockage**

Dans Supabase Storage, créez un bucket nommé `attachments` avec les permissions appropriées.

6. **Lancer l'application**
```bash
npm start
# ou
yarn start
```

Puis scannez le QR code avec Expo Go (iOS) ou l'application Expo Go (Android).

## 📁 Structure du projet

```
ReMindly/
├── app/                    # Écrans et navigation (Expo Router)
│   ├── (auth)/            # Écrans d'authentification
│   ├── (tabs)/            # Écrans principaux (tabs)
│   └── events/            # Écrans de gestion d'événements
├── components/            # Composants réutilisables
├── lib/                   # Configuration et utilitaires
│   └── supabase.ts       # Client Supabase
├── services/              # Services métier
│   ├── auth.service.ts
│   ├── events.service.ts
│   └── notifications.service.ts
├── stores/                # Stores Zustand
│   ├── auth.store.ts
│   └── events.store.ts
├── types/                 # Types TypeScript
│   └── index.ts
└── assets/                # Images et ressources
```

## 🗄 Base de données

Le schéma de base de données est défini dans le fichier SQL fourni. Les principales tables sont :

- `categories` - Catégories d'événements
- `events` - Événements
- `reminders` - Rappels
- `attachments` - Pièces jointes
- `voice_notes` - Notes vocales
- `groups` - Groupes collaboratifs
- `premium_subscriptions` - Abonnements Premium
- `geo_reminders` - Rappels géolocalisés (Premium)
- `secure_files` - Fichiers sécurisés (Premium)

## 🔐 Sécurité

- Row Level Security (RLS) activé sur toutes les tables
- Authentification JWT via Supabase
- Chiffrement des données sensibles (Premium)
- Permissions granulaires par utilisateur

## 📱 Technologies utilisées

- **React Native** - Framework mobile
- **Expo** - Outils et services
- **Expo Router** - Navigation basée sur les fichiers
- **Supabase** - Backend (Auth, Database, Storage)
- **Zustand** - Gestion d'état
- **TypeScript** - Typage statique
- **date-fns** - Manipulation de dates
- **react-native-calendars** - Composant calendrier

## 🚧 Développement

### Scripts disponibles

```bash
npm start          # Démarrer le serveur de développement
npm run android    # Lancer sur Android
npm run ios        # Lancer sur iOS
npm run web        # Lancer sur web
npm run lint       # Vérifier le code
```

### Ajout de nouvelles fonctionnalités

1. Créer les types dans `types/index.ts`
2. Ajouter les services dans `services/`
3. Créer/mettre à jour les stores dans `stores/`
4. Créer les écrans dans `app/`
5. Ajouter les composants réutilisables dans `components/`

## 📝 TODO

- [ ] Implémenter les groupes collaboratifs
- [ ] Ajouter les rappels géolocalisés (Premium)
- [ ] Intégrer l'assistant IA
- [ ] Implémenter le coffre-fort sécurisé
- [ ] Ajouter les notifications SMS/Email
- [ ] Créer les Edge Functions Supabase
- [ ] Ajouter les statistiques utilisateur
- [ ] Implémenter les thèmes Premium

## 📄 Licence

Ce projet est sous licence MIT.

## 👥 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

## 📧 Support

Pour toute question ou problème, veuillez ouvrir une issue sur GitHub.
