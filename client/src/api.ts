import type { AuthResponse, Chat, Contact, FriendRequest, Message, Requests, User } from './types';
import { fmtDate, normalizeStatus } from './utils';

const envBase = (import.meta as any).env?.VITE_API_BASE ?? '';
export const API_BASE = envBase;

let authToken: string | null = null;
export const setAuthToken = (t: string | null) => { authToken = t; };

/* backend vrací avatarUrl/bannerUrl – frontend chce avatar/banner */
const normalizeUser = (u: any): any => ({
  ...u,
  avatar: u.avatar ?? u.avatarUrl ?? null,
  banner: u.banner ?? u.bannerUrl ?? null,
  status: normalizeStatus(u.status),
  memberSince: typeof u.memberSince === 'string' && u.memberSince.includes('T')
      ? fmtDate(u.memberSince) : u.memberSince,
  badges: (u.badges || u.userBadges || []).map((b: any) => ({ icon: b.icon, title: b.title })),
});

/* backend vrací FriendRequestDto – frontend chce { id, name, avatar, note } */
const normalizeRequest = (r: any): FriendRequest => ({
  id: r.id,
  name: r.name ?? r.userName ?? 'Neznámý uživatel',
  avatar: r.avatar ?? r.avatarUrl ?? null,
  note: r.note ?? (r.createdAt ? fmtDate(r.createdAt) : ''),
});

/* backend vrací ChatDto – pohlídáme iconUrl/isGlobal varianty */
const normalizeChat = (c: any): Chat => ({
  id: c.id,
  contactId: c.contactId,
  name: c.name,
  global: c.global ?? c.isGlobal ?? false,
  unread: c.unread ?? 0,
  icon: c.icon ?? c.iconUrl ?? null,
});

/*
 * Centrální fetch – auth header, JSON chyby, prázdné body OK.
 * publicFlow = true → při 401 NEODHLAŠUJE (veřejné toky z e-mailu:
 * reset hesla, potvrzení e-mailu – uživatel nemusí být přihlášený).
 */
export async function authFetch(path: string, opts: RequestInit = {}, publicFlow = false) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(API_BASE + path, {
      ...opts,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: 'Bearer ' + authToken } : {}),
      },
    });
    clearTimeout(timeout);

    if (res.status === 401) {
      if (!publicFlow) window.dispatchEvent(new CustomEvent('app-unauthorized'));
      const body = await res.json().catch(() => null);
      throw new Error(body?.message ?? 'Neautorizováno');
    }
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.message ?? 'HTTP ' + res.status);
    }
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  } catch (e) {
    clearTimeout(timeout);
    if (e instanceof TypeError) {
      throw new Error('Server neodpovídá. Zkus to prosím později.');
    }
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new Error('Server neodpovídá. Zkus to prosím později.');
    }
    throw e;
  }
}

export type UploadFileType = 'PROFILE_PICTURE' | 'BANNER' | 'CHAT_ICON';

/* 🔌 POST /api/upload (multipart "file" + "fileType") → { url }
   Chyby z backendu (message) se propagují do UI jako toast. */
export async function uploadFile(file: File, fileType: UploadFileType): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('fileType', fileType);
  try {
    const res = await fetch(API_BASE + '/v1/upload', {
      method: 'POST',
      headers: authToken ? { Authorization: 'Bearer ' + authToken } : {},
      body: fd,
    });
    if (res.status === 401) {
      window.dispatchEvent(new CustomEvent('app-unauthorized'));
      const body = await res.json().catch(() => null);
      throw new Error(body?.message ?? 'Neautorizováno');
    }
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.message ?? 'HTTP ' + res.status);
    }
    return ((await res.json()) as { url: string }).url;
  } catch (e) {
    if (e instanceof TypeError) {
      throw new Error('Server není dostupný. Zkontroluj, zda běží backend.');
    }
    throw e;
  }
}

