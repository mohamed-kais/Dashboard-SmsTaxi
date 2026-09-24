import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs/operators';

import { TaxiService } from '../../core/services/taxi.service';
import { TAXI_STATUS_VALUES } from '../../core/constants/status-badges';
import { ChannelType } from '../../core/models/common.model';
import { TaxiCreateDto } from '../../core/models/taxi.model';

/** Spec pattern for taxi `telephone`: `^[0-9+\-\s()]+$`. */
const PHONE_PATTERN = '^[0-9+\\-\\s()]+$';

/**
 * Create / edit taxi modal (plan §5.2 "taxi-form"). Reactive form over
 * `TaxiCreateDto` fields with the spec's validators; on submit it POSTs
 * `/api/add-taxi` or PATCHes `/api/update-taxi/{id}` and closes with the
 * saved `TaxiDto`.
 */
@Component({
  selector: 'app-taxi-form-modal',
  templateUrl: './taxi-form-modal.component.html',
})
export class TaxiFormModalComponent implements OnInit {
  /** Set when editing an existing taxi. */
  taxiId?: number;
  /** Pre-fill source (a list row or a full taxi). */
  initial?: Partial<TaxiCreateDto>;

  form!: FormGroup;
  submitted = false;
  saving = false;
  errorMessage = '';

  readonly channelTypes: ChannelType[] = ['GSM', 'SMART', 'WHATSAPP', 'WHATSAPP_AR'];
  readonly taxiStatuses = TAXI_STATUS_VALUES;

  constructor(
    public readonly activeModal: NgbActiveModal,
    private readonly fb: FormBuilder,
    private readonly taxiService: TaxiService,
    private readonly translate: TranslateService
  ) {}

  get f(): { [key: string]: AbstractControl } {
    return this.form.controls as { [key: string]: AbstractControl };
  }

  get isEdit(): boolean {
    return this.taxiId != null;
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      telephone: ['', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
      nom: ['', [Validators.maxLength(100)]],
      email: ['', [Validators.email]],
      type: [null],
      taxiStatus: [null],
      numeroTaxi: ['', [Validators.maxLength(20)]],
      numeroMatricule: ['', [Validators.maxLength(50)]],
      numeroCin: ['', [Validators.maxLength(20)]],
      constructeur: ['', [Validators.maxLength(50)]],
      destination: ['', [Validators.maxLength(500)]],
      location: ['', [Validators.maxLength(500)]],
      contenu: ['', [Validators.maxLength(1000)]],
    });
    if (this.initial) {
      const patch = { ...this.initial } as Record<string, unknown>;
      delete patch.id;
      this.form.patchValue(patch);
    }
  }

  submit(): void {
    this.submitted = true;
    this.errorMessage = '';
    if (this.form.invalid) {
      return;
    }
    this.saving = true;
    const dto = this.form.value as TaxiCreateDto;
    const request$ =
      this.isEdit && this.taxiId != null
        ? this.taxiService.updateTaxi(this.taxiId, dto)
        : this.taxiService.createTaxi(dto);
    request$
      .pipe(
        finalize(() => {
          this.saving = false;
        })
      )
      .subscribe({
        next: (saved) => this.activeModal.close(saved),
        error: (err) => {
          this.errorMessage = err?.error?.message || err?.message || this.translate.instant('taxis.form.saveFailed');
        },
      });
  }
}