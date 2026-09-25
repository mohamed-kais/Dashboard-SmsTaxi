import { Routes } from '@angular/router';

import { AuthGuard } from './core/guards/auth.guard';
import { LayoutComponent } from './layouts/layout.component';
import { Page404Component } from './extrapages/page404/page404.component';

export const routes: Routes = [
  { path: 'account', loadChildren: () => import('./account/account.routes').then(m => m.routes) },
  // Layout wrapper: renders the shell (vertical/horizontal) around feature routes.
  {
    path: '',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    children: [
      // '/' lands on the dashboard — MUST be the first entry (pathMatch full).
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.routes) },
      { path: 'taxis', loadChildren: () => import('./features/taxis/taxis.routes').then(m => m.routes) },
      { path: 'clients', loadChildren: () => import('./features/clients/clients.routes').then(m => m.routes) },
      { path: 'reservations', loadChildren: () => import('./features/reservations/reservations.routes').then(m => m.routes) },
      { path: 'ratings', loadChildren: () => import('./features/ratings/ratings.routes').then(m => m.routes) },
      { path: 'sms-log', loadChildren: () => import('./features/sms-log/sms-log.routes').then(m => m.routes) },
      { path: 'sos', loadChildren: () => import('./features/sos/sos.routes').then(m => m.routes) },
      { path: 'notifications', loadChildren: () => import('./features/notifications/notifications.routes').then(m => m.routes) },
      { path: 'whatsapp', loadChildren: () => import('./features/whatsapp-chat/whatsapp-chat.routes').then(m => m.routes) },
      { path: 'settings', loadChildren: () => import('./features/settings/settings.routes').then(m => m.routes) },
      // Demands and offers share one lazy route array. This empty-path branch MUST stay LAST
      // so it only serves its demands/* and offers/* children and unmatched URLs fall through
      // to the root `**` route. Do not double-mount it at `demands` or `offers`.
      { path: '', loadChildren: () => import('./features/demands-offers/demands-offers.routes').then(m => m.routes) },
    ],
  },
  { path: 'pages', loadChildren: () => import('./extrapages/extrapages.routes').then(m => m.routes), canActivate: [AuthGuard] },
  { path: '**', component: Page404Component },
];
