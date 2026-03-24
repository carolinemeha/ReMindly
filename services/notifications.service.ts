import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// Configuration des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationsService {
  private expoPushToken: string | null = null;

  async registerForPushNotifications() {
    if (!Device.isDevice) {
      console.warn('Les notifications push ne fonctionnent que sur un appareil physique');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Permission de notification refusée');
      return null;
    }

    // Récupérer le projectId Expo (EAS Project ID)
    // Le projectId peut être dans extra.eas.projectId ou extra.projectId
    let projectId: string | undefined = 
      Constants.expoConfig?.extra?.eas?.projectId || 
      Constants.expoConfig?.eas?.projectId ||
      Constants.expoConfig?.extra?.projectId;

    // Nettoyer le projectId si c'est une variable d'environnement non résolue
    if (projectId && (projectId.startsWith('${') || projectId.startsWith('$'))) {
      projectId = undefined;
    }

    // Essayer d'obtenir le token avec ou sans projectId
    let tokenData;
    try {
      if (projectId && projectId.length > 0) {
        // Valider que c'est un UUID valide (format Expo Project ID)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(projectId)) {
          tokenData = await Notifications.getExpoPushTokenAsync({
            projectId: projectId,
          });
        } else {
          console.warn('ProjectId invalide (doit être un UUID):', projectId);
          // Essayer sans projectId - Expo essaiera de le détecter depuis le manifest
          tokenData = await Notifications.getExpoPushTokenAsync();
        }
      } else {
        // Essayer sans projectId - Expo essaiera de le détecter depuis le manifest
        // Note: Cela peut échouer si le projectId n'est pas dans le manifest
        tokenData = await Notifications.getExpoPushTokenAsync();
      }
    } catch (error: any) {
      const msg = String(error?.message ?? error);
      // Si l'erreur est liée au projectId manquant, on logue un avertissement
      // mais on ne bloque pas l'application
      if (msg.includes('projectId') || msg.includes("No 'projectId'")) {
        console.warn(
          '⚠️ ProjectId Expo manquant. Les notifications push peuvent ne pas fonctionner.\n' +
          'Pour activer les notifications push, configurez votre Expo Project ID dans app.json:\n' +
          '  "extra": {\n' +
          '    "eas": {\n' +
          '      "projectId": "votre-project-id-uuid"\n' +
          '    }\n' +
          '  }\n' +
          'Vous pouvez obtenir votre Project ID via: eas project:info'
        );
        return null;
      }
      // Réseau indisponible ou Expo injoignable (simulateur, pare-feu, etc.)
      if (msg.includes('Network request failed')) {
        console.warn(
          'Notifications push : impossible de joindre les serveurs Expo (réseau). Réessayez plus tard ou vérifiez la connexion.'
        );
        return null;
      }
      console.error('Erreur lors de la récupération du token Expo Push:', error);
      throw error;
    }

    this.expoPushToken = tokenData.data;

    // Enregistrer le token dans Supabase
    await this.savePushToken(tokenData.data);

    // Configuration Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#E6F4FE',
      });
    }

    return tokenData.data;
  }

  async scheduleLocalNotification(
    title: string,
    body: string,
    trigger: Date | number
  ) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: trigger instanceof Date ? trigger : { seconds: trigger },
    });
  }

  async cancelNotification(identifier: string) {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  }

  async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  async getScheduledNotifications() {
    return await Notifications.getAllScheduledNotificationsAsync();
  }

  private async savePushToken(token: string) {
    if (!isSupabaseConfigured) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Mettre à jour le token push dans la table dédiée
    const { error } = await supabase
      .from('user_push_tokens')
      .upsert({
        user_id: user.id,
        token,
        platform: Platform.OS,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,platform',
      });

    if (error) {
      console.error('Erreur lors de la sauvegarde du token push:', error);
      // Si la table n'existe pas encore, on ignore l'erreur
      if (error.code !== '42P01') { // 42P01 = table does not exist
        throw error;
      }
    }
  }

  getExpoPushToken() {
    return this.expoPushToken;
  }

  // Écouter les notifications reçues
  addNotificationReceivedListener(
    listener: (notification: Notifications.Notification) => void
  ) {
    return Notifications.addNotificationReceivedListener(listener);
  }

  // Écouter les interactions avec les notifications
  addNotificationResponseReceivedListener(
    listener: (response: Notifications.NotificationResponse) => void
  ) {
    return Notifications.addNotificationResponseReceivedListener(listener);
  }
}

export const notificationsService = new NotificationsService();

