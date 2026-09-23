import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ClientsListComponent } from './clients-list/clients-list.component';
import { ClientDetailComponent } from './client-detail/client-detail.component';

/**
 * Clients feature routes (plan §4: lazy route `clients` (+ `clients/:id`)).
 *
 * The integration lane (L8) lazy-loads this module with
 * `{ path: 'clients', loadChildren: () => import('./features/clients/clients.module')
 *    .then(m => m.ClientsModule) }`, so:
 *   ''      → /clients        (ClientsListComponent)
 *   ':id'   → /clients/:id    (ClientDetailComponent)
 */
const routes: Routes = [
  { path: '', component: ClientsListComponent },
  { path: ':id', component: ClientDetailComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ClientsRoutingModule {}