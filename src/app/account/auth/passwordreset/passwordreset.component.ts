import { Component, OnInit, AfterViewInit, ChangeDetectionStrategy } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthenticationService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';
import { NgbAlert } from '@ng-bootstrap/ng-bootstrap';
import { NgClass } from '@angular/common';

@Component({
    selector: 'app-passwordreset',
    templateUrl: './passwordreset.component.html',
    styleUrls: ['./passwordreset.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [RouterLink, FormsModule, ReactiveFormsModule, NgbAlert, NgClass]
})

/**
 * Reset-password component
 */
export class PasswordresetComponent implements OnInit, AfterViewInit {

  resetForm: UntypedFormGroup;
  submitted = false;
  error = '';
  success = '';
  loading = false;

  // set the currenr year
  year: number = new Date().getFullYear();

  // tslint:disable-next-line: max-line-length
  constructor(private formBuilder: UntypedFormBuilder, private route: ActivatedRoute, private router: Router, private authenticationService: AuthenticationService) { }

  ngOnInit() {

    this.resetForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  ngAfterViewInit() {
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
}
