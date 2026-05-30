import { NavigationItem } from '@steam-idler/client/header/types';

export const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    labelKey: 'ui.header.nav.dashboard',
    path: '/',
    requiresLogin: false,
    displayAfterLogin: true,
  },
  {
    labelKey: 'ui.header.nav.accounts',
    path: '/accounts',
    requiresLogin: true,
    displayAfterLogin: true,
  },
  {
    labelKey: 'ui.header.nav.auth',
    path: '/auth',
    requiresLogin: false,
    displayAfterLogin: false,
  },
  {
    labelKey: 'ui.header.nav.settings',
    path: '/settings',
    requiresLogin: true,
    displayAfterLogin: true,
  },
  {
    labelKey: 'ui.header.nav.api',
    path: '/api',
    requiresLogin: false,
    displayAfterLogin: true,
  },
];
