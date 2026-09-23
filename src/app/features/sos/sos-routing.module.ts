import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SosPanelComponent } from './sos-panel/sos-panel.component';

/**
 * SOS feature routes (plan §4: lazy route `sos`).
 *
 * Mounted by the integration lane (L8) as:
 *   { path: 'sos', loadChildren: () => import('./features/sos/sos.module')
 *       .then(m => m.SosModule) }
 * → `''` resolves /sos. (The stray literal 'sos' child was removed in L8.)
 */
const routes: Routes = [
  { path: '', component: SosPanelComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SosRoutingModule {}
