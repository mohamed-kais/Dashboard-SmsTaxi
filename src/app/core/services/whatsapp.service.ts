/**
 * WhatsappService — MANUAL-SEND-ONLY surface over the notifications backend.
 * Reuses NotificationService (no duplicated HTTP calls).
 *
 * The separate WhatsApp-chat service (port 8085) is out of scope — no chat
 * methods are built here.
 */
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { NotificationService } from './notification.service';
import { NotificationType, SendNotificationRequest } from '../models/notification.model';

@Injectable({ providedIn: 'root' })
export class WhatsappService {
  constructor(private readonly notificationService: NotificationService) {}

  /**
   * Send a WhatsApp message to arbitrary phone numbers via the
   * `send-any-one` endpoint (targetType `ANYONE`).
   *
   * Guard: empty `phones` is a caller bug (a WHATSAPP broadcast to nobody) —
   * throw rather than issue a pointless API call.
   */
  sendToPhones(
    phones: string[],
    message: string,
    title?: string,
    type: NotificationType = 'INFO'
  ): Observable<string> {
    if (!phones.length) {
      throw new Error('WhatsappService.sendToPhones: phones must not be empty');
    }
    const request: SendNotificationRequest = {
      title,
      message,
      type,
      channel: 'WHATSAPP',
      targetType: 'ANYONE',
      targetIds: phones,
    };
    return this.notificationService.sendAnyOne(request);
  }

  /**
   * Send a WhatsApp broadcast to a managed target (CLIENT/TAXI/ADMIN) via the
   * `send` endpoint. `channel` is enforced to `WHATSAPP` (set if missing).
   */
  sendWhatsApp(request: SendNotificationRequest): Observable<string> {
    const normalized: SendNotificationRequest =
      request.channel === undefined ? { ...request, channel: 'WHATSAPP' } : request;
    return this.notificationService.send(normalized);
  }
}