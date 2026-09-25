import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-page500',
    templateUrl: './page500.component.html',
    styleUrls: ['./page500.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [RouterLink]
})

/**
 * Pages-500 component
 */
export class Page500Component implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
