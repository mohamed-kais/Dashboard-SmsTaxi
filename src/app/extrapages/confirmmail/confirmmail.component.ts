import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'app-confirmmail',
    templateUrl: './confirmmail.component.html',
    styleUrls: ['./confirmmail.component.scss'],
    standalone: false
})
export class ConfirmmailComponent implements OnInit {
  // set the currenr year
  year: number = new Date().getFullYear();
  constructor() { }

  ngOnInit(): void {
    document.body.classList.remove('auth-body-bg')
  }

}
