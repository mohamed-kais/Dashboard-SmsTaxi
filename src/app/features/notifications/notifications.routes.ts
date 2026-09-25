import { Routes } from '@angular/router';

import { NotificationSendComponent } from './notification-send/notification-send.component';
import { NotificationsListComponent } from './notifications-list/notifications-list.component';

export const routes: Routes = [
  { path: '', component: NotificationsListComponent },
  { path: 'send', component: NotificationSendComponent },
];
