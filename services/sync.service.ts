// Service de synchronisation pour gérer les conflits et la synchronisation offline
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SYNC_QUEUE_KEY = '@remindly:sync_queue';

interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: string;
  data: any;
  timestamp: number;
}

class SyncService {
  // Ajouter une opération à la file d'attente de synchronisation
  async queueOperation(operation: Omit<SyncOperation, 'id' | 'timestamp'>) {
    try {
      const queue = await this.getQueue();
      const newOperation: SyncOperation = {
        ...operation,
        id: `${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
      };
      queue.push(newOperation);
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('Erreur lors de l\'ajout à la file d\'attente:', error);
    }
  }

  // Récupérer la file d'attente
  async getQueue(): Promise<SyncOperation[]> {
    try {
      const queueJson = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      return queueJson ? JSON.parse(queueJson) : [];
    } catch (error) {
      console.error('Erreur lors de la récupération de la file:', error);
      return [];
    }
  }

  // Synchroniser toutes les opérations en attente
  async syncQueue(): Promise<void> {
    const queue = await this.getQueue();
    if (queue.length === 0) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn('Utilisateur non authentifié, impossible de synchroniser');
      return;
    }

    const successfulOps: string[] = [];
    const failedOps: SyncOperation[] = [];

    for (const operation of queue) {
      try {
        switch (operation.type) {
          case 'create':
            await supabase.from(operation.table).insert(operation.data);
            break;
          case 'update':
            await supabase
              .from(operation.table)
              .update(operation.data)
              .eq('id', operation.data.id);
            break;
          case 'delete':
            await supabase
              .from(operation.table)
              .delete()
              .eq('id', operation.data.id);
            break;
        }
        successfulOps.push(operation.id);
      } catch (error) {
        console.error(`Erreur lors de la synchronisation de l'opération ${operation.id}:`, error);
        failedOps.push(operation);
      }
    }

    // Supprimer les opérations réussies de la file
    if (successfulOps.length > 0) {
      const remainingOps = queue.filter((op) => !successfulOps.includes(op.id));
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(remainingOps));
    }

    // Garder les opérations échouées pour réessayer plus tard
    if (failedOps.length > 0) {
      console.warn(`${failedOps.length} opération(s) n'ont pas pu être synchronisées`);
    }
  }

  // Vider la file d'attente
  async clearQueue(): Promise<void> {
    await AsyncStorage.removeItem(SYNC_QUEUE_KEY);
  }

  // Vérifier la connexion et synchroniser si connecté
  async checkConnectionAndSync(): Promise<boolean> {
    try {
      // Vérifier la connexion en faisant une requête simple
      const { error } = await supabase.from('events').select('id').limit(1);
      
      if (!error) {
        await this.syncQueue();
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }
}

export const syncService = new SyncService();

