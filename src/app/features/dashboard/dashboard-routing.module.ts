import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DashboardComponent } from './dashboard.component';

/**
 * Dashboard routes — plan §4 (docs/IMPLEMENTATION_PLAN.md), lane L7.
 *
 * The integration lane (L8) mounts this module lazily under the `dashboard`
 * route inside the layout wrapper and owns the default redirect, so the final
 * URL is `/dashboard`. This module declares only the `''` child.
 */
const routes: Routes = [{ path: '', component: DashboardComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DashboardRoutingModule {}