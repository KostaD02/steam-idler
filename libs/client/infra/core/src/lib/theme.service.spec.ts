import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { StorageKeysEnum, ThemeEnum } from '@steam-idler/client/infra/types';
import { LoggerService } from '@steam-idler/client/infra/util';

import { LocalStorageService } from './storage.service';
import { ThemeService } from './theme.service';

const buildStorageStub = (storedTheme: string | null = null) => ({
  getItem: jest.fn().mockReturnValue(storedTheme),
  setItem: jest.fn(),
});

type StorageStub = ReturnType<typeof buildStorageStub>;

const buildDocumentStub = (prefersDark = false) => {
  const documentElement = { setAttribute: jest.fn() };

  return {
    documentElement,
    defaultView: {
      matchMedia: jest.fn().mockReturnValue({ matches: prefersDark }),
    },
  };
};

type DocumentStub = ReturnType<typeof buildDocumentStub>;

const setup = (options?: {
  storedTheme?: string | null;
  prefersDark?: boolean;
}) => {
  const storage = buildStorageStub(options?.storedTheme ?? null);
  const document = buildDocumentStub(options?.prefersDark ?? false);
  TestBed.configureTestingModule({
    providers: [
      { provide: DOCUMENT, useValue: document },
      { provide: LocalStorageService, useValue: storage },
      { provide: LoggerService, useValue: { log: jest.fn() } },
    ],
  });
  const service = TestBed.inject(ThemeService);

  return {
    service,
    storage: storage as StorageStub,
    document: document as DocumentStub,
  };
};

describe('ThemeService', () => {
  it('defaults to the dark theme when nothing is stored or preferred', () => {
    const { service } = setup();

    expect(service.selectedTheme()).toBe(ThemeEnum.Dark);
  });

  it('uses the stored theme over the system preference', () => {
    const { service } = setup({ storedTheme: ThemeEnum.Light });

    expect(service.selectedTheme()).toBe(ThemeEnum.Light);
  });

  it('applies the initial theme to the document element', () => {
    const { document } = setup({ storedTheme: ThemeEnum.Light });

    expect(document.documentElement.setAttribute).toHaveBeenCalledWith(
      'data-theme',
      ThemeEnum.Light,
    );
  });

  it('does not persist the theme during initialisation', () => {
    const { storage } = setup();

    expect(storage.setItem).not.toHaveBeenCalled();
  });

  describe('toggleTheme', () => {
    it('switches from dark to light and persists the choice', () => {
      const { service, storage, document } = setup();

      service.toggleTheme();

      expect(service.selectedTheme()).toBe(ThemeEnum.Light);
      expect(storage.setItem).toHaveBeenCalledWith(
        StorageKeysEnum.Theme,
        ThemeEnum.Light,
      );
      expect(document.documentElement.setAttribute).toHaveBeenLastCalledWith(
        'data-theme',
        ThemeEnum.Light,
      );
    });

    it('switches back from light to dark', () => {
      const { service } = setup({ storedTheme: ThemeEnum.Light });

      service.toggleTheme();

      expect(service.selectedTheme()).toBe(ThemeEnum.Dark);
    });
  });
});
