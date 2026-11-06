export type Status = 'ONLINE' | 'AWAY' | 'BUSY' | 'OFFLINE';
export type Dir = 'in' | 'out';
export type Screen = 'auth' | 'chat' | 'settings';
export type Theme = 'dark' | 'light';

export interface Badge {
  icon: string;   // emoji NEBO URL obrázku
  title: string;  // tooltip při najetí
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  banner: string | null;
  badges: Badge[];
  memberSince: string;
  status: Status;
  statusText: string;
}

export interface Contact extends Omit<User, 'email'> {
  unread: number;
  blocked: boolean;      // TY jsi zablokoval jeho
  blockedMe: boolean;    // ON zablokoval tebe → read-only + vidíš OFFLINE
  removed: boolean; //TY jsi odstranil jeho
  removedMe: boolean; // ON si tě odebral z přátel → zablokovaný input
}

export interface Chat {
  id: string;
  contactId: string;
  name: string;
  global: boolean;
  unread: number;
  icon: string | null;   // emoji NEBO URL; null = fallback na profilovku
}

export interface Message {
  id: string;
  dir: Dir;
  text: string;
  createdAt: string;     // ISO string
  edited?: boolean;
}

export interface FriendRequest {
  id: number;
  name: string;
  avatar: string | null;
  note: string;
}

export interface Requests {
  incoming: FriendRequest[];
  outgoing: FriendRequest[];
}

export interface AuthResponse { token: string; user: User; }
export interface UploadResponse { url: string; }

export type WsEvent =
  | { type: 'message'; chatId: string; message: Message }
  | { type: 'typing'; chatId: string; userId: string; isTyping: boolean }
  | { type: 'presence'; userId: string; status: Status; statusText?: string }
  | { type: 'friend_request'; request: FriendRequest }
  | { type: 'request_responded'; requestId: number; accepted: boolean }
  | { type: 'blocked'; byId: string }
  | { type: 'unblocked'; byId: string }
  | { type: 'message_edited'; chatId: string; messageId: string; text: string }
  | { type: 'message_deleted'; chatId: string; messageId: string };
