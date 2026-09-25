import {
  AfterViewChecked,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
  ChangeDetectionStrategy
} from '@angular/core';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { ChatService } from '../../../../core/services/chat.service';
import { ChatStateService } from '../../../../core/services/chat-state.service';
import { ChatWebSocketService } from '../../../../core/services/chat-websocket.service';
import { ChatMessage, Conversation } from '../../../../core/models/chat.model';
import { groupMessagesByDate, MessageGroup } from '../../utils/chat-date.util';
import { getAvatarColor, getInitials } from '../../utils/avatar.util';
import { MessageBubbleComponent } from '../message-bubble/message-bubble.component';
import { MessageInputComponent } from '../message-input/message-input.component';

/**
 * Panneau de droite : en-tête du contact, historique groupé par date,
 * temps réel (nouveaux messages + statuts) et zone de saisie.
 *
 * La conversation à afficher arrive par @Input (pilotée par ChatLayoutComponent),
 * pas par la route — la route lazy du module se limite à path '' -> ChatLayoutComponent.
 */
@Component({
    selector: 'app-chat-window',
    templateUrl: './chat-window.component.html',
    styleUrls: ['./chat-window.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [MessageBubbleComponent, MessageInputComponent, TranslatePipe]
})
export class ChatWindowComponent implements OnInit, OnChanges, OnDestroy, AfterViewChecked {
  @ViewChild('scrollContainer') private scrollContainer?: ElementRef<HTMLDivElement>;

  @Input() conversationId: string | null = null;
  /** Émis par le bouton retour (visible sur écrans étroits). */
  @Output() back = new EventEmitter<void>();

  conversation: Conversation | null = null;
  messages: ChatMessage[] = [];
  loading = false;
  errorMessage: string | null = null;
  connected = true;

  private currentConversationId: string | null = null;
  private shouldScrollToBottom = false;
  private subscriptions: Subscription[] = [];
  /** Abonnements liés à la conversation ouverte (à jeter à chaque changement). */
  private conversationSubscriptions: Subscription[] = [];

  constructor(
    private chatService: ChatService,
    private chatWebSocketService: ChatWebSocketService,
    private chatState: ChatStateService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    // Rafraîchit l'en-tête quand la liste des conversations évolue
    // (ex : contact renommé, compteur non-lus remis à zéro).
    this.subscriptions.push(
      this.chatState.conversations$.subscribe((list) => {
        if (this.currentConversationId) {
          this.conversation =
            list.find((c) => c.id === this.currentConversationId) ?? this.conversation;
        }
      })
    );
    this.subscriptions.push(
      this.chatWebSocketService.connectionStatus$.subscribe(
        (status) => (this.connected = status)
      )
    );
    if (this.conversationId) {
      this.openConversation(this.conversationId);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['conversationId'] && !changes['conversationId'].isFirstChange()) {
      const id = changes['conversationId'].currentValue as string | null;
      if (id) {
        this.openConversation(id);
      }
    }
  }

  ngOnDestroy(): void {
    this.clearConversationSubscriptions();
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    if (this.currentConversationId) {
      this.chatWebSocketService.unsubscribeFromConversation(this.currentConversationId);
    }
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  private openConversation(conversationId: string): void {
    if (this.currentConversationId === conversationId) {
      return;
    }
    if (this.currentConversationId) {
      this.chatWebSocketService.unsubscribeFromConversation(this.currentConversationId);
    }
    this.clearConversationSubscriptions();

    this.currentConversationId = conversationId;
    this.messages = [];
    this.errorMessage = null;
    this.conversation = this.chatState.getConversationById(conversationId) ?? null;
    this.chatState.setActiveConversation(conversationId);

    this.loadMessages(conversationId);
    this.listenRealtime(conversationId);
  }

  private loadMessages(conversationId: string): void {
    this.loading = true;
    const sub = this.chatService.getMessages(conversationId).subscribe({
      next: (messages) => {
        this.messages = messages ?? [];
        this.loading = false;
        this.shouldScrollToBottom = true;
      },
      error: (err) => {
        console.error('Erreur chargement des messages', err);
        this.loading = false;
        this.errorMessage = this.translate.instant('whatsapp.chat.loadFail');
      },
    });
    this.conversationSubscriptions.push(sub);
  }

  private listenRealtime(conversationId: string): void {
    this.conversationSubscriptions.push(
      this.chatWebSocketService.subscribeToConversation(conversationId).subscribe((message) => {
        if (message && message.conversationId === conversationId) {
          this.upsertMessage(message);
          this.shouldScrollToBottom = true;
        }
      })
    );
    this.conversationSubscriptions.push(
      this.chatWebSocketService.subscribeToConversationStatus(conversationId).subscribe((message) => {
        if (message && message.conversationId === conversationId) {
          this.upsertMessage(message);
        }
      })
    );
    // Filet de sécurité : le flux global couvre aussi les statuts et les
    // messages qui arriveraient hors topic dédié.
    this.conversationSubscriptions.push(
      this.chatWebSocketService.globalConversationUpdates$.subscribe((message) => {
        if (message && message.conversationId === conversationId) {
          this.upsertMessage(message);
          this.shouldScrollToBottom = true;
        }
      })
    );
  }

  private clearConversationSubscriptions(): void {
    this.conversationSubscriptions.forEach((sub) => sub.unsubscribe());
    this.conversationSubscriptions = [];
  }

  /** Ajoute le message s'il est nouveau, ou met à jour son statut s'il existe déjà. */
  private upsertMessage(message: ChatMessage): void {
    const idx = this.messages.findIndex((m) => m.id === message.id);
    if (idx === -1) {
      this.messages = [...this.messages, message];
    } else {
      const updated = [...this.messages];
      updated[idx] = message;
      this.messages = updated;
    }
  }

  get groupedMessages(): MessageGroup[] {
    return groupMessagesByDate(this.messages, this.translate);
  }

  trackByMessageId(_index: number, message: ChatMessage): string {
    return message.id;
  }

  trackByGroup(_index: number, group: MessageGroup): string {
    return group.label;
  }

  get headerName(): string {
    return this.conversation?.contactName?.trim() || this.conversation?.waId || '';
  }

  get headerInitials(): string {
    return getInitials(this.headerName);
  }

  get headerAvatarColor(): string {
    return getAvatarColor(this.conversation?.waId);
  }

  /** Message envoyé depuis message-input : on l'intègre sans attendre le WebSocket. */
  onSent(message: ChatMessage): void {
    if (message) {
      this.upsertMessage(message);
      this.shouldScrollToBottom = true;
    }
  }

  onSendError(): void {
    this.errorMessage = this.translate.instant('whatsapp.chat.sendFail');
  }

  onBack(): void {
    this.back.emit();
  }

  private scrollToBottom(): void {
    if (this.scrollContainer) {
      const el = this.scrollContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }
}
