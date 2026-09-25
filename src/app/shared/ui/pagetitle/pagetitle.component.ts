import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
    selector: 'app-page-title',
    templateUrl: './pagetitle.component.html',
    styleUrls: ['./pagetitle.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [TranslatePipe]
})
export class PagetitleComponent implements OnInit {

  @Input() breadcrumbItems;
  @Input() title: string;

  constructor() { }

  ngOnInit() {
  }

}
