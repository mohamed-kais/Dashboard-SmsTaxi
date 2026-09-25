import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-maintenance',
    templateUrl: './maintenance.component.html',
    styleUrls: ['./maintenance.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [RouterLink]
})

/**
 * Maintenance page component
 */
export class MaintenanceComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
