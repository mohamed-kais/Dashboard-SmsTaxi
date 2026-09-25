import { Routes } from '@angular/router';

import { SmsInjectComponent } from './sms-inject/sms-inject.component';
import { SmsListComponent } from './sms-list/sms-list.component';

export const routes: Routes = [
  { path: '', component: SmsListComponent },
  { path: 'inject', component: SmsInjectComponent },
];