export const api = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const data = await authFetch('/v1/auth/login', {
      method: 'POST', body: JSON.stringify({ email, password }),
    });
    return { token: data.token, user: normalizeUser(data.user) };
  },

  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    const data = await authFetch('/v1/auth/register', {
      method: 'POST', body: JSON.stringify({ name, email, password }),
    });
    return { token: data.token, user: normalizeUser(data.user) };
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    await authFetch('/v1/auth/forgot-password', {
      method: 'POST', body: JSON.stringify({ email }),
    });
    return { message: 'ok' };
  },

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    await authFetch('/v1/auth/reset-password', {
      method: 'POST', body: JSON.stringify({ token, newPassword }),
    }, true);
    return { message: 'ok' };
  },

  async updateProfile(patch: Partial<User>): Promise<{ user: User }> {
    const data = await authFetch('/v1/users/me', {
      method: 'PATCH',
      body: JSON.stringify({
        name: patch.name,
        status: patch.status,
        statusText: patch.statusText,
        avatarUrl: patch.avatar,
        bannerUrl: patch.banner,
      }),
    });
    return { user: normalizeUser(data.user) };
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<{ message: string }> {
    return await authFetch('/v1/users/me/change-password', {
      method: 'POST', body: JSON.stringify({ oldPassword, newPassword }),
    });
  },

  async changeEmail(newEmail: string, password: string): Promise<{ message: string }> {
    return await authFetch('/v1/users/me/change-email', {
      method: 'POST', body: JSON.stringify({ newEmail, password }),
    });
  },

  async confirmEmail(token: string): Promise<{ message: string }> {
    return await authFetch('/v1/users/me/confirm-email', {
      method: 'POST', body: JSON.stringify({ token }),
    }, true);
  },

  async getFriends(): Promise<Contact[]> {
    const data = await authFetch('/v1/friends');
    return data.map((c: any) => ({
      ...normalizeUser(c),
      unread: c.unread ?? 0,
      blocked: !!c.blocked,
      blockedMe: !!c.blockedMe,
    }));
  },

  async getFriendRequests(): Promise<Requests> {
    const data = await authFetch('/v1/friends/requests');
    return {
      incoming: (data.incoming ?? []).map(normalizeRequest),
      outgoing: (data.outgoing ?? []).map(normalizeRequest),
    };
  },

  async sendFriendRequest(email: string): Promise<FriendRequest> {
    const data = await authFetch('/v1/friends/requests', {
      method: 'POST', body: JSON.stringify({ email }),
    });
    return normalizeRequest(data);
  },

  async respondRequest(id: number, accept: boolean): Promise<{ ok: boolean }> {
    await authFetch('/v1/friends/requests/' + id + '/respond', {
      method: 'POST', body: JSON.stringify({ accept }),
    });
    return { ok: true };
  },

  async cancelRequest(id: number): Promise<{ ok: boolean }> {
    await authFetch('/v1/friends/requests/' + id, { method: 'DELETE' });
    return { ok: true };
  },

  async blockUser(id: string): Promise<{ ok: boolean }> {
    await authFetch('/v1/users/' + id + '/block', { method: 'POST' });
    return { ok: true };
  },

  async unblockUser(id: string): Promise<{ ok: boolean }> {
    await authFetch('/v1/users/' + id + '/unblock', { method: 'POST' });
    return { ok: true };
  },

  async getChats(): Promise<Chat[]> {
    const data = await authFetch('/v1/chats');
    return (data ?? []).map(normalizeChat);
  },

  async getMessages(id: string, before?: string | Date, myUserId?: string): Promise<Message[]> {
    let path = '/v1/conversations/' + id + '/messages?limit=20';
    if (before) {
      const isoBefore = before instanceof Date ? before.toISOString() : new Date(before).toISOString();
      path += '&before=' + encodeURIComponent(isoBefore);
    }
    const data = await authFetch(path);
    return (data ?? []).map((m: any) => ({
      id: m.id,
      dir: (m.author?.id === myUserId || m.authorId === myUserId) ? 'out' : 'in',
      text: m.text,
      createdAt: m.createdAt,
      edited: m.edited ?? m.isEdited ?? false,
    }));
  },

  async sendMessage(id: string, text: string): Promise<Message> {
    const data = await authFetch('/v1/conversations/' + id + '/messages', {
      method: 'POST', body: JSON.stringify({ text }),
    });
    return {
      id: data.id,
      dir: 'out',
      text: data.text ?? text,
      createdAt: data.createdAt ?? new Date().toISOString(),
      edited: data.edited ?? data.isEdited ?? false,
    };
  },

  async editMessage(chatId: string, msgId: string, text: string): Promise<{ ok: boolean }> {
    try {
      await authFetch('/v1/conversations/' + chatId + '/messages/' + msgId, {
        method: 'PATCH', body: JSON.stringify({ text }),
      });
    } catch (e) {
      console.warn('Edit message failed', e);
    }
    return { ok: true };
  },

  async deleteMessage(chatId: string, msgId: string): Promise<{ ok: boolean }> {
    try {
      await authFetch('/v1/conversations/' + chatId + '/messages/' + msgId, { method: 'DELETE' });
    } catch (e) {
      console.warn('Delete message failed', e);
    }
    return { ok: true };
  },

  async createChat(contactId: string, name: string, icon: string | null): Promise<{ ok: boolean }> {
    await authFetch('/v1/chats', {
      method: 'POST', body: JSON.stringify({ contactId, name, icon }),
    });
    return { ok: true };
  },

  async updateChat(id: string, patch: Partial<Pick<Chat, 'name' | 'icon'>>): Promise<{ ok: boolean }> {
    await authFetch('/v1/chats/' + id, {
      method: 'PATCH', body: JSON.stringify(patch),
    });
    return { ok: true };
  },

  async deleteChat(id: string): Promise<{ ok: boolean }> {
    await authFetch('/v1/chats/' + id, { method: 'DELETE' });
    return { ok: true };
  },

  async deleteAccount(): Promise<{ ok: boolean }> {
    await authFetch('/v1/users/me', { method: 'DELETE' });
    return { ok: true };
  },

  async removeFriend(id: string): Promise<{ ok: boolean }> {
    await authFetch('/v1/friends/' + id, { method: 'DELETE' });
    return { ok: true };
  },
};