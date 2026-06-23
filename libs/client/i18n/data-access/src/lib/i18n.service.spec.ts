import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { of, throwError } from 'rxjs';

import {
  LoaderService,
  LocalStorageService,
} from '@steam-idler/client/infra/core';
import { StorageKeysEnum } from '@steam-idler/client/infra/types';

import { DEFAULT_LOCALE, NestedBundle } from '@steam-idler/client/i18n/types';

import { I18nBundleCache } from './i18n.cache';
import { I18nService } from './i18n.service';

const EN_BUNDLE = { greeting: 'Hello {{name}}' } as NestedBundle;
const KA_BUNDLE = { greeting: 'გამარჯობა {{name}}' } as NestedBundle;

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

class StorageStub {
  private store = new Map<string, unknown>();
  getItem = jest.fn((key: string) => this.store.get(key) ?? null);
  setItem = jest.fn((key: string, value: unknown) => {
    this.store.set(key, value);
  });
  removeItem = jest.fn((key: string) => {
    this.store.delete(key);
  });
}

const buildCacheStub = () => ({
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(undefined),
  prune: jest.fn().mockResolvedValue(undefined),
});

const buildLoaderStub = () => ({
  show: jest.fn(),
  hide: jest.fn(),
});

const buildHttpStub = () => ({
  get: jest.fn().mockReturnValue(of(EN_BUNDLE)),
});

const setup = (navigatorLanguage = 'en-US') => {
  Object.defineProperty(navigator, 'language', {
    value: navigatorLanguage,
    configurable: true,
  });

  const storage = new StorageStub();
  const cache = buildCacheStub();
  const loader = buildLoaderStub();
  const http = buildHttpStub();
  const documentRef = { documentElement: { lang: '' } };

  TestBed.configureTestingModule({
    providers: [
      { provide: LocalStorageService, useValue: storage },
      { provide: I18nBundleCache, useValue: cache },
      { provide: LoaderService, useValue: loader },
      { provide: HttpClient, useValue: http },
      { provide: DOCUMENT, useValue: documentRef },
    ],
  });

  const service = TestBed.inject(I18nService);

  return { service, storage, cache, loader, http, documentRef };
};

