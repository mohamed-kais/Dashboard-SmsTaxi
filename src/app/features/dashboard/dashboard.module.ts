import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UIModule } from '../../shared/ui/ui.module'; // app-page-title, app-loader
import { WidgetModule } from '../../shared/widget/widget.module'; // app-stat

import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardComponent } from './dashboard.component';

/**
 * Dashboard / Overview — plan §5.1 (docs/IMPLEMENTATION_PLAN.md), lane L7.
 *
 * Lane L7 introduces NO service of its own: it reuses the Taxi / Client /
 * Demande / Offre / Sms services (all `providedIn: 'root'`, owned by lanes
 * L2–L6) through their documented public methods. Lazy-loaded by the
 * integration lane (L8) under the `dashboard` route; module-internal
 * route contract: children = `['']` only.
 */
@NgModule({
  declarations: [DashboardComponent],
  imports: [
    CommonModule,
    UIModule,
    WidgetModule,
    DashboardRoutingModule,
  ],
})
export class DashboardModule {}