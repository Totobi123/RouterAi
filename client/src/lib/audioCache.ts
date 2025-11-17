const DB_NAME = 'ChatAppDB';
const STORE_NAME = 'audioCache';
const DB_VERSION = 1;

interface AudioCacheEntry {
  messageId: number;
  audioBase64: string;
  timestamp: number;
}

class AudioCacheDB {
  private db: IDBDatabase | null = null;
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        this.initialized = true;
        this.cleanOldEntries().catch(err => console.error('Failed to clean old audio cache:', err));
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'messageId' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  async set(messageId: number, audioBase64: string): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const entry: AudioCacheEntry = {
        messageId,
        audioBase64,
        timestamp: Date.now(),
      };
      
      const request = store.put(entry);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async get(messageId: number): Promise<string | null> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(messageId);
      
      request.onsuccess = () => {
        const entry = request.result as AudioCacheEntry | undefined;
        resolve(entry?.audioBase64 || null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clear(): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async cleanOldEntries(maxAge: number = 30 * 24 * 60 * 60 * 1000): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('timestamp');
      const cutoffTime = Date.now() - maxAge;
      
      const request = index.openCursor();
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const entry = cursor.value as AudioCacheEntry;
          if (entry.timestamp < cutoffTime) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  }
}

export const audioCache = new AudioCacheDB();
