import { Routes } from '@angular/router';

import { TaxisListComponent } from './taxis-list.component';
import { TaxiDetailComponent } from './taxi-detail.component';

export const routes: Routes = [
  { path: '', component: TaxisListComponent },
  { path: ':id', component: TaxiDetailComponent },
];
