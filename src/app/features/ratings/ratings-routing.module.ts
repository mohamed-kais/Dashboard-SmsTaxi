import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { RatingsListComponent } from './ratings-list.component';
import { DriverRatingsComponent } from './driver-ratings.component';

/**
 * Ratings routes — mounted by the integration lane (L8) under the lazy route
 * `ratings`, yielding:
 *   /ratings                 → RatingsListComponent (driver lookup panel)
 *   /ratings/driver/:id      → DriverRatingsComponent (per-driver detail)
 */
const routes: Routes = [
  { path: '', component: RatingsListComponent },
  { path: 'driver/:id', component: DriverRatingsComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RatingsRoutingModule {}