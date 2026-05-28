import { signal, Injectable, inject, DOCUMENT } from '@angular/core';

import {
  StorageKeysEnum,
  Theme,
  ThemeEnum,
} from '@steam-idler/client/infra/types';
import { LoggerService } from '@steam-idler/client/infra/util';

import { LocalStorageService } from './storage.service';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly localStorageService = inject(LocalStorageService);
  private readonly logger = inject(LoggerService);

  private readonly defaultTheme = ThemeEnum.Dark;
  private readonly prefersDarkQuery = '(prefers-color-scheme: dark)';

  private readonly _selectedTheme = signal<Theme>(this.defaultTheme);
  readonly selectedTheme = this._selectedTheme.asReadonly();

  constructor() {
    const query = this.document.defaultView?.matchMedia(this.prefersDarkQuery);
    const preferedTheme = query?.matches ? ThemeEnum.Dark : this.defaultTheme;
    const storedTheme = this.localStorageService.getItem(StorageKeysEnum.Theme);
    const initialTheme = storedTheme || preferedTheme;
    this.logger.log(
      ThemeService.name,
      `Initializing theme: ${initialTheme} (preferred: ${preferedTheme}, stored: ${storedTheme})`,
    );
    this.setTheme(initialTheme);
  }

  toggleTheme(): void {
    const newTheme =
      this._selectedTheme() === ThemeEnum.Dark
        ? ThemeEnum.Light
        : ThemeEnum.Dark;
    this.setTheme(newTheme, true);
  }

  private setTheme(theme: Theme, setManually = false): void {
    this._selectedTheme.set(theme);
    this.document.documentElement.setAttribute('data-theme', theme);
    if (setManually) {
      this.localStorageService.setItem(StorageKeysEnum.Theme, theme);
    }
  }
}
