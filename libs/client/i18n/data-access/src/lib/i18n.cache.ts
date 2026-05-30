import { Injectable } from '@angular/core';

import { NestedBundle } from '@steam-idler/client/i18n/types';

const DB_NAME = 'steam-idler-i18n';
const STORE = 'bundles';
const OPEN_TIMEOUT_MS = 2000;

@Injectable({ providedIn: 'root' })
export class I18nBundleCache {
  private dbPromise: Promise<IDBDatabase | null> | null = null;

  async get(version: string, locale: string): Promise<NestedBundle | null> {
    const db = await this.open();

    if (!db) {
      return null;
    }

    return new Promise((resolve) => {
      try {
        const request = db
          .transaction(STORE, 'readonly')
          .objectStore(STORE)
          .get(this.key(version, locale));
        request.onerror = () => resolve(null);
        request.onsuccess = () =>
          resolve((request.result as NestedBundle) ?? null);
      } catch {
        resolve(null);
      }
    });
  }

  async set(
    version: string,
    locale: string,
    bundle: NestedBundle,
  ): Promise<void> {
    const db = await this.open();

    if (!db) {
      return;
    }

    await new Promise<void>((resolve) => {
      try {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).put(bundle, this.key(version, locale));
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
        tx.onabort = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  async prune(version: string): Promise<void> {
    const db = await this.open();

    if (!db) {
      return;
    }

    await new Promise<void>((resolve) => {
      try {
        const store = db.transaction(STORE, 'readwrite').objectStore(STORE);
        const request = store.getAllKeys();
        request.onerror = () => resolve();

        request.onsuccess = () => {
          const prefix = `${version}:`;

          for (const key of request.result) {
            if (typeof key === 'string' && !key.startsWith(prefix)) {
              store.delete(key);
            }
          }

          resolve();
        };
      } catch {
        resolve();
      }
    });
  }

  private key(version: string, locale: string): string {
    return `${version}:${locale}`;
  }

  private open(): Promise<IDBDatabase | null> {
    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise((resolve) => {
      if (typeof indexedDB === 'undefined') {
        resolve(null);
        return;
      }

      let settled = false;

      const resolveOnce = (db: IDBDatabase | null) => {
        if (settled) return;
        settled = true;
        resolve(db);
      };

      const timer = setTimeout(() => resolveOnce(null), OPEN_TIMEOUT_MS);

      const settle = (db: IDBDatabase | null) => {
        clearTimeout(timer);
        resolveOnce(db);
      };

      try {
        const request = indexedDB.open(DB_NAME, 1);

        request.onupgradeneeded = () => {
          if (!request.result.objectStoreNames.contains(STORE)) {
            request.result.createObjectStore(STORE);
          }
        };

        request.onsuccess = () => settle(request.result);
        request.onerror = () => settle(null);
        request.onblocked = () => settle(null);
      } catch {
        settle(null);
      }
    });
    return this.dbPromise;
  }
}
