import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModalModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';

import { SharedModule } from '../../shared/shared.module';
import { UIModule } from '../../shared/ui/ui.module';

import { ClientsRoutingModule } from './clients-routing.module';
import { ClientsListComponent } from './clients-list/clients-list.component';
import { ClientDetailComponent } from './client-detail/client-detail.component';
import { ClientFormComponent } from './client-form/client-form.component';

/**
 * Clients feature module (plan §5.3). Lazy-loaded at path `clients` by the
 * integration lane (L8): routes are '' → list and ':id' → detail
 * (see clients-routing.module.ts).
 *
 * `NgbdSortableHeader` (`th[sortable]`) comes from UIModule (single
 * declaration, integration lane L8) — via SharedModule and UIModule imports.
 */
@NgModule({
  declarations: [
    ClientsListComponent,
    ClientDetailComponent,
    ClientFormComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModalModule,
    NgbPaginationModule,
    SharedModule,
    UIModule,
    TranslateModule,
    ClientsRoutingModule,
  ],
})
export class ClientsModule {}