import type { StorageAdapter } from "../adapter";
import type { StorageRecord } from "../types";

type IndexedDbStorageAdapterOptions = {
  dbName?: string;
  storeName?: string;
  version?: number;
};

export class IndexedDbStorageAdapter implements StorageAdapter {
  public readonly mode = "local" as const;

  private readonly dbName: string;
  private readonly storeName: string;
  private readonly version: number;
  private databasePromise: Promise<IDBDatabase> | null = null;

  public constructor(options: IndexedDbStorageAdapterOptions = {}) {
    this.dbName = options.dbName ?? "progression-tracker-local";
    this.storeName = options.storeName ?? "records";
    this.version = options.version ?? 1;
  }

  public async isAvailable(): Promise<boolean> {
    if (typeof indexedDB === "undefined") {
      return false;
    }

    try {
      await this.getDatabase();
      return true;
    } catch {
      this.databasePromise = null;
      return false;
    }
  }

  public async read<TValue>(key: string): Promise<StorageRecord<TValue> | null> {
    const result = await this.runReadOnly<StorageRecord<TValue> | undefined>((store) => store.get(key));

    if (!result) {
      return null;
    }

    return result;
  }

  public async write<TValue>(record: StorageRecord<TValue>): Promise<void> {
    await this.runReadWrite((store) => store.put(record));
  }

  public async remove(key: string): Promise<void> {
    await this.runReadWrite((store) => store.delete(key));
  }

  public async listKeys(prefix?: string): Promise<string[]> {
    const keys = await this.runReadOnly((store) => store.getAllKeys());
    const normalizedKeys = keys.map((key) => String(key));

    if (!prefix) {
      return normalizedKeys;
    }

    return normalizedKeys.filter((key) => key.startsWith(prefix));
  }

  private async getDatabase(): Promise<IDBDatabase> {
    if (!this.databasePromise) {
      this.databasePromise = this.openDatabase();
    }

    return this.databasePromise;
  }

  private async openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onupgradeneeded = () => {
        const database = request.result;

        if (!database.objectStoreNames.contains(this.storeName)) {
          const store = database.createObjectStore(this.storeName, { keyPath: "key" });
          store.createIndex("updatedAt", "updatedAt", { unique: false });
        }
      };

      request.onsuccess = () => {
        const database = request.result;

        database.onversionchange = () => {
          database.close();
          this.databasePromise = null;
        };

        resolve(database);
      };

      request.onerror = () => {
        reject(request.error ?? new Error("Could not open the local IndexedDB database."));
      };

      request.onblocked = () => {
        reject(new Error("The local IndexedDB database is blocked by another open connection."));
      };
    });
  }

  private async runReadOnly<TResult>(operation: (store: IDBObjectStore) => IDBRequest<TResult>): Promise<TResult> {
    const database = await this.getDatabase();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(this.storeName, "readonly");
      const store = transaction.objectStore(this.storeName);
      const request = operation(store);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error ?? new Error("IndexedDB read failed."));
      };

      transaction.onerror = () => {
        reject(transaction.error ?? new Error("IndexedDB read transaction failed."));
      };
    });
  }

  private async runReadWrite<TResult>(operation: (store: IDBObjectStore) => IDBRequest<TResult>): Promise<void> {
    const database = await this.getDatabase();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(this.storeName, "readwrite");
      const store = transaction.objectStore(this.storeName);
      const request = operation(store);

      request.onerror = () => {
        reject(request.error ?? new Error("IndexedDB write failed."));
      };

      transaction.oncomplete = () => {
        resolve();
      };

      transaction.onerror = () => {
        reject(transaction.error ?? new Error("IndexedDB write transaction failed."));
      };

      transaction.onabort = () => {
        reject(transaction.error ?? new Error("IndexedDB write transaction was aborted."));
      };
    });
  }
}
