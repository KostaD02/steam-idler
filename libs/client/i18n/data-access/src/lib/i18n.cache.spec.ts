import { TestBed } from '@angular/core/testing';

import { NestedBundle } from '@steam-idler/client/i18n/types';

import { I18nBundleCache } from './i18n.cache';

type Handler = (() => void) | null;

class FakeRequest<T> {
  onsuccess: Handler = null;
  onerror: Handler = null;
  result!: T;

  succeed(result: T): void {
    this.result = result;
    queueMicrotask(() => this.onsuccess?.());
  }

  fail(): void {
    queueMicrotask(() => this.onerror?.());
  }
}

class FakeObjectStore {
  constructor(private readonly data: Map<string, unknown>) {}

  get = jest.fn((key: string) => {
    const request = new FakeRequest<unknown>();
    request.succeed(this.data.get(key));

    return request;
  });

  put = jest.fn((value: unknown, key: string) => {
    this.data.set(key, value);

    return new FakeRequest<unknown>();
  });

  delete = jest.fn((key: string) => {
    this.data.delete(key);

    return new FakeRequest<unknown>();
  });

  getAllKeys = jest.fn(() => {
    const request = new FakeRequest<IDBValidKey[]>();
    request.succeed([...this.data.keys()]);

    return request;
  });
}

class FakeTransaction {
  oncomplete: Handler = null;
  onerror: Handler = null;
  onabort: Handler = null;

  constructor(private readonly store: FakeObjectStore) {
    queueMicrotask(() => this.oncomplete?.());
  }

  objectStore(): FakeObjectStore {
    return this.store;
  }
}

class FakeDb {
  objectStoreNames = { contains: jest.fn(() => true) };

  constructor(private readonly store: FakeObjectStore) {}

  createObjectStore = jest.fn();

  transaction = jest.fn(() => new FakeTransaction(this.store));
}

const buildIndexedDb = (data = new Map<string, unknown>()) => {
  const store = new FakeObjectStore(data);
  const db = new FakeDb(store);

  const open = jest.fn(() => {
    const request = new FakeRequest<FakeDb>();
    request.succeed(db);

    return request;
  });

  return { indexedDB: { open } as unknown as IDBFactory, store, db, data };
};

const setup = () => {
  TestBed.configureTestingModule({ providers: [I18nBundleCache] });
  const service = TestBed.inject(I18nBundleCache);

  return { service };
};

describe('I18nBundleCache', () => {
  const originalIndexedDb = globalThis.indexedDB;

  afterEach(() => {
    (globalThis as { indexedDB?: IDBFactory }).indexedDB = originalIndexedDb;
  });

  const useIndexedDb = (data?: Map<string, unknown>) => {
    const harness = buildIndexedDb(data);
    (globalThis as { indexedDB?: IDBFactory }).indexedDB = harness.indexedDB;

    return harness;
  };

  describe('when indexedDB is unavailable', () => {
    beforeEach(() => {
      (globalThis as { indexedDB?: IDBFactory }).indexedDB =
        undefined as unknown as IDBFactory;
    });

    it('get resolves to null', async () => {
      const { service } = setup();

      await expect(service.get('v1', 'en')).resolves.toBeNull();
    });

    it('set resolves without writing anything', async () => {
      const { service } = setup();

      await expect(
        service.set('v1', 'en', { a: 'b' } as NestedBundle),
      ).resolves.toBeUndefined();
    });

    it('prune resolves without error', async () => {
      const { service } = setup();

      await expect(service.prune('v1')).resolves.toBeUndefined();
    });
  });

  describe('get', () => {
    it('returns the stored bundle for the version and locale', async () => {
      const bundle = { greeting: 'hello' } as NestedBundle;
      useIndexedDb(new Map([['v1:en', bundle]]));
      const { service } = setup();

      await expect(service.get('v1', 'en')).resolves.toEqual(bundle);
    });

    it('returns null when the key is missing', async () => {
      useIndexedDb();
      const { service } = setup();

      await expect(service.get('v1', 'en')).resolves.toBeNull();
    });

    it('keys the lookup by version and locale', async () => {
      const harness = useIndexedDb();
      const { service } = setup();

      await service.get('v2', 'ka');

      expect(harness.store.get).toHaveBeenCalledWith('v2:ka');
    });

    it('returns null when the read request errors', async () => {
      const harness = useIndexedDb();
      harness.store.get.mockImplementationOnce(() => {
        const request = new FakeRequest<unknown>();
        request.fail();

        return request;
      });
      const { service } = setup();

      await expect(service.get('v1', 'en')).resolves.toBeNull();
    });

    it('returns null when opening a transaction throws', async () => {
      const harness = useIndexedDb();
      harness.db.transaction.mockImplementationOnce(() => {
        throw new Error('boom');
      });
      const { service } = setup();

      await expect(service.get('v1', 'en')).resolves.toBeNull();
    });
  });

  describe('set', () => {
    it('writes the bundle under the version and locale key', async () => {
      const harness = useIndexedDb();
      const { service } = setup();
      const bundle = { greeting: 'hi' } as NestedBundle;

      await service.set('v1', 'en', bundle);

      expect(harness.store.put).toHaveBeenCalledWith(bundle, 'v1:en');
      expect(harness.data.get('v1:en')).toBe(bundle);
    });

    it('resolves when the transaction throws', async () => {
      const harness = useIndexedDb();
      harness.db.transaction.mockImplementationOnce(() => {
        throw new Error('boom');
      });
      const { service } = setup();

      await expect(
        service.set('v1', 'en', {} as NestedBundle),
      ).resolves.toBeUndefined();
    });
  });

  describe('prune', () => {
    it('removes keys that do not belong to the active version', async () => {
      const harness = useIndexedDb(
        new Map<string, unknown>([
          ['v1:en', { a: '1' }],
          ['v1:ka', { a: '2' }],
          ['old:en', { a: '3' }],
        ]),
      );
      const { service } = setup();

      await service.prune('v1');

      expect(harness.data.has('v1:en')).toBe(true);
      expect(harness.data.has('v1:ka')).toBe(true);
      expect(harness.data.has('old:en')).toBe(false);
    });

    it('keeps every key when they all match the version prefix', async () => {
      const harness = useIndexedDb(
        new Map<string, unknown>([
          ['v1:en', { a: '1' }],
          ['v1:ka', { a: '2' }],
        ]),
      );
      const { service } = setup();

      await service.prune('v1');

      expect(harness.store.delete).not.toHaveBeenCalled();
      expect(harness.data.size).toBe(2);
    });

    it('resolves when the transaction throws', async () => {
      const harness = useIndexedDb();
      harness.db.transaction.mockImplementationOnce(() => {
        throw new Error('boom');
      });
      const { service } = setup();

      await expect(service.prune('v1')).resolves.toBeUndefined();
    });
  });

  describe('open caching', () => {
    it('opens the database only once across multiple calls', async () => {
      const harness = useIndexedDb();
      const openSpy = harness.indexedDB.open as jest.Mock;
      const { service } = setup();

      await service.get('v1', 'en');
      await service.get('v1', 'ka');

      expect(openSpy).toHaveBeenCalledTimes(1);
    });
  });
});
