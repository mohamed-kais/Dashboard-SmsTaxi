import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { OwlOptions, CarouselModule } from 'ngx-owl-carousel-o';
import { UntypedFormBuilder, UntypedFormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthenticationService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';
import { NgbAlert } from '@ng-bootstrap/ng-bootstrap';
import { NgClass } from '@angular/common';

@Component({
    selector: 'app-recoverpwd2',
    templateUrl: './recoverpwd2.component.html',
    styleUrls: ['./recoverpwd2.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [CarouselModule, RouterLink, FormsModule, ReactiveFormsModule, NgbAlert, NgClass]
})
export class Recoverpwd2Component implements OnInit {

   // set the currenr year
   year: number = new Date().getFullYear();

   resetForm: UntypedFormGroup;
   submitted = false;
   error = '';
   success = '';
   loading = false;

   constructor(private formBuilder: UntypedFormBuilder, private route: ActivatedRoute, private router: Router, private authenticationService: AuthenticationService) { }

  ngOnInit(): void {
    this.resetForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  // convenience getter for easy access to form fields
  get f() { return this.resetForm.controls; }

  /**
   * On submit form
   */
  onSubmit() {
    this.success = '';
    this.submitted = true;

    // stop here if form is invalid
    if (this.resetForm.invalid) {
      return;
    }
    if (environment.defaultauth === 'firebase') {
      this.authenticationService.resetPassword(this.f.email.value)
        .catch(error => {
          this.error = error ? error : '';
        });
    }
  }

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
