import { Component, EventEmitter, Input, OnDestroy, Output, ChangeDetectionStrategy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ChatService } from '../../../../core/services/chat.service';
import {
  ChatMessage,
  ContactType,
  Conversation,
  SendMessageRequest,
} from '../../../../core/models/chat.model';

/**
 * Zone de saisie : textarea + bouton d'envoi (Entrée envoie, Maj+Entrée = saut
 * de ligne, comme WhatsApp Web). Désactivée quand aucune conversation n'est
 * active ou pendant l'envoi.
 *
 * Le ChatStateService de CETTE app n'expose pas de sendMessage (variante NBA) :
 * on compose donc un SendMessageRequest depuis la conversation active et on
 * appelle ChatService.sendMessage. Le message créé est réémis via `sent` pour
 * que chat-window l'intègre sans attendre l'écho WebSocket.
 */
@Component({
    selector: 'app-message-input',
    templateUrl: './message-input.component.html',
    styleUrls: ['./message-input.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class MessageInputComponent implements OnDestroy {
  /** Conversation destinataire (null = saisie désactivée). */
  @Input() conversation: Conversation | null = null;
  /** Message créé par le backend après un envoi réussi. */
  @Output() sent = new EventEmitter<ChatMessage>();
  /** Émis quand l'envoi échoue (chat-window affiche le bandeau d'erreur). */
  @Output() sendError = new EventEmitter<void>();

  content = '';
  sending = false;

  private sendSubscription?: Subscription;

  constructor(private chatService: ChatService) {}

  get disabled(): boolean {
    return !this.conversation || this.sending;
  }

  ngOnDestroy(): void {
    this.sendSubscription?.unsubscribe();
  }

  onSubmit(): void {
    const trimmed = this.content.trim();
    if (!trimmed || this.disabled || !this.conversation) {
      return;
    }
    const request: SendMessageRequest = {
      waId: this.conversation.waId,
      content: trimmed,
      // Le contact existe déjà à ce stade (la conversation est ouverte) :
      // ce champ ne sert qu'à la création initiale d'un contact côté backend.
      contactType: ContactType.AUTRE,
      contactName: this.conversation.contactName,
    };

    this.sending = true;
    this.sendSubscription?.unsubscribe();
    this.sendSubscription = this.chatService.sendMessage(request).subscribe({
      next: (message) => {
        this.sending = false;
        this.content = '';
        this.sent.emit(message);
      },
      error: (err) => {
        console.error("Erreur lors de l'envoi du message", err);
        this.sending = false;
        this.sendError.emit();
      },
    });
  }

  onKeyDown(event: KeyboardEvent): void {
    // Entrée envoie, Maj+Entrée fait un saut de ligne (comme WhatsApp Web).
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onSubmit();
    }
  }
}
