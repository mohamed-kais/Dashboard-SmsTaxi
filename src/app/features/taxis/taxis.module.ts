import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import {
  NgbModalModule,
  NgbNavModule,
  NgbPaginationModule,
} from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from '../../shared/shared.module';

import { TaxisRoutingModule } from './taxis-routing.module';
import { TaxisListComponent } from './taxis-list.component';
import { TaxiDetailComponent } from './taxi-detail.component';
import { TaxiFormModalComponent } from './taxi-form-modal.component';

/**
 * Taxis feature module (plan §4) — NOT standalone; classic NgModule per template
 * convention. Lazy-loaded at route `taxis` by the integration lane (L8).
 *
 * `NgbdSortableHeader` (`th[sortable]`) is provided by UIModule — re-exported
 * through SharedModule (which this module imports). It is declared ONCE there
 * (integration lane L8); feature modules must not re-declare it (Angular AOT
 * rejects a directive declared in 2+ modules).
 */
@NgModule({
  declarations: [
    TaxisListComponent,
    TaxiDetailComponent,
    TaxiFormModalComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SharedModule,
    NgbModalModule,
    NgbNavModule,
    NgbPaginationModule,
    TranslateModule,
    TaxisRoutingModule,
  ],
})
export class TaxisModule {}