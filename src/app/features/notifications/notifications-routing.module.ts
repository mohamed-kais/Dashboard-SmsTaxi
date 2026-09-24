import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { NotificationsListComponent } from './notifications-list/notifications-list.component';
import { NotificationSendComponent } from './notification-send/notification-send.component';

/**
 * Notifications feature routes.
 *
 * Mounted by app-routing.module.ts as a lazy child of the layout wrapper:
 *   { path: 'notifications', loadChildren: () =>
 *       import('./features/notifications/notifications.module')
 *       .then(m => m.NotificationsModule) }
 * yielding the full paths:
 *   ''    → /notifications       (NotificationsListComponent)
 *   'send' → /notifications/send (NotificationSendComponent)
 */
const routes: Routes = [
  { path: '', component: NotificationsListComponent },
  { path: 'send', component: NotificationSendComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class NotificationsRoutingModule {}