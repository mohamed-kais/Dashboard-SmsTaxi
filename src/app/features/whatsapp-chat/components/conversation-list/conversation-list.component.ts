import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ChangeDetectionStrategy } from '@angular/core';
import { BehaviorSubject, Observable, Subscription, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { ChatStateService } from '../../../../core/services/chat-state.service';
import { Conversation, WhatsAppMessageType } from '../../../../core/models/chat.model';
import { getAvatarColor, getInitials } from '../../utils/avatar.util';

@Component({
    selector: 'app-conversation-list',
    templateUrl: './conversation-list.component.html',
    styleUrls: ['./conversation-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ConversationListComponent implements OnInit, OnDestroy {
  /** Id de la conversation ouverte dans le panneau de droite (surbrillance). */
  @Input() activeId: string | null = null;
  /** Émis quand l'utilisateur choisit une conversation (le layout ouvre chat-window). */
  @Output() selectionChange = new EventEmitter<string>();

  searchTerm = '';
  private readonly searchTermSubject = new BehaviorSubject<string>('');
  filteredConversations$!: Observable<Conversation[]>;
  readonly conversationsError$ = this.chatState.conversationsError$;

  private subscriptions: Subscription[] = [];

  constructor(private chatState: ChatStateService) {}

  ngOnInit(): void {
    this.filteredConversations$ = combineLatest([
      this.chatState.conversations$,
      this.searchTermSubject.asObservable(),
    ]).pipe(map(([conversations, term]) => this.filterConversations(conversations, term)));
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  onSearchChange(term: string): void {
    this.searchTermSubject.next(term);
  }

  onSelect(conversation: Conversation): void {
    this.chatState.setActiveConversation(conversation.id);
    this.selectionChange.emit(conversation.id);
  }

  trackById(_index: number, conversation: Conversation): string {
    return conversation.id;
  }

  displayName(conversation: Conversation): string {
    return conversation.contactName?.trim() || conversation.waId;
  }

  initials(conversation: Conversation): string {
    return getInitials(this.displayName(conversation));
  }

  avatarColor(conversation: Conversation): string {
    return getAvatarColor(conversation.waId);
  }

  /** Aperçu du dernier message : libellé média si c'en est un, sinon le texte. */
  previewText(conversation: Conversation): string {
    switch (conversation.lastMessageType) {
      case WhatsAppMessageType.IMAGE:
        return 'Photo';
      case WhatsAppMessageType.VIDEO:
        return 'Vidéo';
      case WhatsAppMessageType.AUDIO:
        return 'Message vocal';
      case WhatsAppMessageType.DOCUMENT:
        return 'Document';
      case WhatsAppMessageType.STICKER:
        return 'Sticker';
      case WhatsAppMessageType.LOCATION:
        return 'Localisation';
      case WhatsAppMessageType.CONTACTS:
        return 'Contact';
      default:
        return conversation.lastMessage || 'Aucun message';
    }
  }

  private filterConversations(conversations: Conversation[], term: string): Conversation[] {
    const sorted = [...(conversations ?? [])].sort((a, b) => {
      const dateA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const dateB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return dateB - dateA;
    });
    const normalized = term.trim().toLowerCase();
    if (!normalized) {
      return sorted;
    }
    return sorted.filter(
      (conv) =>
        this.displayName(conv).toLowerCase().includes(normalized) ||
        conv.waId.includes(normalized) ||
        (conv.lastMessage ?? '').toLowerCase().includes(normalized)
    );
  }
}
