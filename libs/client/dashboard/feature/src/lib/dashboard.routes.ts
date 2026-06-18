import { Routes } from '@angular/router';

import { authGuard } from '@steam-idler/client/auth/data-access';

import { AccountCardsComponent } from './account-cards/account-cards.component';
import { DashboardComponent } from './dashboard.component';

export const dashboardRoutes: Routes = [
  { path: '', component: DashboardComponent },
  {
    path: ':accountName',
    component: AccountCardsComponent,
    canActivate: [authGuard],
  },
];
