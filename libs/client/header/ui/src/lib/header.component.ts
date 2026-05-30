import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { catchError, EMPTY, finalize } from 'rxjs';

import { LayoutService, ThemeService } from '@steam-idler/client/infra/core';
import { ThemeEnum } from '@steam-idler/client/infra/types';

import { AuthService } from '@steam-idler/client/auth/data-access';
import { NAVIGATION_ITEMS } from '@steam-idler/client/header/core';
import {
  LanguageSwitcherComponent,
  TranslatePipe,
} from '@steam-idler/client/i18n/ui';

@Component({
  selector: 'si-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  imports: [
    NgTemplateOutlet,
    RouterLink,
    RouterLinkActive,
    TranslatePipe,
    LanguageSwitcherComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  private readonly themeService = inject(ThemeService);
  private readonly layoutService = inject(LayoutService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly sizing = this.layoutService.sizing;
  readonly isMobileView = this.layoutService.isMobileView;
  readonly isSideNavOpen = signal(false);
  readonly isDarkTheme = computed(
    () => this.themeService.selectedTheme() === ThemeEnum.Dark,
  );
  readonly isAuthenticated = this.authService.isAuthenticated;

  readonly navigationItems = computed(() => {
    const isAuthenticated = this.authService.isAuthenticated();
    return NAVIGATION_ITEMS.filter((item) =>
      isAuthenticated ? item.displayAfterLogin : !item.requiresLogin,
    );
  });

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  signOut(): void {
    this.isSideNavOpen.set(false);
    this.authService
      .signOut()
      .pipe(
        catchError(() => EMPTY),
        finalize(() => this.router.navigateByUrl('/auth/sign-in')),
      )
      .subscribe();
  }
}
