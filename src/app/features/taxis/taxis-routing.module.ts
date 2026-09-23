import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { TaxisListComponent } from './taxis-list.component';
import { TaxiDetailComponent } from './taxi-detail.component';

/**
 * Taxis feature routes (plan §4: `taxis` + `taxis/:id`).
 *
 * MOUNTING NOTE for the integration lane (L8): these are RELATIVE child routes.
 * Register the module lazily under the layout wrapper in `app-routing.module.ts`:
 *
 *   { path: 'taxis', loadChildren: () => import('./features/taxis/taxis.module').then(m => m.TaxisModule) }
 *
 * which yields the full paths `taxis` (list) and `taxis/:id` (detail).
 */
const routes: Routes = [
  { path: '', component: TaxisListComponent },
  { path: ':id', component: TaxiDetailComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TaxisRoutingModule {}