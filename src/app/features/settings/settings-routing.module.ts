import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SettingsComponent } from './settings/settings.component';

/**
 * Settings feature routes (plan §4: lazy route `settings`).
 *
 * Mounted by the integration lane (L8) as:
 *   { path: 'settings', loadChildren: () => import('./features/settings/settings.module')
 *       .then(m => m.SettingsModule) }
 * → `''` resolves /settings. (The stray literal 'settings' child was removed in L8.)
 */
const routes: Routes = [
  { path: '', component: SettingsComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SettingsRoutingModule {}
