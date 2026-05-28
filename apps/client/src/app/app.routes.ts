import { Route } from '@angular/router';

import { guestGuard } from '@steam-idler/client/auth/data-access';

export const appRoutes: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard',
  },
  {
    path: 'dashboard',
    loadChildren: () =>
      import('@steam-idler/client/dashboard/feature').then(
        (m) => m.dashboardRoutes,
      ),
  },
  {
    path: 'api',
    loadChildren: () =>
      import('@steam-idler/client/api/feature').then((m) => m.apiRoutes),
  },
  {
    path: 'auth',
    canActivate: [guestGuard],
    loadChildren: () =>
      import('@steam-idler/client/auth/feature').then((m) => m.authRoutes),
  },
  {
    path: 'not-found',
    loadChildren: () =>
      import('@steam-idler/client/not-found/feature').then(
        (m) => m.notFoundRoutes,
      ),
  },
  {
    path: '**',
    pathMatch: 'full',
    redirectTo: 'not-found',
  },
];
