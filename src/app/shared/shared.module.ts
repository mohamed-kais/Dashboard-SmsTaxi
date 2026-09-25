import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TranslatePipe } from '@ngx-translate/core';

import { UIModule } from './ui/ui.module';

import { WidgetModule } from './widget/widget.module';

/**
 * Shared module — barrel for the shared building blocks (integration lane L8).
 *
 * Exports UIModule (app-page-title, app-loader, th[sortable]) and WidgetModule
 * (app-stat, app-transaction) so a feature module that imports SharedModule
 * gets everything the shared layer offers in one import.
 */
@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    TranslatePipe,
    UIModule,
    WidgetModule
  ],
  exports: [
    UIModule,
    WidgetModule,
    TranslatePipe
  ],
})

export class SharedModule { }
