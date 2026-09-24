import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  NgbDatepickerModule,
  NgbDropdownModule,
  NgbPaginationModule,
} from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';

import { UIModule } from '../../shared/ui/ui.module';

import { DemandsOffersRoutingModule } from './demands-offers-routing.module';
import { DemandsListComponent } from './demands-list/demands-list.component';
import { DemandDetailComponent } from './demand-detail/demand-detail.component';
import { OffersListComponent } from './offers-list/offers-list.component';
import { OfferDetailComponent } from './offer-detail/offer-detail.component';

/**
 * Demands & Offers feature module (plan §4 / §5.4, lane L4).
 *
 * `NgbdSortableHeader` (`th[sortable]`) comes from UIModule — declared exactly
 * once there by the integration lane (L8); this module must NOT re-declare it
 * (Angular AOT rejects a directive declared in 2+ modules).
 */
@NgModule({
  declarations: [
    DemandsListComponent,
    DemandDetailComponent,
    OffersListComponent,
    OfferDetailComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    UIModule, // app-page-title + th[sortable] (SharedModule also re-exports it now)
    NgbPaginationModule,
    NgbDatepickerModule,
    NgbDropdownModule,
    DemandsOffersRoutingModule,
  ],
})
export class DemandsOffersModule {}
