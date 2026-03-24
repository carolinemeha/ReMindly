import 'react-native-url-polyfill/auto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Récupérer les clés depuis les variables d'environnement
// Pour le développement, vous pouvez les définir dans app.json ou un fichier .env
const supabaseUrl = 
  Constants.expoConfig?.extra?.supabaseUrl || 
  process.env.EXPO_PUBLIC_SUPABASE_URL || 
  '';

const supabaseAnonKey = 
  Constants.expoConfig?.extra?.supabaseAnonKey || 
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
  '';

function isValidHttpUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  try {
    const u = new URL(trimmed);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

/** Évite les appels réseau inutiles quand .env / app.json ne sont pas renseignés. */
export const isSupabaseConfigured =
  isValidHttpUrl(supabaseUrl) && Boolean(supabaseAnonKey.trim());

if (!isSupabaseConfigured) {
  console.warn('⚠️ Supabase URL ou clé manquante / invalide. Veuillez configurer les variables d\'environnement.');
  console.warn('Utilisez EXPO_PUBLIC_SUPABASE_URL (URL https) et EXPO_PUBLIC_SUPABASE_ANON_KEY dans .env ou app.json.');
}

// Créer le client Supabase avec AsyncStorage pour la persistance
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
  db: {
    schema: 'public',
  },
});

// Exporter les types depuis le fichier de types généré
export type { Database } from './supabase.types';

