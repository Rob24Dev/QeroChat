import type { Status, Contact } from './types';

export const LS_SESSION = 'chatapp.session';
export const LS_USER = 'chatapp.user';
export const LS_TOKEN = 'chatapp.token';
export const LS_THEME = 'chatapp.theme';

export const pick = <T>(a: T[]): T => a[Math.floor(Math.random() * a.length)];

export const initials = (n: string) =>
    n.split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase();

/* UPPERCASE klíče = sedí s backend enumem UserState */
export const STATUS_CS: Record<Status, string> = {
  ONLINE: 'Online',
  AWAY: 'Pryč',
  BUSY: 'Nerušit',
  OFFLINE: 'Offline',
};

/* fallback normalizace – kdyby backend vrátil lowercase nebo null */
export const normalizeStatus = (s: unknown): Status => {
  const upper = String(s || '').toUpperCase();
  if (upper === 'ONLINE' || upper === 'AWAY' || upper === 'BUSY' || upper === 'OFFLINE') {
    return upper as Status;
  }
  return 'OFFLINE';
};

/* Pokud je uživatel zablokovaný (buď já jeho, nebo on mě),
   zobrazujeme ho jako OFFLINE pro bezpečnost */
export const visibleStatus = (c: Contact): Status => {
  if (c.blocked || c.blockedMe) return 'OFFLINE';
  return c.status;
};

/* ISO datetime → "11. 8. 2026" (pro memberSince) */
export const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric' });

export const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });

export const fmtDay = (iso: string) => {
  const d = new Date(iso);
  const today = new Date();
  const yest = new Date(); yest.setDate(today.getDate() - 1);
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (same(d, today)) return 'Dnes';
  if (same(d, yest)) return 'Včera';
  return d.toLocaleDateString('cs-CZ');
};

export function toast(msg: string) {
  window.dispatchEvent(new CustomEvent<string>('app-toast', { detail: msg }));
}