describe('I18nService', () => {
  describe('initial locale', () => {
    it('uses the persisted locale when it is supported', () => {
      const { storage } = (() => {
        const s = new StorageStub();
        s.setItem(StorageKeysEnum.I18nLocale, 'ka');

        return { storage: s };
      })();

      Object.defineProperty(navigator, 'language', {
        value: 'en-US',
        configurable: true,
      });

      TestBed.configureTestingModule({
        providers: [
          { provide: LocalStorageService, useValue: storage },
          { provide: I18nBundleCache, useValue: buildCacheStub() },
          { provide: LoaderService, useValue: buildLoaderStub() },
          { provide: HttpClient, useValue: buildHttpStub() },
          { provide: DOCUMENT, useValue: { documentElement: { lang: '' } } },
        ],
      });

      const service = TestBed.inject(I18nService);

      expect(service.locale()).toBe('ka');
    });

    it('falls back to the navigator language prefix when nothing is saved', () => {
      const { service } = setup('ka-GE');

      expect(service.locale()).toBe('ka');
    });

    it('falls back to the default locale for an unsupported navigator language', () => {
      const { service } = setup('fr-FR');

      expect(service.locale()).toBe(DEFAULT_LOCALE);
    });
  });

  describe('document language effect', () => {
    it('reflects the active locale onto the document element', () => {
      const { documentRef } = setup('ka-GE');

      TestBed.tick();

      expect(documentRef.documentElement.lang).toBe('ka');
    });
  });

  describe('t', () => {
    it('returns the key untouched when no bundle is loaded', () => {
      const { service } = setup();

      expect(service.t('greeting')).toBe('greeting');
    });

    it('interpolates params against the active bundle', async () => {
      const { service, http } = setup('ka-GE');
      http.get.mockReturnValue(of(KA_BUNDLE));

      await service.setLocale('ka');

      expect(service.t('greeting', { name: 'Ana' })).toBe('გამარჯობა Ana');
    });

    it('falls back to the default locale bundle when the key is missing', async () => {
      const { service, http } = setup();
      http.get.mockReturnValue(of(EN_BUNDLE));

      await service.setLocale('en');

      expect(service.t('greeting', { name: 'Bob' })).toBe('Hello Bob');
    });
  });

  describe('setLocale', () => {
    it('returns false for an unsupported locale', async () => {
      const { service, http } = setup();

      await expect(service.setLocale('de' as never)).resolves.toBe(false);
      expect(http.get).not.toHaveBeenCalled();
    });

    it('loads the bundle, sets the signal and persists the choice', async () => {
      const { service, storage, http } = setup('ka-GE');
      http.get.mockReturnValue(of(KA_BUNDLE));

      const result = await service.setLocale('ka');

      expect(result).toBe(true);
      expect(service.locale()).toBe('ka');
      expect(storage.setItem).toHaveBeenCalledWith(
        StorageKeysEnum.I18nLocale,
        'ka',
      );
    });

    it('hydrates from the cache without hitting the network', async () => {
      const { service, cache, http } = setup('ka-GE');
      cache.get.mockResolvedValue(KA_BUNDLE);

      const result = await service.setLocale('ka');

      expect(result).toBe(true);
      expect(http.get).not.toHaveBeenCalled();
      expect(service.t('greeting', { name: 'Ana' })).toBe('გამარჯობა Ana');
    });

    it('returns false and keeps the locale when the fetch fails', async () => {
      const { service, http } = setup();
      http.get.mockReturnValue(throwError(() => new Error('offline')));

      const result = await service.setLocale('ka');

      expect(result).toBe(false);
      expect(service.locale()).toBe(DEFAULT_LOCALE);
    });

    it('skips the cache lookup when the skip-cache flag is set', async () => {
      const { service, storage, cache, http } = setup('ka-GE');
      storage.setItem(StorageKeysEnum.I18nSkipCache, true);
      http.get.mockReturnValue(of(KA_BUNDLE));

      await service.setLocale('ka');

      expect(cache.get).not.toHaveBeenCalled();
      expect(cache.set).not.toHaveBeenCalled();
    });

    it('writes the fetched bundle into the cache by default', async () => {
      const { service, cache, http } = setup('ka-GE');
      http.get.mockReturnValue(of(KA_BUNDLE));

      await service.setLocale('ka');

      expect(cache.set).toHaveBeenCalledWith('dev', 'ka', KA_BUNDLE);
    });
  });

  describe('init', () => {
    it('prunes the cache and loads the active bundle', async () => {
      const { service, cache, loader, http } = setup();

      service.init();
      await flushPromises();

      expect(cache.prune).toHaveBeenCalledWith('dev');
      expect(loader.show).toHaveBeenCalledTimes(1);
      expect(loader.hide).toHaveBeenCalledTimes(1);
      expect(http.get).toHaveBeenCalledWith('/i18n/en.json');
    });

    it('overrides the cache version when one is provided', async () => {
      const { service, cache } = setup();

      service.init('v9');
      await flushPromises();

      expect(cache.prune).toHaveBeenCalledWith('v9');
    });

    it('also loads the default bundle when the active locale differs', async () => {
      const { service, http } = setup('ka-GE');
      http.get.mockReturnValue(of(KA_BUNDLE));

      service.init();
      await flushPromises();

      expect(http.get).toHaveBeenCalledWith('/i18n/ka.json');
      expect(http.get).toHaveBeenCalledWith('/i18n/en.json');
    });

    it('hides the loader even when the active bundle fails to load', async () => {
      const { service, loader, http } = setup();
      http.get.mockReturnValue(throwError(() => new Error('offline')));

      service.init();
      await flushPromises();

      expect(loader.hide).toHaveBeenCalledTimes(1);
    });
  });

  describe('in-flight de-duplication', () => {
    it('issues a single request when the same locale is requested concurrently', async () => {
      const { service, http } = setup('ka-GE');
      http.get.mockReturnValue(of(KA_BUNDLE));

      await Promise.all([service.setLocale('ka'), service.setLocale('ka')]);

      expect(http.get).toHaveBeenCalledTimes(1);
    });
  });
});
