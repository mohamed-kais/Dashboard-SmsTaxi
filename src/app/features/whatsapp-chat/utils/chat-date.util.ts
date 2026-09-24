import { ChatMessage } from '../../../core/models/chat.model';
import { TranslateService } from '@ngx-translate/core';

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  );
}

/** Returns "Today", "Yesterday", or the full date in the active locale. */
export function dateLabel(iso: string, translate?: TranslateService): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (isSameDay(date, today)) {
    return translate ? translate.instant('whatsapp.date.today') : 'Today';
  }
  if (isSameDay(date, yesterday)) {
    return translate ? translate.instant('whatsapp.date.yesterday') : 'Yesterday';
  }
  const locale = translate ? translate.currentLang : 'fr-FR';
  return date.toLocaleDateString(locale, {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export interface MessageGroup {
  label: string;
  messages: ChatMessage[];
}

/**
 * Regroupe les messages par jour pour afficher les séparateurs de date
 * dans la fenêtre de discussion, comme WhatsApp.
 */
export function groupMessagesByDate(messages: ChatMessage[], translate?: TranslateService): MessageGroup[] {
  const groups: MessageGroup[] = [];
  for (const message of messages) {
    const label = dateLabel(message.createdAt, translate);
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.label === label) {
      lastGroup.messages.push(message);
    } else {
      groups.push({ label, messages: [message] });
    }
  }
  return groups;
}
