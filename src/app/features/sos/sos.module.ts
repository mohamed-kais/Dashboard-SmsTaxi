import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { UIModule } from '../../shared/ui/ui.module';

import { SosRoutingModule } from './sos-routing.module';
import { SosPanelComponent } from './sos-panel/sos-panel.component';

/**
 * SOS / Alerts feature module (plan §4 / §5.8, lane L6).
 * Lazy-loaded by the integration lane (L8) — full path: `sos`
 * (see sos-routing.module.ts mounting note).
 *
 * The spec documents only POST /api/sosNotification/{id} — there is no SOS
 * list / acknowledge endpoint, so this module is a single alert-panel page
 * (trigger + reference material), no fake feed.
 */
@NgModule({
  declarations: [SosPanelComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule, // trigger form
    UIModule, // app-page-title (SharedModule does not re-export UIModule)
    SosRoutingModule,
  ],
})
export class SosModule {}
