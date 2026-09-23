import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { SosService } from '../../../core/services/sos.service';
import { apiErrorMessage } from '../sos.constants';

/**
 * SOS / Alerts panel (plan §5.8).
 *
 * The spec documents EXACTLY ONE SOS endpoint — POST /api/sosNotification/{id}
 * (trigger an SMS alert for a taxi by ID). There is NO SOS list, live feed or
 * acknowledge endpoint, so this page deliberately does NOT fake them:
 *
 *   (a) an info card explains that live alerting is not yet available
 *       (spec gap → ROADMAP),
 *   (b) a trigger form calls the one documented endpoint,
 *   (c) a static "alert protocol" reference card (pure UI text), and
 *   (d) a disabled, clearly-labelled sample-row area showing where a future
 *       alert list will render — no fake data, no acknowledge action.
 */
@Component({
  selector: 'app-sos-panel',
  templateUrl: './sos-panel.component.html',
})
export class SosPanelComponent implements OnInit {
  breadCrumbItems: { label: string; active: boolean }[] = [
    { label: 'Alerts', active: false },
    { label: 'SOS', active: true },
  ];

  form!: FormGroup;
  submitted = false;
  sending = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private formBuilder: FormBuilder,
    private sosService: SosService
  ) {}

  get f(): FormGroup['controls'] {
    return this.form.controls;
  }

  ngOnInit(): void {
    this.form = this.formBuilder.group({
      // POST /api/sosNotification/{id} — id is an int32 taxi ID per spec.
      taxiId: [null, [Validators.required, Validators.min(1)]],
    });
  }

  triggerSos(): void {
    this.submitted = true;
    this.successMessage = '';
    this.errorMessage = '';
    if (this.form.invalid) {
      return;
    }

    this.sending = true;
    const id = Number(this.f.taxiId.value);
    this.sosService.notifySos(id).subscribe({
      next: (res) => {
        this.sending = false;
        this.successMessage = res || 'SOS notification sent.';
      },
      error: (err) => {
        this.sending = false;
        this.errorMessage = apiErrorMessage(err) || 'Failed to send the SOS notification.';
      },
    });
  }
}
