import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-lockscreen',
    templateUrl: './lockscreen.component.html',
    styleUrls: ['./lockscreen.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [RouterLink]
})

/**
 * Lock-screen component
 */
export class LockscreenComponent implements OnInit {

  // set the currenr year
  year: number = new Date().getFullYear();

  constructor() { }

  ngOnInit(): void {
  }

}
