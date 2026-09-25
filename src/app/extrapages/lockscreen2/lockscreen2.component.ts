import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { OwlOptions, CarouselModule } from 'ngx-owl-carousel-o';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-lockscreen2',
    templateUrl: './lockscreen2.component.html',
    styleUrls: ['./lockscreen2.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [CarouselModule, RouterLink]
})
export class Lockscreen2Component implements OnInit {

  constructor() { }
  // set the currenr year
  year: number = new Date().getFullYear();

  ngOnInit(): void { }

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
