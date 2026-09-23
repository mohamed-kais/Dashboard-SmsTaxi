import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ReservationsListComponent } from './reservations-list.component';
import { ReservationDetailComponent } from './reservation-detail.component';

/**
 * Reservations routes — mounted by the integration lane (L8) under the lazy
 * route `reservations`, yielding:
 *   /reservations            → ReservationsListComponent
 *   /reservations/:id        → ReservationDetailComponent
 */
const routes: Routes = [
  { path: '', component: ReservationsListComponent },
  { path: ':id', component: ReservationDetailComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ReservationsRoutingModule {}