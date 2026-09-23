import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { NgbModalModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';

import { UIModule } from '../../shared/ui/ui.module';

import { SmsLogRoutingModule } from './sms-log-routing.module';
import { SmsListComponent } from './sms-list/sms-list.component';
import { SmsInjectComponent } from './sms-inject/sms-inject.component';

/**
 * SMS Log feature module (plan §4 / §5.7, lane L6).
 * Lazy-loaded by the integration lane (L8) at `sms-log` — see
 * sms-log-routing.module.ts (full paths: `sms-log`, `sms-log/inject`).
 *
 * `NgbdSortableHeader` (salvaged core directive, plan §3) comes from UIModule —
 * declared exactly once there by the integration lane (L8); this module must
 * NOT re-declare it (Angular AOT rejects a directive declared in 2+ modules).
 */
@NgModule({
  declarations: [SmsListComponent, SmsInjectComponent],
  imports: [
    CommonModule,
    FormsModule, // [(ngModel)] search box
    ReactiveFormsModule, // SMS injection reactive form
    UIModule, // app-page-title + th[sortable]
    NgbModalModule, // view + delete-confirm modals
    NgbPaginationModule,
    SmsLogRoutingModule,
  ],
})
export class SmsLogModule {}
