import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DemandsListComponent } from './demands-list/demands-list.component';
import { DemandDetailComponent } from './demand-detail/demand-detail.component';
import { OffersListComponent } from './offers-list/offers-list.component';
import { OfferDetailComponent } from './offer-detail/offer-detail.component';

/**
 * Child routes for the Demands & Offers feature (plan §4 — DemandsOffersModule).
 * These are wired by the integration lane (L8) as a lazy `loadChildren` under
 * the layout wrapper — this module itself does NOT touch app-routing.
 *
 * Route paths (for L8): `demands`, `demands/:id`, `offers`, `offers/:id`.
 */
const routes: Routes = [
  { path: 'demands', component: DemandsListComponent },
  { path: 'demands/:id', component: DemandDetailComponent },
  { path: 'offers', component: OffersListComponent },
  { path: 'offers/:id', component: OfferDetailComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DemandsOffersRoutingModule {}
