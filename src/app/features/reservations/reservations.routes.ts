import { Routes } from '@angular/router';

import { ReservationDetailComponent } from './reservation-detail.component';
import { ReservationsListComponent } from './reservations-list.component';

export const routes: Routes = [
  { path: '', component: ReservationsListComponent },
  { path: ':id', component: ReservationDetailComponent },
];
