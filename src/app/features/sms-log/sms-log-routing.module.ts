import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SmsListComponent } from './sms-list/sms-list.component';
import { SmsInjectComponent } from './sms-inject/sms-inject.component';

/**
 * SMS Log feature routes (plan §4 / §5.7: lazy route `sms-log`).
 *
 * Mounted by the integration lane (L8) as:
 *   { path: 'sms-log', loadChildren: () => import('./features/sms-log/sms-log.module')
 *       .then(m => m.SmsLogModule) }
 * yielding the full paths:
 *   ''      → /sms-log         (SmsListComponent)
 *   'inject' → /sms-log/inject (SmsInjectComponent)
 *
 * (Stray literal 'sms-log' / 'sms-log/inject' children were removed in L8 —
 * mounting at 'sms-log' with relative children is the single convention.)
 */
const routes: Routes = [
  { path: '', component: SmsListComponent },
  { path: 'inject', component: SmsInjectComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SmsLogRoutingModule {}
