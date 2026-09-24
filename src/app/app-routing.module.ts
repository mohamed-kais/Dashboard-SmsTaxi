import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AuthGuard } from './core/guards/auth.guard';
import { LayoutComponent } from './layouts/layout.component';
import { Page404Component } from './extrapages/page404/page404.component';

const routes: Routes = [
  { path: 'account', loadChildren: () => import('./account/account.module').then(m => m.AccountModule) },
  // Layout wrapper: renders the shell (vertical/horizontal) around feature routes.
  // All 10 feature modules are LAZY children here (plan §4, integration lane L8).
  {
    path: '',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    children: [
      // '/' lands on the dashboard — MUST be the first entry (pathMatch full).
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', loadChildren: () => import('./features/dashboard/dashboard.module').then(m => m.DashboardModule) },
      { path: 'taxis', loadChildren: () => import('./features/taxis/taxis.module').then(m => m.TaxisModule) },
      { path: 'clients', loadChildren: () => import('./features/clients/clients.module').then(m => m.ClientsModule) },
      { path: 'reservations', loadChildren: () => import('./features/reservations/reservations.module').then(m => m.ReservationsModule) },
      { path: 'ratings', loadChildren: () => import('./features/ratings/ratings.module').then(m => m.RatingsModule) },
      { path: 'sms-log', loadChildren: () => import('./features/sms-log/sms-log.module').then(m => m.SmsLogModule) },
      { path: 'sos', loadChildren: () => import('./features/sos/sos.module').then(m => m.SosModule) },
      { path: 'notifications', loadChildren: () => import('./features/notifications/notifications.module').then(m => m.NotificationsModule) },
      { path: 'whatsapp', loadChildren: () => import('./features/whatsapp-chat/whatsapp-chat.module').then(m => m.WhatsappChatModule) },
      { path: 'settings', loadChildren: () => import('./features/settings/settings.module').then(m => m.SettingsModule) },
      // DemandsOffersModule serves BOTH URL families (/demands… and /offers…) from
      // ONE lazy module. Its own children are 'demands', 'demands/:id', 'offers',
      // 'offers/:id' — so this empty-path branch only ever matches those URLs
      // (any other URL fails its children and this branch loses). It MUST be the
      // LAST Layout child, and NO catch-all/''-redirect may follow it here —
      // unmatched URLs must fall through to the root `**` → Page404.
      // Do NOT double-mount it at 'demands' and 'offers' (that yields /demands/demands).
      { path: '', loadChildren: () => import('./features/demands-offers/demands-offers.module').then(m => m.DemandsOffersModule) },
    ],
  },
  { path: 'pages', loadChildren: () => import('./extrapages/extrapages.module').then(m => m.ExtrapagesModule), canActivate: [AuthGuard] },
  { path: '**', component: Page404Component },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { scrollPositionRestoration: 'top' })],
  exports: [RouterModule]
})

export class AppRoutingModule { }
