import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-page404',
    templateUrl: './page404.component.html',
    styleUrls: ['./page404.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})

/**
 * PAges-404 component
 */
export class Page404Component implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
