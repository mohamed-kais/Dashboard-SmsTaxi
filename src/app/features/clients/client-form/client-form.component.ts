import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';

import { ChannelType } from '../../../core/models/common.model';
import { ClientCreateDto, ClientDto } from '../../../core/models/client.model';
import { ClientService } from '../../../core/services/client.service';
import { CLIENT_PHONE_PATTERN, CLIENT_TYPE_OPTIONS, apiErrorMessage } from '../clients.constants';

/**
 * Add/edit client modal (plan §5.3 customers-style CRUD modal).
 *
 * Add mode:   no `client` input → builds `ClientCreateDto`, calls
 *             POST /api/add-client.
 * Edit mode:  `client` input present → spreads the existing `ClientDto` and
 *             overlays edited fields, calls PUT /api/update-client/{id}
 *             (body is `ClientDto` per spec).
 *
 * Success closes the modal with the saved `ClientDto`; failures surface an
 * inline `ErrorResponseDto.message` alert and the dialog stays open.
 */
@Component({
    selector: 'app-client-form',
    templateUrl: './client-form.component.html',
    standalone: false
})
export class ClientFormComponent implements OnInit {
  @Input() client: ClientDto | null = null;
  @Input() title = '';

  form!: FormGroup;
  submitted = false;
  saving = false;
  errorMessage = '';
  typeOptions = CLIENT_TYPE_OPTIONS;

  constructor(
    private formBuilder: FormBuilder,
    private clientService: ClientService,
    private translate: TranslateService,
    public activeModal: NgbActiveModal
  ) {}

  get f(): FormGroup['controls'] {
    return this.form.controls;
  }

  get isEdit(): boolean {
    return !!this.client?.id;
  }

  ngOnInit(): void {
    // ClientCreateDto fields: telephone, contenu, name, masquerNumero, email, type.
    // ClientCreateDto declares no maxlengths for Clients (API_REFERENCE gap); the
    // limits below mirror the parallel Taxi DTO (contenu ≤1000, name ≤100) + RFC email.
    this.form = this.formBuilder.group({
      telephone: [
        this.client?.telephone ?? '',
        [Validators.required, Validators.pattern(CLIENT_PHONE_PATTERN)],
      ],
      name: [this.nameValue(), [Validators.maxLength(100)]],
      email: [this.client?.email ?? '', [Validators.email, Validators.maxLength(254)]],
      type: [this.client?.type ?? ('SMART' as ChannelType), []],
      masquerNumero: [this.client?.masquerNumero ?? false, []],
      contenu: [this.client?.contenu ?? '', [Validators.maxLength(1000)]],
    });
  }

  save(): void {
    this.submitted = true;
    if (this.form.invalid) {
      return;
    }
    this.saving = true;
    this.errorMessage = '';

    const base: ClientCreateDto = {
      telephone: (this.f.telephone.value as string).trim(),
      name: this.trimOrUndefined(this.f.name.value),
      email: this.trimOrUndefined(this.f.email.value),
      type: this.f.type.value as ChannelType,
      masquerNumero: !!this.f.masquerNumero.value,
      contenu: this.trimOrUndefined(this.f.contenu.value),
    };

    const request = this.isEdit
      ? this.clientService.updateClient(this.client!.id!, this.toClientDto(base))
      : this.clientService.createClient(base);

    request.subscribe({
      next: (saved) => {
        this.saving = false;
        this.activeModal.close(saved);
      },
      error: (err) => {
        this.saving = false;
        this.errorMessage = apiErrorMessage(err) || this.translate.instant('clients.form.saveFailed');
      },
    });
  }

  /** ClientDto body for PUT /update-client: keep server-owned fields, overlay edits. */
  private toClientDto(base: ClientCreateDto): ClientDto {
    return { ...(this.client ?? {}), ...base } as ClientDto;
  }

  private nameValue(): string {
    const raw = this.client ? (this.client as Record<string, unknown>).name : '';
    return typeof raw === 'string' ? raw : '';
  }

  private trimOrUndefined(value: unknown): string | undefined {
    if (value === null || value === undefined) {
      return undefined;
    }
    const trimmed = String(value).trim();
    return trimmed ? trimmed : undefined;
  }
}