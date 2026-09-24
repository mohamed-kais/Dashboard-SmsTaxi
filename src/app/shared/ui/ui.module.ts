import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';

import { NgbCollapseModule, NgbDatepickerModule, NgbTimepickerModule, NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

import { NgbdSortableHeader } from '../../core/directives/sortable.directive';

import { PagetitleComponent } from './pagetitle/pagetitle.component';
import { LoaderComponent } from './loader/loader.component';

/**
 * Shared UI building blocks.
 *
 * `NgbdSortableHeader` (`th[sortable]`, salvaged core directive — plan §3) is
 * declared HERE, exactly once, and exported (integration lane L8). Angular AOT
 * rejects a directive declared in 2+ modules, so feature modules must NOT
 * declare it — they get it by importing UIModule (or SharedModule, which
 * re-exports UIModule). If any feature module is ever made eager, keep this
 * as the single declaration.
 */
@NgModule({
  declarations: [PagetitleComponent, LoaderComponent, NgbdSortableHeader],
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    NgbCollapseModule,
    NgbDatepickerModule,
    NgbTimepickerModule,
    NgbDropdownModule
  ],
  exports: [PagetitleComponent, LoaderComponent, NgbdSortableHeader, TranslateModule]
})
export class UIModule { }
