import { Routes } from '@angular/router';

import { DriverRatingsComponent } from './driver-ratings.component';
import { RatingsListComponent } from './ratings-list.component';

export const routes: Routes = [
  { path: '', component: RatingsListComponent },
  { path: 'driver/:id', component: DriverRatingsComponent },
];
