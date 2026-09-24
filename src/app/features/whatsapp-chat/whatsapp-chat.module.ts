import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { UIModule } from '../../shared/ui/ui.module';

import { WhatsappChatRoutingModule } from './whatsapp-chat-routing.module';
import { ChatLayoutComponent } from './components/chat-layout/chat-layout.component';
import { EmptyChatComponent } from './components/empty-chat/empty-chat.component';
import { ConversationListComponent } from './components/conversation-list/conversation-list.component';
import { ChatWindowComponent } from './components/chat-window/chat-window.component';
import { MessageBubbleComponent } from './components/message-bubble/message-bubble.component';
import { MessageInputComponent } from './components/message-input/message-input.component';

@NgModule({
  declarations: [
    ChatLayoutComponent,
    EmptyChatComponent,
    ConversationListComponent,
    ChatWindowComponent,
    MessageBubbleComponent,
    MessageInputComponent,
  ],
  imports: [CommonModule, FormsModule, UIModule, WhatsappChatRoutingModule],
})
export class WhatsappChatModule {}
