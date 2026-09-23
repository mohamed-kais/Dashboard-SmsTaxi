import { MenuItem } from './menu.model';

// Horizontal (topbar) navigation — mirrors the sidebar structure from
// IMPLEMENTATION_PLAN §4 (Overview / Fleet / Operations / Alerts / System).
// The horizontal MenuItem model has no `isTitle`, so each group is a top-level
// dropdown item whose subItems are the feature links. Labels are plain English
// (the translate pipe passes unknown keys through). Icons are the same ones
// verified for the sidebar in _boxicons.scss. No dead demo links remain.
export const MENU: MenuItem[] = [
  {
    id: 1,
    label: 'Overview',
    icon: 'bx-home-circle',
    subItems: [
      { id: 2, label: 'Dashboard', link: '/dashboard', parentId: 1 },
    ],
  },
  {
    id: 3,
    label: 'Fleet',
    icon: 'bxs-taxi',
    subItems: [
      { id: 4, label: 'Taxis', link: '/taxis', parentId: 3 },
      { id: 5, label: 'Clients', link: '/clients', parentId: 3 },
      { id: 6, label: 'Ratings', link: '/ratings', parentId: 3 },
    ],
  },
  {
    id: 7,
    label: 'Operations',
    icon: 'bx-list-check',
    subItems: [
      { id: 8, label: 'Demands', link: '/demands', parentId: 7 },
      { id: 9, label: 'Offers', link: '/offers', parentId: 7 },
      { id: 10, label: 'Reservations', link: '/reservations', parentId: 7 },
      { id: 11, label: 'SMS Log', link: '/sms-log', parentId: 7 },
    ],
  },
  {
    id: 12,
    label: 'Alerts',
    icon: 'bx-error-circle',
    subItems: [
      { id: 13, label: 'SOS', link: '/sos', parentId: 12 },
    ],
  },
  {
    id: 14,
    label: 'System',
    icon: 'bx-cog',
    subItems: [
      { id: 15, label: 'Settings', link: '/settings', parentId: 14 },
    ],
  },
];
