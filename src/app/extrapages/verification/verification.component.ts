import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-verification',
    templateUrl: './verification.component.html',
    styleUrls: ['./verification.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [RouterLink]
})
export class VerificationComponent implements OnInit {

  constructor() { }
  // set the currenr year
  year: number = new Date().getFullYear();
  ngOnInit(): void {
    document.body.classList.remove('auth-body-bg')

  }

}
