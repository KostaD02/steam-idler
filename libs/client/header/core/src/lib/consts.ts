import { NavigationItem } from '@steam-idler/client/header/types';

export const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    label: 'Dashboard',
    path: '/',
    requiresLogin: true,
    displayAfterLogin: true,
  },
  {
    label: 'Accounts',
    path: '/accounts',
    requiresLogin: true,
    displayAfterLogin: true,
  },
  {
    label: 'Auth',
    path: '/auth',
    requiresLogin: false,
    displayAfterLogin: false,
  },
  {
    label: 'API',
    path: '/api',
    requiresLogin: false,
    displayAfterLogin: true,
  },
];
