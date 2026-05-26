import { signal, Injectable, inject, DOCUMENT } from '@angular/core';

import {
  StorageKeysEnum,
  Theme,
  ThemeEnum,
} from '@steam-idler/client/infra/types';

import { LocalStorageService } from './storage.service';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly localStorageService = inject(LocalStorageService);

  private readonly selectedTheme = signal<Theme>(ThemeEnum.Dark);

  constructor() {
    const storedTheme =
      this.localStorageService.getItem(StorageKeysEnum.Theme) || ThemeEnum.Dark;
    this.setTheme(storedTheme);
  }

  toggleTheme(): void {
    const newTheme =
      this.selectedTheme() === ThemeEnum.Dark
        ? ThemeEnum.Light
        : ThemeEnum.Dark;
    this.setTheme(newTheme);
  }

  private setTheme(theme: Theme): void {
    this.selectedTheme.set(theme);
    this.document.documentElement.setAttribute('data-theme', theme);
    this.localStorageService.setItem(StorageKeysEnum.Theme, theme);
  }
}
