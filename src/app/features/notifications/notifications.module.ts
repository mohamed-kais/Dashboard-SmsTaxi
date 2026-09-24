import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';

import { UIModule } from '../../shared/ui/ui.module';

import { NotificationsRoutingModule } from './notifications-routing.module';
import { NotificationsListComponent } from './notifications-list/notifications-list.component';
import { NotificationSendComponent } from './notification-send/notification-send.component';

/**
 * Notifications feature module.
 * Lazy-loaded by app-routing at `notifications` — see
 * notifications-routing.module.ts (full paths: `notifications`,
 * `notifications/send`).
 *
 * `NgbdSortableHeader` (`th[sortable]`) comes from UIModule — declared exactly
 * once there by the integration lane (L8); this module must NOT re-declare it
 * (Angular AOT rejects a directive declared in 2+ modules).
 */
@NgModule({
  declarations: [NotificationsListComponent, NotificationSendComponent],
  imports: [
    CommonModule,
    FormsModule, // [(ngModel)] filter boxes + page-size select
    ReactiveFormsModule, // send form
    UIModule, // app-page-title + th[sortable]
    NgbPaginationModule,
    NotificationsRoutingModule,
  ],
})
export class NotificationsModule {}