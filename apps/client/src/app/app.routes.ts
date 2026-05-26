import { Route } from '@angular/router';

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
    path: '**',
    loadChildren: () =>
      import('@steam-idler/client/not-found/feature').then(
        (m) => m.notFoundRoutes,
      ),
  },
];
