import { Routes } from '@angular/router';

import { DemandDetailComponent } from './demand-detail/demand-detail.component';
import { DemandsListComponent } from './demands-list/demands-list.component';
import { OfferDetailComponent } from './offer-detail/offer-detail.component';
import { OffersListComponent } from './offers-list/offers-list.component';

export const routes: Routes = [
  { path: 'demands', component: DemandsListComponent },
  { path: 'demands/:id', component: DemandDetailComponent },
  { path: 'offers', component: OffersListComponent },
  { path: 'offers/:id', component: OfferDetailComponent },
];
