import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { TranslatePipe } from '@ngx-translate/core';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';

import { UIModule } from '../../shared/ui/ui.module';

import { SettingsRoutingModule } from './settings-routing.module';
import { SettingsComponent } from './settings/settings.component';

/**
 * Settings feature module (plan §4 / §5.9, lane L6).
 * Lazy-loaded by the integration lane (L8) — full path: `settings`
 * (see settings-routing.module.ts mounting note).
 *
 * Two reactive-form tabs (NgbNav): Matching radius + Airport pricing, backed
 * by core/services/config.service.ts (GET/PUT /api/matching-config and
 * GET/PUT /api/airport-pricing).
 */
@NgModule({
  declarations: [SettingsComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule, // both settings forms
    NgbNavModule, // tabbed settings page
    TranslatePipe, // | translate pipe
    UIModule, // app-page-title (SharedModule does not re-export UIModule)
    SettingsRoutingModule,
  ],
})
export class SettingsModule {}
