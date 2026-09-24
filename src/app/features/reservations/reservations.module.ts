import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { NgbModalModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';

import { TranslateModule } from '@ngx-translate/core';

import { UIModule } from '../../shared/ui/ui.module';
import { WidgetModule } from '../../shared/widget/widget.module';

import { ReservationsRoutingModule } from './reservations-routing.module';
import { ReservationsListComponent } from './reservations-list.component';
import { ReservationDetailComponent } from './reservation-detail.component';

/**
 * Reservations — plan §5.5 (docs/IMPLEMENTATION_PLAN.md).
 * Lazy-loaded under the `reservations` route by the integration lane (L8);
 * module-internal routes: `''` → list, `:id` → detail.
 */
@NgModule({
  declarations: [ReservationsListComponent, ReservationDetailComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModalModule,
    NgbPaginationModule,
    TranslateModule,
    UIModule,
    WidgetModule,
    ReservationsRoutingModule,
  ],
})
export class ReservationsModule {}