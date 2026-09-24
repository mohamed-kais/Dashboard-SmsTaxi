/**
 * Génère les initiales (max 2 lettres) à afficher dans un avatar
 * quand le contact n'a pas de photo de profil.
 */
export function getInitials(name: string | undefined | null): string {
  if (!name) {
    return '?';
  }
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return '?';
  }
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

const AVATAR_COLORS: string[] = [
  '#556ee6',
  '#00897B',
  '#D81B60',
  '#3949AB',
  '#00ACC1',
  '#E64A19',
  '#43A047',
  '#6D4C41',
  '#5C6BC0',
  '#AD1457',
];

/**
 * Calcule une couleur stable pour un contact donné (même waId/nom = toujours
 * la même couleur d'avatar), comme WhatsApp.
 */
export function getAvatarColor(seed: string | undefined | null): string {
  if (!seed) {
    return AVATAR_COLORS[0];
  }
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}
