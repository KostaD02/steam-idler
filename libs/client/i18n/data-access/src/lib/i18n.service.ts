import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { effect, inject, Injectable, signal } from '@angular/core';

import { firstValueFrom } from 'rxjs';

import {
  LoaderService,
  LocalStorageService,
} from '@steam-idler/client/infra/core';
import { StorageKeysEnum } from '@steam-idler/client/infra/types';

import {
  DEFAULT_I18N_CACHE_VERSION,
  flattenBundle,
  interpolate,
  isLocale,
} from '@steam-idler/client/i18n/core';
import {
  DEFAULT_LOCALE,
  FlatBundle,
  Locale,
  NestedBundle,
  SUPPORTED_LOCALES,
  TranslationKey,
  TranslationParams,
} from '@steam-idler/client/i18n/types';

import { I18nBundleCache } from './i18n.cache';

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly httpClient = inject(HttpClient);
  private readonly storage = inject(LocalStorageService);
  private readonly cache = inject(I18nBundleCache);
  private readonly document = inject(DOCUMENT);
  private readonly loader = inject(LoaderService);

  private readonly bundles = signal<Partial<Record<Locale, FlatBundle>>>({});
  private readonly inFlight = new Map<Locale, Promise<void>>();

  private cacheVersion = DEFAULT_I18N_CACHE_VERSION;

  readonly locale = signal<Locale>(this.resolveInitialLocale());

  constructor() {
    effect(() => {
      this.document.documentElement.lang = this.locale();
    });
  }

  init(cacheVersion?: string): void {
    if (cacheVersion) {
      this.cacheVersion = cacheVersion;
    }

    this.cache.prune(this.cacheVersion);
    const active = this.locale();
    this.loader.show();
    void this.ensureBundle(active).finally(() => this.loader.hide());

    if (active !== DEFAULT_LOCALE) {
      this.ensureBundle(DEFAULT_LOCALE);
    }
  }

  async setLocale(next: Locale): Promise<boolean> {
    if (!SUPPORTED_LOCALES.includes(next)) {
      return false;
    }

    if (!this.bundles()[next] && !(await this.ensureBundle(next))) {
      return false;
    }

    this.locale.set(next);
    this.storage.setItem(StorageKeysEnum.I18nLocale, next);
    return true;
  }

  t(key: TranslationKey, params?: TranslationParams): string {
    const bundles = this.bundles();
    const resolved =
      bundles[this.locale()]?.[key] ?? bundles[DEFAULT_LOCALE]?.[key] ?? key;
    return interpolate(resolved, params);
  }

  private async ensureBundle(locale: Locale): Promise<boolean> {
    if (this.bundles()[locale]) {
      return true;
    }

    if (!this.shouldSkipCache()) {
      const cached = await this.cache.get(this.cacheVersion, locale);

      if (cached) {
        this.storeBundle(locale, cached);
        return true;
      }
    }

    await this.fetchBundle(locale);
    return !!this.bundles()[locale];
  }

  private shouldSkipCache(): boolean {
    return this.storage.getItem(StorageKeysEnum.I18nSkipCache) === true;
  }

  private fetchBundle(locale: Locale): Promise<void> {
    const existing = this.inFlight.get(locale);

    if (existing) {
      return existing;
    }

    const request = firstValueFrom(
      this.httpClient.get<NestedBundle>(`/i18n/${locale}.json`),
    )
      .then((nested) => {
        this.storeBundle(locale, nested);

        if (!this.shouldSkipCache()) {
          void this.cache.set(this.cacheVersion, locale, nested);
        }
      })
      .catch(() => undefined)
      .finally(() => this.inFlight.delete(locale));

    this.inFlight.set(locale, request);
    return request;
  }

  private storeBundle(locale: Locale, nested: NestedBundle): void {
    const flat = flattenBundle(nested);
    this.bundles.update((current) => ({ ...current, [locale]: flat }));
  }

  private resolveInitialLocale(): Locale {
    const saved = this.storage.getItem(StorageKeysEnum.I18nLocale);

    if (isLocale(saved, SUPPORTED_LOCALES as unknown as string[])) {
      return saved;
    }

    const nav = typeof navigator !== 'undefined' ? navigator.language : '';
    const prefix = nav.split('-')[0];
    return isLocale(prefix, SUPPORTED_LOCALES as unknown as string[])
      ? prefix
      : DEFAULT_LOCALE;
  }
}
