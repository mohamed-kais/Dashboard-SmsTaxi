import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-stat',
    templateUrl: './stat.component.html',
    styleUrls: ['./stat.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class StatComponent implements OnInit {

  @Input() title: string;
  @Input() value: string;
  @Input() icon: string;

  constructor() { }

  ngOnInit() {
  }

}
