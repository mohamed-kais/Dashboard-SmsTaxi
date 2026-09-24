import { MenuItem } from './menu.model';

// Sidebar navigation for the SMS Taxi Ops Dashboard.
//
// Groups follow IMPLEMENTATION_PLAN §4 exactly:
//   Overview / Fleet / Operations / Alerts / System
// Groups are rendered as `menu-title` entries (item.isTitle) and the feature
// links sit flat beneath each title (sidebar.component.html supports titles +
// direct `side-nav-link-ref` links). Labels are plain English — the translate
// pipe passes unknown keys through as-is, so no i18n entries are required.
// Icons are verified against src/assets/scss/custom/plugins/icons/_boxicons.scss.
export const MENU: MenuItem[] = [
  // ── Overview ────────────────────────────────────────────────
  { id: 1, isTitle: true, label: 'Overview' },
  {
    id: 2,
    label: 'Dashboard',
    icon: 'bx-home-circle',
    link: '/dashboard',
  },

  // ── Fleet ───────────────────────────────────────────────────
  { id: 3, isTitle: true, label: 'Fleet' },
  {
    id: 4,
    label: 'Taxis',
    icon: 'bxs-taxi',
    link: '/taxis',
  },
  {
    id: 5,
    label: 'Clients',
    icon: 'bx-user',
    link: '/clients',
  },
  {
    id: 6,
    label: 'Ratings',
    icon: 'bx-star',
    link: '/ratings',
  },

  // ── Operations ──────────────────────────────────────────────
  { id: 7, isTitle: true, label: 'Operations' },
  {
    id: 8,
    label: 'Demands',
    icon: 'bx-message-dots',
    link: '/demands',
  },
  {
    id: 9,
    label: 'Offers',
    icon: 'bx-purchase-tag',
    link: '/offers',
  },
  {
    id: 10,
    label: 'Reservations',
    icon: 'bx-calendar',
    link: '/reservations',
  },
  {
    id: 11,
    label: 'SMS Log',
    icon: 'bx-message',
    link: '/sms-log',
  },

  // ── Alerts ──────────────────────────────────────────────────
  { id: 12, isTitle: true, label: 'Alerts' },
  {
    id: 13,
    label: 'SOS',
    icon: 'bx-error-circle',
    link: '/sos',
  },
  {
    id: 13,
    label: 'Notifications',
    icon: 'bx-bell',
    link: '/notifications',
  },
  {
    id: 14,
    label: 'WhatsApp',
    icon: 'bx-chat',
    link: '/whatsapp',
  },

  // ── System ──────────────────────────────────────────────────
  { id: 14, isTitle: true, label: 'System' },
  {
    id: 15,
    label: 'Settings',
    icon: 'bx-cog',
    link: '/settings',
  },
];
