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

  private readonly _selectedTheme = signal<Theme>(ThemeEnum.Dark);
  readonly selectedTheme = this._selectedTheme.asReadonly();

  constructor() {
    const storedTheme =
      this.localStorageService.getItem(StorageKeysEnum.Theme) || ThemeEnum.Dark;
    this.setTheme(storedTheme);
  }

  toggleTheme(): void {
    const newTheme =
      this._selectedTheme() === ThemeEnum.Dark
        ? ThemeEnum.Light
        : ThemeEnum.Dark;
    this.setTheme(newTheme);
  }

  private setTheme(theme: Theme): void {
    this._selectedTheme.set(theme);
    this.document.documentElement.setAttribute('data-theme', theme);
    this.localStorageService.setItem(StorageKeysEnum.Theme, theme);
  }
}
