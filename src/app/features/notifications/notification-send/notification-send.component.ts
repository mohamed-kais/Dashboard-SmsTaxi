import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import {
  NotificationChannel,
  NotificationTargetType,
  NotificationType,
  SendNotificationRequest,
} from '../../../core/models/notification.model';
import { NotificationService } from '../../../core/services/notification.service';
import { WhatsappService } from '../../../core/services/whatsapp.service';
import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_TARGET_TYPES,
  NOTIFICATION_TYPES,
  apiErrorMessage,
} from '../notifications.constants';

/**
 * Notification send form (route `notifications/send`).
 *
 * One reactive form, two delivery surfaces:
 *
 *   - CLIENT / TAXI / ADMIN → `NotificationService.send()` (POST
 *     /api/notifications/send) with the SELECTED channel (SMS/EMAIL/PUSH/
 *     WHATSAPP). `targetIds` = comma-separated existing entity ids.
 *
 *   - ANY_TAXI → WhatsApp broadcast to a list of taxi ids, routed through
 *     `NotificationService.send()` with `channel` forced to WHATSAPP. The
 *     `WhatsappService.sendToPhones` manual-send surface (targetType ANYONE)
 *     is dedicated to raw phone numbers (send-any-one), so ANY_TAXI with a
 *     target-id list is the supported convention here.
 *
 *   - ANYONE → raw phone-number WhatsApp manual send via
 *     `WhatsappService.sendToPhones()` (POST /api/notifications/send-any-one);
 *     `targetIds` = comma-separated raw phone numbers, `channel` forced to
 *     WHATSAPP.
 *
 * Feedback style mirrors the sibling send form (sms-inject): inline
 * success/error alerts, no modal.
 */
@Component({
  selector: 'app-notification-send',
  templateUrl: './notification-send.component.html',
})
export class NotificationSendComponent implements OnInit {
  breadCrumbItems: { label: string; active: boolean }[] = [
    { label: 'Alerts', active: false },
    { label: 'Notifications', active: false },
    { label: 'Send', active: true },
  ];

  form!: FormGroup;
  submitted = false;
  submitting = false;
  successMessage = '';
  errorMessage = '';

  readonly types: readonly NotificationType[] = NOTIFICATION_TYPES;
  readonly channels: readonly NotificationChannel[] = NOTIFICATION_CHANNELS;
  readonly targetTypes: readonly NotificationTargetType[] = NOTIFICATION_TARGET_TYPES;

  constructor(
    private formBuilder: FormBuilder,
    private notificationService: NotificationService,
    private whatsappService: WhatsappService
  ) {}

  get f(): FormGroup['controls'] {
    return this.form.controls;
  }

  ngOnInit(): void {
    this.form = this.formBuilder.group({
      title: [''],
      message: ['', [Validators.required]],
      type: ['INFO' as NotificationType, [Validators.required]],
      channel: ['SMS' as NotificationChannel, [Validators.required]],
      targetType: ['CLIENT' as NotificationTargetType, [Validators.required]],
      targetIds: ['', [Validators.required]],
    });
    this.syncChannelForTarget();
  }

  // ---------------------------------------------------------------------------
  // Target-scope → channel coupling
  // ---------------------------------------------------------------------------

  /** ANYONE / ANY_TAXI always go out as WhatsApp (channel locked). */
  isWhatsAppOnly(): boolean {
    const tt = this.f.targetType.value as NotificationTargetType;
    return tt === 'ANYONE' || tt === 'ANY_TAXI';
  }

  /** Re-sync the channel control when the target scope changes. */
  onTargetTypeChange(): void {
    this.syncChannelForTarget();
  }

  private syncChannelForTarget(): void {
    if (this.isWhatsAppOnly()) {
      this.f.channel.setValue('WHATSAPP' as NotificationChannel);
      this.f.channel.disable();
    } else {
      this.f.channel.enable();
    }
  }

  /** Plain-language hint for the currently selected target scope. */
  modeHint(): string {
    switch (this.f.targetType.value as NotificationTargetType) {
      case 'CLIENT':
        return 'Targets existing client accounts. Enter comma-separated client ids; the message is delivered through the selected channel.';
      case 'TAXI':
        return 'Targets existing taxi accounts. Enter comma-separated taxi ids; the message is delivered through the selected channel.';
      case 'ADMIN':
        return 'Targets existing admin accounts. Enter comma-separated admin ids; the message is delivered through the selected channel.';
      case 'ANY_TAXI':
        return 'WhatsApp broadcast to a list of taxi ids. Enter comma-separated taxi ids; the channel is locked to WhatsApp.';
      case 'ANYONE':
        return 'Manual WhatsApp send. Enter comma-separated raw phone numbers (with country code); the channel is locked to WhatsApp.';
      default:
        return '';
    }
  }

  targetIdsPlaceholder(): string {
    return this.f.targetType.value === 'ANYONE'
      ? 'comma-separated phone numbers, e.g. 213661234567, 213771234567'
      : 'comma-separated ids, e.g. 1, 2, 3';
  }

  // ---------------------------------------------------------------------------
  // Submission
  // ---------------------------------------------------------------------------

  onSubmit(): void {
    this.submitted = true;
    this.successMessage = '';
    this.errorMessage = '';
    if (this.form.invalid) {
      return;
    }

    const targetType = this.f.targetType.value as NotificationTargetType;
    const message = String(this.f.message.value ?? '').trim();
    const title = String(this.f.title.value ?? '').trim();
    const type = this.f.type.value as NotificationType;
    const targetIds = this.parseTargetIds(this.f.targetIds.value);

    if (!targetIds.length) {
      this.errorMessage = 'Enter at least one comma-separated target id or phone number.';
      return;
    }

    this.submitting = true;

    // ANYONE → raw phone numbers, WhatsApp manual send (send-any-one).
    if (targetType === 'ANYONE') {
      this.whatsappService.sendToPhones(targetIds, message, title || undefined, type).subscribe({
        next: (res) => this.handleSuccess(res),
        error: (err) => this.handleError(err),
      });
      return;
    }

    // CLIENT / TAXI / ADMIN → /send with the selected channel.
    // ANY_TAXI → /send forced to WHATSAPP (see class doc: the manual-send
    // surface only supports raw-number ANYONE sends).
    const request: SendNotificationRequest = {
      title: title || undefined,
      message,
      type,
      channel:
        targetType === 'ANY_TAXI' ? 'WHATSAPP' : (this.f.channel.value as NotificationChannel),
      targetType,
      targetIds,
    };
    this.notificationService.send(request).subscribe({
      next: (res) => this.handleSuccess(res),
      error: (err) => this.handleError(err),
    });
  }

  /** Comma-separated input → trimmed, non-empty string array. */
  private parseTargetIds(raw: unknown): string[] {
    return String(raw ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  private handleSuccess(res: string): void {
    this.submitting = false;
    this.successMessage = res?.trim() ? res : 'Notification sent.';
    this.form.reset({
      title: '',
      message: '',
      type: 'INFO',
      channel: 'SMS',
      targetType: 'CLIENT',
      targetIds: '',
    });
    this.submitted = false;
    this.syncChannelForTarget();
  }

  private handleError(err: unknown): void {
    this.submitting = false;
    this.errorMessage = apiErrorMessage(err) || 'Failed to send the notification.';
  }
}