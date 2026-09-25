import { Routes } from '@angular/router';

import { ClientDetailComponent } from './client-detail/client-detail.component';
import { ClientsListComponent } from './clients-list/clients-list.component';

export const routes: Routes = [
  { path: '', component: ClientsListComponent },
  { path: ':id', component: ClientDetailComponent },
];
