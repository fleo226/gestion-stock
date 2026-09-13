import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Types pour le hors-ligne
export interface OfflineData {
  articles: any[];
  mouvements: any[];
  lastSync: string | null;
  userId: string;
}

// Gestion du stockage local
export class OfflineStorage {
  private static readonly STORAGE_KEY = 'ma-boutique-offline';
  private static readonly SYNC_QUEUE_KEY = 'ma-boutique-sync-queue';

  // Sauvegarder les données hors-ligne
  static async saveOfflineData(data: OfflineData): Promise<void> {
    try {
      const serializedData = JSON.stringify(data);
      localStorage.setItem(this.STORAGE_KEY, serializedData);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde hors-ligne:', error);
      throw error;
    }
  }

  // Charger les données hors-ligne
  static async loadOfflineData(): Promise<OfflineData | null> {
    try {
      const serializedData = localStorage.getItem(this.STORAGE_KEY);
      if (!serializedData) return null;
      
      return JSON.parse(serializedData);
    } catch (error) {
      console.error('Erreur lors du chargement hors-ligne:', error);
      return null;
    }
  }

  // Ajouter une opération à la file de synchronisation
  static async addToSyncQueue(operation: any): Promise<void> {
    try {
      const queue = await this.getSyncQueue();
      queue.push({
        ...operation,
        timestamp: new Date().toISOString(),
        status: 'pending'
      });
      
      localStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('Erreur lors de l\'ajout à la file de synchronisation:', error);
      throw error;
    }
  }

  // Récupérer la file de synchronisation
  static async getSyncQueue(): Promise<any[]> {
    try {
      const queueData = localStorage.getItem(this.SYNC_QUEUE_KEY);
      return queueData ? JSON.parse(queueData) : [];
    } catch (error) {
      console.error('Erreur lors de la récupération de la file de synchronisation:', error);
      return [];
    }
  }

  // Vider la file de synchronisation
  static async clearSyncQueue(): Promise<void> {
    try {
      localStorage.removeItem(this.SYNC_QUEUE_KEY);
    } catch (error) {
      console.error('Erreur lors du vidage de la file de synchronisation:', error);
      throw error;
    }
  }

  // Synchroniser les données hors-ligne avec le serveur
  static async syncWithServer(): Promise<{ success: boolean; synced: number; errors: any[] }> {
    try {
      const queue = await this.getSyncQueue();
      const errors: any[] = [];
      let synced = 0;

      for (const operation of queue) {
        try {
          switch (operation.type) {
            case 'create-article':
              await supabase.from('Article').insert(operation.data);
              break;
            case 'update-article':
              await supabase.from('Article').update(operation.data).eq('id', operation.data.id);
              break;
            case 'delete-article':
              await supabase.from('Article').delete().eq('id', operation.data.id);
              break;
            case 'create-mouvement':
              await supabase.from('Mouvement').insert(operation.data);
              break;
            default:
              console.warn('Type d\'opération non supporté:', operation.type);
          }
          
          synced++;
        } catch (error) {
          errors.push({ operation, error });
          console.error('Erreur lors de la synchronisation:', error);
        }
      }

      // Supprimer les opérations synchronisées avec succès
      if (synced > 0) {
        const newQueue = queue.filter((_, index) => index >= synced);
        localStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify(newQueue));
      }

      return { success: errors.length === 0, synced, errors };
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
      return { success: false, synced: 0, errors: [error] };
    }
  }

  // Vérifier si on est hors-ligne
  static isOffline(): boolean {
    return !navigator.onLine;
  }

  // Écouter les changements de statut réseau
  static listenToNetworkChanges(callback: (isOnline: boolean) => void): () => void {
    const handleOnline = () => callback(true);
    const handleOffline = () => callback(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }
}

// API pour le hors-ligne
export class OfflineAPI {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  // Obtenir tous les articles (hors-ligne ou en ligne)
  async getArticles(): Promise<any[]> {
    if (OfflineStorage.isOffline()) {
      const offlineData = await OfflineStorage.loadOfflineData();
      return offlineData?.articles || [];
    }

    // En ligne, on récupère depuis Supabase
    const { data, error } = await supabase
      .from('Article')
      .select('*')
      .eq('userId', this.userId);

    if (error) throw error;
    return data || [];
  }

  // Créer un article (hors-ligne si nécessaire)
  async createArticle(articleData: any): Promise<any> {
    const article = {
      ...articleData,
      userId: this.userId,
      creeLe: new Date().toISOString()
    };

    if (OfflineStorage.isOffline()) {
      // Sauvegarder hors-ligne
      const offlineData = await OfflineStorage.loadOfflineData() || { articles: [], mouvements: [], lastSync: null, userId: this.userId };
      offlineData.articles.push(article);
      await OfflineStorage.saveOfflineData(offlineData);

      // Ajouter à la file de synchronisation
      await OfflineStorage.addToSyncQueue({
        type: 'create-article',
        data: article
      });

      return article;
    }

    // En ligne, créer directement
    const { data, error } = await supabase
      .from('Article')
      .insert(article)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Mettre à jour un article
  async updateArticle(id: string, updates: any): Promise<any> {
    const updateData = { ...updates, updatedAt: new Date().toISOString() };

    if (OfflineStorage.isOffline()) {
      // Mettre à jour hors-ligne
      const offlineData = await OfflineStorage.loadOfflineData();
      if (offlineData) {
        const index = offlineData.articles.findIndex((a: any) => a.id === id);
        if (index !== -1) {
          offlineData.articles[index] = { ...offlineData.articles[index], ...updateData };
          await OfflineStorage.saveOfflineData(offlineData);
        }

        // Ajouter à la file de synchronisation
        await OfflineStorage.addToSyncQueue({
          type: 'update-article',
          data: { id, ...updateData }
        });
      }

      return updateData;
    }

    // En ligne, mettre à jour directement
    const { data, error } = await supabase
      .from('Article')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Supprimer un article
  async deleteArticle(id: string): Promise<void> {
    if (OfflineStorage.isOffline()) {
      // Supprimer hors-ligne
      const offlineData = await OfflineStorage.loadOfflineData();
      if (offlineData) {
        offlineData.articles = offlineData.articles.filter((a: any) => a.id !== id);
        await OfflineStorage.saveOfflineData(offlineData);

        // Ajouter à la file de synchronisation
        await OfflineStorage.addToSyncQueue({
          type: 'delete-article',
          data: { id }
        });
      }
      return;
    }

    // En ligne, supprimer directement
    const { error } = await supabase
      .from('Article')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Créer un mouvement
  async createMouvement(mouvementData: any): Promise<any> {
    const mouvement = {
      ...mouvementData,
      userId: this.userId,
      date: new Date().toISOString()
    };

    if (OfflineStorage.isOffline()) {
      // Sauvegarder hors-ligne
      const offlineData = await OfflineStorage.loadOfflineData() || { articles: [], mouvements: [], lastSync: null, userId: this.userId };
      offlineData.mouvements.push(mouvement);
      await OfflineStorage.saveOfflineData(offlineData);

      // Ajouter à la file de synchronisation
      await OfflineStorage.addToSyncQueue({
        type: 'create-mouvement',
        data: mouvement
      });

      return mouvement;
    }

    // En ligne, créer directement
    const { data, error } = await supabase
      .from('Mouvement')
      .insert(mouvement)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Synchroniser manuellement
  async sync(): Promise<{ success: boolean; synced: number; errors: any[] }> {
    return await OfflineStorage.syncWithServer();
  }
}