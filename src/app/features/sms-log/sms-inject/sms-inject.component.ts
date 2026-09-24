import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';

import { SmsInDto } from '../../../core/models/sms.model';
import { SmsService } from '../../../core/services/sms.service';
import {
  SMS_CONTENU_MAXLENGTH,
  SMS_PHONE_PATTERN,
  apiErrorMessage,
} from '../sms-log.constants';

/**
 * SMS injection form (plan §5.7) — route `sms-log/inject`.
 *
 * Posts to POST /api/inject-sms (spec §14 Injection), the documented endpoint
 * for testing / external SMS gateway integration. Request type is the spec's
 * `SmsInDto`:
 *   - telephone — required, pattern `^[0-9+\-\s()]+$`
 *   - contenu   — required, ≤1000
 *   - dateReception (optional date-time), traitement (optional boolean) and id
 *     are NOT collected: they are optional in the spec and the backend
 *     defaults them (server-side receipt state) — nothing invented.
 *
 * All three statuses (200/400/500) return `MessageResponse` ({ message });
 * success surfaces that message in the green alert, failures surface
 * `ErrorResponseDto`/`MessageResponse` text (via ErrorInterceptor) in the red
 * alert (plan §8 error handling).
 */
@Component({
  selector: 'app-sms-inject',
  templateUrl: './sms-inject.component.html',
})
export class SmsInjectComponent implements OnInit {
  breadCrumbItems: { label: string; active: boolean }[] = [
    { label: 'Operations', active: false },
    { label: 'SMS Log', active: false },
    { label: 'Inject SMS', active: true },
  ];

  form!: FormGroup;
  submitted = false;
  submitting = false;
  successMessage = '';
  errorMessage = '';

  readonly phonePattern = SMS_PHONE_PATTERN;
  readonly maxContent = SMS_CONTENU_MAXLENGTH;

  constructor(
    private formBuilder: FormBuilder,
    private smsService: SmsService,
    private translate: TranslateService
  ) {}

  get f(): FormGroup['controls'] {
    return this.form.controls;
  }

  ngOnInit(): void {
    this.form = this.formBuilder.group({
      telephone: ['', [Validators.required, Validators.pattern(SMS_PHONE_PATTERN)]],
      contenu: ['', [Validators.required, Validators.maxLength(SMS_CONTENU_MAXLENGTH)]],
    });
  }

  onSubmit(): void {
    this.submitted = true;
    this.successMessage = '';
    this.errorMessage = '';
    if (this.form.invalid) {
      return;
    }

    this.submitting = true;
    const dto: SmsInDto = {
      telephone: String(this.f.telephone.value ?? '').trim(),
      contenu: String(this.f.contenu.value ?? '').trim(),
    };

    this.smsService.injectSms(dto).subscribe({
      next: (res) => {
        this.submitting = false;
        this.successMessage = res?.message || this.translate.instant('sms.inject.saved');
        this.form.reset({ telephone: '', contenu: '' });
        this.submitted = false;
      },
      error: (err) => {
        this.submitting = false;
        this.errorMessage = apiErrorMessage(err) || this.translate.instant('sms.inject.injectFailed');
      },
    });
  }
}
