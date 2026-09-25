import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-confirmmail',
    templateUrl: './confirmmail.component.html',
    styleUrls: ['./confirmmail.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [RouterLink]
})
export class ConfirmmailComponent implements OnInit {
  // set the currenr year
  year: number = new Date().getFullYear();
  constructor() { }

  ngOnInit(): void {
    document.body.classList.remove('auth-body-bg')
  }

}
