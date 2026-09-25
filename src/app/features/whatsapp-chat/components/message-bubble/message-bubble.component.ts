import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
} from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ChatService } from '../../../../core/services/chat.service';
import {
  ChatMessage,
  ChatMessageStatus,
  MessageDirection,
  WhatsAppMedia,
} from '../../../../core/models/chat.model';
import { environment } from '../../../../../environments/environment';
import { NgClass, DatePipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';

const MEDIA_TYPES = new Set(['IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT', 'STICKER']);

@Component({
    selector: 'app-message-bubble',
    templateUrl: './message-bubble.component.html',
    styleUrls: ['./message-bubble.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgClass, DatePipe, TranslatePipe]
})
export class MessageBubbleComponent implements OnChanges, OnDestroy {
  @Input() message!: ChatMessage;

  /** URL de média résolue pour le message courant, affichée dans le template. */
  mediaUrl: string | undefined;

  /** URL de média déjà résolues, indexées par message.id. */
  private readonly mediaUrlCache = new Map<string, string>();

  /** Messages dont la requête d'URL est déjà en cours. */
  private readonly mediaUrlLoading = new Set<string>();

  /** Messages dont la résolution d'URL a échoué. */
  private readonly mediaUrlFailed = new Set<string>();

  private destroyed = false;

  /** Signale la destruction du composant pour désabonner les requêtes en cours. */
  private readonly destroy$ = new Subject<void>();

  constructor(
    private chatService: ChatService,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['message']) {
      const previous = changes['message'].previousValue as ChatMessage | undefined;
      // La forme exacte de `media` est définie par le lane services ; on ne
      // compare que l'identifiant stable du média quand il existe, sinon on
      // résout une seule fois par message.
      const previousKey = this.mediaKey(previous);
      const currentKey = this.mediaKey(this.message);
      if (previousKey !== currentKey) {
        this.mediaUrl = undefined;
        this.resolveMediaUrl();
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.destroyed = true;
  }

  get isOutgoing(): boolean {
    return this.message?.direction === MessageDirection.OUT;
  }

  /**
   * Détails média du message (champs définis par `WhatsAppMedia` côté core).
   */
  get media(): WhatsAppMedia | undefined {
    return this.message?.media;
  }

  get statusIconClass(): string {
    switch (this.message?.status) {
      case ChatMessageStatus.PENDING:
        return 'bx bx-time';
      case ChatMessageStatus.SENT:
        return 'bx bx-check';
      case ChatMessageStatus.DELIVERED:
      case ChatMessageStatus.READ:
        return 'bx bx-check-double';
      case ChatMessageStatus.FAILED:
        return 'bx bx-error';
      default:
        return '';
    }
  }

  get statusClass(): string {
    return 'wa-bubble__status--' + String(this.message?.status ?? '').toLowerCase();
  }

  /**
   * Formate une taille en octets : X o / X Ko / X Mo.
   */
  formatFileSize(size?: number): string {
    if (size == null) {
      return '';
    }
    if (size < 1024) {
      return `${size} o`;
    }
    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} Ko`;
    }
    return `${(size / (1024 * 1024)).toFixed(1)} Mo`;
  }

  private mediaKey(message: ChatMessage | undefined): string | undefined {
    if (!message) {
      return undefined;
    }
    const media = message?.media;
    return media?.objectKey ?? media?.mediaId ?? `${message.id}:${message.messageType}`;
  }

  /**
   * Résout l'URL de téléchargement du média du message courant (types
   * IMAGE/VIDEO/AUDIO/DOCUMENT/STICKER uniquement ; les autres types portent
   * leurs données en ligne).
   */
  private resolveMediaUrl(): void {
    if (!this.message || !MEDIA_TYPES.has(this.message.messageType)) {
      return;
    }
    const cached = this.mediaUrlCache.get(this.message.id);
    if (cached) {
      this.mediaUrl = cached;
      return;
    }
    if (this.mediaUrlFailed.has(this.message.id) || this.mediaUrlLoading.has(this.message.id)) {
      return;
    }

    this.mediaUrlLoading.add(this.message.id);

    this.chatService
      .getMediaUrl(this.message.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (this.destroyed) {
            return;
          }
          if (!response?.url) {
            this.mediaUrlFailed.add(this.message.id);
            this.mediaUrlLoading.delete(this.message.id);
            this.changeDetectorRef.markForCheck();
            return;
          }
          const safeUrl = this.toAbsoluteMediaUrl(response.url);
          this.mediaUrlCache.set(this.message.id, safeUrl);
          this.mediaUrl = safeUrl;
          this.mediaUrlLoading.delete(this.message.id);
          this.changeDetectorRef.markForCheck();
        },
        error: (error) => {
          console.error('Erreur getMediaUrl()', this.message?.id, error);
          this.mediaUrlFailed.add(this.message.id);
          this.mediaUrlLoading.delete(this.message.id);
          this.mediaUrl = undefined;
          this.changeDetectorRef.markForCheck();
        },
      });
  }

  /**
   * Rend l'URL exploitable par le navigateur : les URL absolues sont
   * conservées telles quelles ; les URL relatives sont préfixées de l'origine
   * de `environment.whatsappApiUrl` (ex : 'http://41.225.11.231:8085').
   * Aucune réécriture /minio codée en dur (forme exacte non vérifiée).
   */
  private toAbsoluteMediaUrl(url: string): string {
    if (/^https?:\/\//i.test(url)) {
      return url;
    }
    const apiUrl = environment.whatsappApiUrl ?? '';
    let origin = '';
    try {
      origin = apiUrl ? new URL(apiUrl).origin : '';
    } catch {
      origin = '';
    }
    if (!origin) {
      return url;
    }
    return url.startsWith('/') ? `${origin}${url}` : `${origin}/${url}`;
  }
}
