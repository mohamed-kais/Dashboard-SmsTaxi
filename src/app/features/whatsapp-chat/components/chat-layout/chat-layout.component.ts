import { Component, OnDestroy, OnInit } from '@angular/core';
import { ChatStateService } from '../../../../core/services/chat-state.service';

/**
 * Conteneur racine du module chat : initialise la connexion WebSocket et le
 * chargement des conversations une seule fois (via ChatStateService), puis
 * affiche la liste des conversations + la fenêtre de discussion côte à côte.
 *
 * C'est le SEUL composant du module qui appelle init()/destroy().
 * La sélection de conversation est pilotée par état local (pas par la route) :
 * la route lazy du module se limite à path '' -> ChatLayoutComponent.
 */
@Component({
  selector: 'app-chat-layout',
  templateUrl: './chat-layout.component.html',
  styleUrls: ['./chat-layout.component.scss'],
})
export class ChatLayoutComponent implements OnInit, OnDestroy {
  /** Conversation actuellement ouverte dans le panneau de droite (null = placeholder). */
  activeConversationId: string | null = null;

  breadcrumb: { label: string; active: boolean }[] = [
    { label: 'Taxi', active: false },
    { label: 'WhatsApp', active: true },
  ];

  constructor(private chatState: ChatStateService) {}

  ngOnInit(): void {
    this.chatState.init();
  }

  ngOnDestroy(): void {
    this.chatState.destroy();
  }

  onConversationSelected(conversationId: string): void {
    this.activeConversationId = conversationId;
  }

  /** Retour à la liste (écrans étroits) : referme le panneau de discussion. */
  onBackToList(): void {
    this.activeConversationId = null;
    this.chatState.setActiveConversation(null);
  }
}
