import { useCallback, useEffect, useRef, useState } from 'react';
import type { Chat, Contact, Dir, FriendRequest, Message, Requests, Screen, Theme, User, WsEvent } from './types';
import { api, setAuthToken } from './api';
import { useOnline } from './hooks/useOnline';
import { useMessageQueue } from './hooks/useMessageQueue';
import { useWebSocket } from './hooks/useWebSocket';
import AuthScreen from './components/AuthScreen';
import ChatScreen from './components/ChatScreen';
import SettingsScreen from './components/SettingsScreen';
import Toast from './components/Toast';
import { LS_SESSION, LS_USER, LS_TOKEN, LS_THEME, toast } from './utils';

let uid = 0;
const genId = (p: string) => p + Date.now() + '_' + uid++;

const safeSet = (store: Storage, key: string, val: string) => {
  try { store.setItem(key, val); } catch { /* quota */ }
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [screen, setScreen] = useState<Screen>('auth');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [conversations, setConversations] = useState<Record<string, Message[]>>({});
  const [requests, setRequests] = useState<Requests>({ incoming: [], outgoing: [] });
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [typing, setTyping] = useState<Record<string, boolean>>({});
  const [reqBadge, setReqBadge] = useState(0);
  const [theme, setTheme] = useState<Theme>('dark');
  const [wsToken, setWsToken] = useState<string | null>(null);

  const online = useOnline();
  const ref = useRef({ activeChat, screen, contacts, chats, requests, selectedContact });
  useEffect(() => { ref.current = { activeChat, screen, contacts, chats, requests, selectedContact }; });

  /* po potvrzení backendem vyměň lokální id (mq…) za reálné UUID, ať funguje edit/delete */
  const handleSent = useCallback((chatId: string, localId: string, server: Message) => {
    setConversations(prev => {
      const msgs = (prev[chatId] ?? []).filter(m => m.id !== localId);
      msgs.push(server);
      return { ...prev, [chatId]: msgs };
    });
  }, []);

  const queue = useMessageQueue(online, handleSent);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    safeSet(localStorage, LS_THEME, theme);
  }, [theme]);

  const pushMessage = useCallback((chatId: string, dir: Dir, text: string) => {
    const ch = ref.current.chats.find(c => c.id === chatId);
    const ct = ch ? ref.current.contacts.find(c => c.id === ch.contactId) : null;
    if (dir === 'in' && ct && (ct.blocked || ct.blockedMe || ct.removed || ct.removedMe)) return;

    const msg: Message = { id: genId('m'), dir, text, createdAt: new Date().toISOString() };
    setConversations(prev => ({ ...prev, [chatId]: [...(prev[chatId] ?? []), msg] }));
    if (dir === 'in' && !(ref.current.activeChat === chatId && ref.current.screen === 'chat')) {
      if (ch) {
        setContacts(prev => prev.map(c => (c.id === ch.contactId ? { ...c, unread: c.unread + 1 } : c)));
        setChats(prev => prev.map(c => (c.id === chatId ? { ...c, unread: c.unread + 1 } : c)));
      }
    }
  }, []);

  const pushRequest = useCallback((r: FriendRequest) => {
    setRequests(prev => ({ ...prev, incoming: [...prev.incoming, r] }));
    setReqBadge(b => b + 1);
    toast('Nová žádost o přátelství od ' + r.name);
  }, []);

  /* ---- WebSocket eventy (reálný backend) ---- */
  const handleWsEvent = useCallback((ev: WsEvent) => {
    switch (ev.type) {
      case 'message':
        pushMessage(ev.chatId, 'in', ev.message.text);
        break;
      case 'typing':
        setTyping(t => ({ ...t, [ev.chatId]: ev.isTyping }));
        break;
      case 'presence':
        setContacts(prev => prev.map(c =>
            c.id === ev.userId ? { ...c, status: c.blockedMe ? 'OFFLINE' : ev.status } : c));
        break;
      case 'friend_request':
        pushRequest(ev.request);
        break;
      case 'blocked':
        setContacts(prev => prev.map(c =>
            c.id === ev.byId ? { ...c, blockedMe: true } : c));
        toast('Uživatel tě zablokoval 🚫');
        break;
      case 'unblocked':
        setContacts(prev => prev.map(c =>
            c.id === ev.byId ? { ...c, blockedMe: false } : c));
        break;
      case 'message_edited':
        setConversations(prev => ({
          ...prev,
          [ev.chatId]: (prev[ev.chatId] ?? []).map(m =>
              m.id === ev.messageId ? { ...m, text: ev.text, edited: true } : m),
        }));
        break;
      case 'message_deleted':
        setConversations(prev => ({
          ...prev,
          [ev.chatId]: (prev[ev.chatId] ?? []).filter(m => m.id !== ev.messageId),
        }));
        break;
      default:
        break;
    }
  }, [pushMessage, pushRequest]);

  const resync = useCallback(async () => {
    if (!user) return;
    for (const ch of ref.current.chats) {
      const res = await api.getMessages(ch.id, undefined, user.id);
      const freshMsgs = Array.isArray(res) ? res : (res?.messages ?? []);
      setConversations(prev => ({ ...prev, [ch.id]: freshMsgs }));
    }
  }, [user]);

  const { send: wsSend } = useWebSocket(!!user, wsToken, handleWsEvent, resync);

  const sendTyping = useCallback((chatId: string, isTyping: boolean) => {
    wsSend({ type: 'typing', chatId, isTyping });
  }, [wsSend]);

  const logout = useCallback(() => {
    localStorage.removeItem(LS_SESSION); sessionStorage.removeItem(LS_SESSION);
    localStorage.removeItem(LS_TOKEN); sessionStorage.removeItem(LS_TOKEN);
    setAuthToken(null); setUser(null); setActiveChat(null); setSelectedContact(null);
    setWsToken(null);
    setContacts([]); setChats([]); setConversations({}); setTyping({}); setReqBadge(0);
    setScreen('auth');
  }, []);

  const initApp = useCallback(async (myId?: string) => {
    try {
      const cs = await api.getFriends();
      const ch = await api.getChats();
      const rq = await api.getFriendRequests();
      const conv: Record<string, Message[]> = {};
      for (const c of ch) {
        const res = await api.getMessages(c.id, undefined, myId);
        conv[c.id] = Array.isArray(res) ? res : (res?.messages ?? []);
      }
      setContacts(cs); setChats(ch); setRequests(rq); setConversations(conv);
      setActiveChat(null); setReqBadge(0);
    } catch (err) {
      toast('Chyba připojení k serveru. Aplikace se nepodařila načíst.');
      logout();
    }
  }, [logout]);


  useEffect(() => {
    const onUnauth = () => logout();
    window.addEventListener('app-unauthorized', onUnauth);
    return () => window.removeEventListener('app-unauthorized', onUnauth);
  }, [logout]);

  useEffect(() => {
    const savedTheme = localStorage.getItem(LS_THEME) as Theme | null;
    if (savedTheme === 'dark' || savedTheme === 'light') {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
    try {
      if ((localStorage.getItem(LS_SESSION) ?? sessionStorage.getItem(LS_SESSION)) === '1') {
        const raw = localStorage.getItem(LS_USER);
        const u = raw ? (JSON.parse(raw) as User) : null;
        const t = localStorage.getItem(LS_TOKEN) ?? sessionStorage.getItem(LS_TOKEN);
        if (u && u.email) {
          setUser(u);
          setAuthToken(t ?? '');
          setWsToken(t);
          setScreen('chat');
          void initApp(u.id);
        } else localStorage.removeItem(LS_SESSION);
      }
    } catch {
      localStorage.removeItem(LS_SESSION); localStorage.removeItem(LS_USER);
    }
  }, [initApp]);

  const onAuthed = async (u: User, t: string, remember: boolean) => {
    setUser(u);
    setAuthToken(t);
    setWsToken(t);
    const store = remember ? localStorage : sessionStorage;
    safeSet(store, LS_SESSION, '1');
    safeSet(store, LS_TOKEN, t);
    safeSet(localStorage, LS_USER, JSON.stringify(u));
    setScreen('chat');
    void initApp(u.id);
  };

  const openSettings = () => { setScreen('settings'); setReqBadge(0); };

  const openContact = (contactId: string) => {
    setSelectedContact(contactId);
    const chat = chats.find(ch => ch.contactId === contactId);
    if (chat) {
      setActiveChat(chat.id);
      setChats(prev => prev.map(x => (x.id === chat.id ? { ...x, unread: 0 } : x)));
      setContacts(prev => prev.map(x => (x.id === contactId ? { ...x, unread: 0 } : x)));
    } else {
      setActiveChat(null);
    }
  };

  const openChat = (chatId: string) => {
    setActiveChat(chatId);
    const ch = chats.find(c => c.id === chatId);
    if (ch) {
      setChats(prev => prev.map(c => (c.id === chatId ? { ...c, unread: 0 } : c)));
      setContacts(prev => prev.map(c => (c.id === ch.contactId ? { ...c, unread: 0 } : c)));
    }
  };

  const send = (text: string) => {
    if (!activeChat) return;
    const ch = chats.find(c => c.id === activeChat);
    const c = ch ? contacts.find(x => x.id === ch.contactId) : null;
    if (!c || c.blocked || c.blockedMe || c.removedMe) { toast('Tomuhle uživateli nemůžeš psát 🚫'); return; }
    const chatId = activeChat;
    const msgId = genId('mq');
    const createdAt = new Date().toISOString();
    setConversations(prev => ({
      ...prev,
      [chatId]: [...(prev[chatId] ?? []), { id: msgId, dir: 'out' as const, text, createdAt }],
    }));
    queue.enqueue({ id: msgId, chatId, text });
  };

  const createChat = async (name: string, icon: string | null) => {
    if (!selectedContact) { toast('Nejdřív vyber kontakt dole.'); return; }
    const c = contacts.find(x => x.id === selectedContact);
    if (c && (c.blockedMe || c.removedMe)) { toast('Tento uživatel není k dispozici 🚫'); return; }
    try {
      await api.createChat(selectedContact, name, icon);
      const ch = await api.getChats();
      setChats(ch);
      const created = ch.find(x => x.contactId === selectedContact && !x.global && x.name === name);
      if (created) {
        setConversations(prev => ({ ...prev, [created.id]: prev[created.id] ?? [] }));
        setActiveChat(created.id);
      }
      toast('Chat "' + name + '" vytvořen ✔');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Vytvoření chatu selhalo');
    }
  };

  const loadOlder = async (chatId: string): Promise<boolean> => {
    if (!user) return false;
    const current = conversations[chatId] ?? [];
    if (current.length === 0) return false;

    const oldestMsg = current[0];
    if (!oldestMsg || !oldestMsg.createdAt) return false;

    // --- DEBUG: Podívej se, co posíláme na server ---
    console.log('📤 [loadOlder] Odesílám požadavek:', {
      chatId,
      before: oldestMsg.createdAt,
      currentMessagesCount: current.length
    });

    const res = await api.getMessages(chatId, oldestMsg.createdAt, user.id);

    // --- DEBUG: Podívej se, co vrátil backend ---
    console.log('📥 [loadOlder] Odpověď ze serveru:', res);

    const older = res.messages ?? [];
    const hasMoreServer = res.hasMore ?? false;

    console.log(`📊 [loadOlder] Nalezeno starších zpráv: ${older.length}, hasMore: ${hasMoreServer}`);

    if (older.length === 0) return false;

    const known = new Set(current.map(m => m.id));
    const fresh = older.filter(m => !known.has(m.id));

    console.log(`✨ [loadOlder] Po filtraci duplicit zbývá nových zpráv k přidání: ${fresh.length}`);

    if (fresh.length === 0) return hasMoreServer;

    setConversations(prev => {
      const prevKnown = new Set((prev[chatId] ?? []).map(m => m.id));
      const toAdd = fresh.filter(m => !prevKnown.has(m.id));
      if (toAdd.length === 0) return prev;
      return { ...prev, [chatId]: [...toAdd, ...(prev[chatId] ?? [])] };
    });

    return hasMoreServer;
  };

  const updateChat = async (chatId: string, patch: Partial<Pick<Chat, 'name' | 'icon'>>) => {
    const ch = chats.find(c => c.id === chatId);
    if (!ch) return;
    const clean = { ...patch };
    if (ch.global && clean.name !== undefined) {
      delete clean.name;
      toast('Obecný chat nejde přejmenovat 🚫');
    }
    if (Object.keys(clean).length === 0) return;
    await api.updateChat(chatId, clean);
    setChats(prev => prev.map(c => (c.id === chatId ? { ...c, ...clean } : c)));
    toast('Chat upraven ✔');
  };

  const deleteChat = async (chatId: string) => {
    const ch = chats.find(c => c.id === chatId);
    if (ch && ch.global) { toast('Obecný chat nejde smazat 🚫'); return; }
    await api.deleteChat(chatId);
    setChats(prev => prev.filter(c => c.id !== chatId));
    setConversations(prev => { const n = { ...prev }; delete n[chatId]; return n; });
    setActiveChat(prev => (prev === chatId ? null : prev));
    toast('Chat smazán 🗑');
  };

  const editMessage = (msgId: string, text: string) => {
    if (!activeChat) return;
    if (queue.pending.some(x => x.id === msgId)) {
      toast('Zpráva se pořád odesílá, počkej.');
      return;
    }
    const chatId = activeChat;
    setConversations(prev => ({
      ...prev,
      [chatId]: (prev[chatId] ?? []).map(m => (m.id === msgId ? { ...m, text, edited: true } : m)),
    }));
    void api.editMessage(chatId, msgId, text);
  };

  const deleteMessage = (msgId: string) => {
    if (!activeChat) return;
    if (queue.pending.some(x => x.id === msgId)) {
      toast('Zpráva se pořád odesílá, počkej.');
      return;
    }
    const chatId = activeChat;
    setConversations(prev => ({
      ...prev,
      [chatId]: (prev[chatId] ?? []).filter(m => m.id !== msgId),
    }));
    void api.deleteMessage(chatId, msgId);
  };

  const block = async (id: string) => {
    try {
      await api.blockUser(id);
      setContacts(prev => prev.map(c => (c.id === id ? { ...c, blocked: true } : c)));
      setActiveChat(prev => {
        const ch = chats.find(c => c.id === prev);
        return ch && ch.contactId === id ? null : prev;
      });
      setSelectedContact(prev => (prev === id ? null : prev));
      const c = ref.current.contacts.find(x => x.id === id);
      toast('Uživatel ' + (c ? c.name : '') + ' byl zablokován 🚫');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Zablokování selhalo');
    }
  };

  const unblock = async (id: string) => {
    try {
      await api.unblockUser(id);
      setContacts(prev => prev.map(c => (c.id === id ? { ...c, blocked: false } : c)));
      const c = ref.current.contacts.find(x => x.id === id);
      toast('Uživatel ' + (c ? c.name : '') + ' byl odblokován ✔');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Odblokování selhalo');
    }
  };

  const handleRemoveFriend = async (id: string) => {
    try {
      await api.removeFriend(id);
      setContacts(prev => prev.filter(c => c.id !== id));
      setChats(prev => prev.filter(ch => ch.contactId !== id));
      setActiveChat(prev => {
        const ch = chats.find(c => c.id === prev);
        return ch && ch.contactId === id ? null : prev;
      });
      setSelectedContact(prev => (prev === id ? null : prev));
      toast('Přítel byl odstraněn 🗑');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Odstranění přítele selhalo');
    }
  };

  const saveProfile = async (patch: Partial<User>) => {
    const res = await api.updateProfile(patch);
    setUser(res.user);
    safeSet(localStorage, LS_USER, JSON.stringify(res.user));
    toast('Profil uložen ✔');
  };

  const setAvatar = (avatar: string) => setUser(u => (u ? { ...u, avatar } : u));
  const setBanner = (banner: string) => setUser(u => (u ? { ...u, banner } : u));

  const addFriend = async (email: string) => {
    if (!email.includes('@')) {
      toast('Zadej platný e-mail.');
      return;
    }
    try {
      const r = await api.sendFriendRequest(email);
      setRequests(prev => ({ ...prev, outgoing: [...prev.outgoing, r] }));
      toast('Žádost o přátelství odeslána ✔');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Odeslání žádosti selhalo.');
    }
  };

  const respond = async (r: FriendRequest, accept: boolean) => {
    try {
      await api.respondRequest(r.id, accept);
      setRequests(prev => ({ ...prev, incoming: prev.incoming.filter(x => x.id !== r.id) }));
      if (accept) {
        const cs = await api.getFriends();
        const ch = await api.getChats();
        setContacts(cs);
        setChats(ch);
        toast('Žádost přijata ✔');
      } else {
        toast('Žádost odmítnuta.');
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Zpracování žádosti selhalo.');
    }
  };

  const cancel = async (r: FriendRequest) => {
    try {
      await api.cancelRequest(r.id);
      setRequests(prev => ({ ...prev, outgoing: prev.outgoing.filter(x => x.id !== r.id) }));
      toast('Žádost zrušena.');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Zrušení žádosti selhalo.');
    }
  };

  return (
      <>
        {screen === 'auth' && <AuthScreen onAuthed={onAuthed} />}

        {screen === 'chat' && user && (
            <ChatScreen
                user={user} contacts={contacts} chats={chats} conversations={conversations}
                activeChat={activeChat} selectedContact={selectedContact}
                typing={typing} reqBadge={reqBadge}
                online={online} pendingMsgs={queue.pending} onRetryQueue={queue.retryFailed}
                onTyping={sendTyping}
                onOpenSettings={openSettings} onLogout={logout}
                onOpenContact={openContact} onOpenChat={openChat} onBlock={block}
                onSend={send} onCreateChat={createChat} onUpdateChat={updateChat} onDeleteChat={deleteChat}
                onEditMessage={editMessage} onDeleteMessage={deleteMessage}
                onLoadOlder={loadOlder}
                onRemoveFriend={handleRemoveFriend}
            />
        )}

        {screen === 'settings' && user && (
            <SettingsScreen
                user={user} requests={requests} contacts={contacts} theme={theme}
                onBack={() => setScreen('chat')} onLogout={logout}
                onSave={saveProfile} onAvatar={setAvatar} onBanner={setBanner}
                onRespond={respond} onCancel={cancel}
                onUnblock={unblock} onAddFriend={addFriend}
                onThemeChange={setTheme}
            />
        )}

        <Toast />
      </>
  );
}