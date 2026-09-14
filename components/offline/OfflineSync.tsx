'use client';

import { useEffect, useState, useCallback } from 'react';

interface OfflineMutation {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE' | 'SORTIE' | 'ENTREE';
  endpoint: string;
  data: any;
  timestamp: number;
  retries: number;
}

const DB_NAME = 'MaBoutiqueOffline';
const DB_VERSION = 1;
const STORE_NAME = 'mutations';

class OfflineDB {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  async addMutation(mutation: OfflineMutation): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(mutation);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getMutations(): Promise<OfflineMutation[]> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteMutation(id: string): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async updateMutation(mutation: OfflineMutation): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(mutation);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

const offlineDB = new OfflineDB();

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Check online status
  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
      if (navigator.onLine) {
        syncPending();
      }
    };

    updateOnlineStatus();
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Listen for SW sync trigger
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'SYNC_TRIGGERED') {
        syncPending();
      }
    });

    // Initial count
    countPending();

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  const countPending = async () => {
    try {
      const mutations = await offlineDB.getMutations();
      setPendingCount(mutations.length);
    } catch (e) {
      console.warn('Offline DB not available:', e);
    }
  };

  // Save mutation for offline sync
  const saveForLater = useCallback(async (type: OfflineMutation['type'], endpoint: string, data: any) => {
    const mutation: OfflineMutation = {
      id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      endpoint,
      data,
      timestamp: Date.now(),
      retries: 0,
    };

    try {
      await offlineDB.addMutation(mutation);
      await countPending();
      
      // Register background sync if available
      if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        const registration = await navigator.serviceWorker.ready;
        await (registration as any).sync.register('sync-stock');
      }
    } catch (e) {
      console.warn('Failed to save offline:', e);
    }
  }, []);

  // Sync pending mutations
  const syncPending = async () => {
    if (!navigator.onLine || syncing) return;
    
    setSyncing(true);
    try {
      const mutations = await offlineDB.getMutations();
      if (mutations.length === 0) {
        setSyncing(false);
        return;
      }

      for (const mutation of mutations) {
        try {
          const response = await fetch(mutation.endpoint, {
            method: mutation.type === 'DELETE' ? 'DELETE' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: mutation.type === 'DELETE' ? undefined : JSON.stringify(mutation.data),
          });

          if (response.ok) {
            await offlineDB.deleteMutation(mutation.id);
          } else if (mutation.retries >= 3) {
            // Max retries reached, keep for manual retry
            await offlineDB.updateMutation({ ...mutation, retries: mutation.retries + 1 });
          } else {
            await offlineDB.updateMutation({ ...mutation, retries: mutation.retries + 1 });
          }
        } catch (e) {
          console.warn('Sync failed for mutation:', mutation.id, e);
          if (mutation.retries < 3) {
            await offlineDB.updateMutation({ ...mutation, retries: mutation.retries + 1 });
          }
        }
      }

      await countPending();
      setLastSync(new Date());
    } finally {
      setSyncing(false);
    }
  };

  // Helper to wrap API calls with offline support
  const apiCall = useCallback(async (
    endpoint: string,
    options: RequestInit = {},
    mutationType: OfflineMutation['type'] = 'CREATE'
  ) => {
    const body = options.body ? JSON.parse(options.body as string) : undefined;
    
    if (!navigator.onLine) {
      // Save for later
      await saveForLater(mutationType, endpoint, body);
      // Return optimistic response
      return { success: true, offline: true, id: `offline-${Date.now()}` };
    }

    try {
      const response = await fetch(endpoint, options);
      const data = await response.json();
      return { ...data, offline: false };
    } catch (error) {
      // If network fails, save for later
      if (body) {
        await saveForLater(mutationType, endpoint, body);
        return { success: true, offline: true, id: `offline-${Date.now()}` };
      }
      throw error;
    }
  }, [saveForLater]);

  // Get all pending mutations (for debugging)
  const getPending = useCallback(async () => {
    return await offlineDB.getMutations();
  }, []);

  // Clear all (for testing)
  const clearAll = useCallback(async () => {
    await offlineDB.clear();
    await countPending();
  }, []);

  return {
    isOnline,
    pendingCount,
    syncing,
    lastSync,
    syncPending,
    saveForLater,
    apiCall,
    getPending,
    clearAll,
  };
}

// Hook for online/offline indicator component
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return isOnline;
}