import { ChatMessage } from '../../../core/models/chat.model';

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  );
}

/** Retourne "Aujourd'hui", "Hier", ou la date complète en français. */
export function dateLabel(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (isSameDay(date, today)) {
    return "Aujourd'hui";
  }
  if (isSameDay(date, yesterday)) {
    return 'Hier';
  }
  return date.toLocaleDateString('fr-FR', {
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
export function groupMessagesByDate(messages: ChatMessage[]): MessageGroup[] {
  const groups: MessageGroup[] = [];
  for (const message of messages) {
    const label = dateLabel(message.createdAt);
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.label === label) {
      lastGroup.messages.push(message);
    } else {
      groups.push({ label, messages: [message] });
    }
  }
  return groups;
}
