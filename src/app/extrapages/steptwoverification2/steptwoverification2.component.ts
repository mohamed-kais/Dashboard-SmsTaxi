import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { OwlOptions, CarouselModule } from 'ngx-owl-carousel-o';
import { RouterLink } from '@angular/router';
import { NgOtpInputModule } from 'ng-otp-input';

@Component({
    selector: 'app-steptwoverification2',
    templateUrl: './steptwoverification2.component.html',
    styleUrls: ['./steptwoverification2.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [CarouselModule, RouterLink, NgOtpInputModule]
})
export class Steptwoverification2Component implements OnInit {

  constructor() { }
  // set the currenr year
  year: number = new Date().getFullYear();
  ngOnInit(): void {
  }
  config = {
    allowNumbersOnly: true,
    length: 4,
    isPasswordInput: false,
    disableAutoFocus: false,
    placeholder: '',
    inputStyles: {
      'width': '80px',
      'height': '50px'
    }
  };
  carouselOption: OwlOptions = {
    items: 1,
    loop: false,
    margin: 0,
    nav: false,
    dots: true,
    responsive: {
      680: {
        items: 1
      },
    }
  }
}
