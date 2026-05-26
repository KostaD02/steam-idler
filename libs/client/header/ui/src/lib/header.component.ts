import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { LayoutService, ThemeService } from '@steam-idler/client/infra/core';
import { ThemeEnum } from '@steam-idler/client/infra/types';

import { NAVIGATION_ITEMS } from '@steam-idler/client/header/core';

@Component({
  selector: 'si-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  imports: [NgTemplateOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  private readonly themeService = inject(ThemeService);
  private readonly layoutService = inject(LayoutService);

  readonly sizing = this.layoutService.sizing;
  readonly isMobileView = this.layoutService.isMobileView;
  readonly isSideNavOpen = signal(false);
  readonly isDarkTheme = computed(
    () => this.themeService.selectedTheme() === ThemeEnum.Dark,
  );

  readonly navigationItems = NAVIGATION_ITEMS;

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
