import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { UIModule } from '../../shared/ui/ui.module';
import { WidgetModule } from '../../shared/widget/widget.module';

import { RatingsRoutingModule } from './ratings-routing.module';
import { RatingsListComponent } from './ratings-list.component';
import { DriverRatingsComponent } from './driver-ratings.component';

/**
 * Ratings — plan §5.6 (docs/IMPLEMENTATION_PLAN.md).
 * Lazy-loaded under the `ratings` route by the integration lane (L8);
 * module-internal routes: `''` → driver lookup, `driver/:id` → per-driver detail.
 */
@NgModule({
  declarations: [RatingsListComponent, DriverRatingsComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    UIModule,
    WidgetModule,
    TranslateModule,
    RatingsRoutingModule,
  ],
})
export class RatingsModule {}