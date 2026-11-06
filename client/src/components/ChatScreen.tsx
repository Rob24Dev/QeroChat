import { Fragment, useEffect, useLayoutEffect, useRef, useState, type FormEvent, type UIEvent as RUIEvent } from 'react';
import type { Chat, Contact, Message, User } from '../types';
import { STATUS_CS, fmtDay, fmtTime, toast, visibleStatus } from '../utils';
import { uploadFile } from '../api';
import Avatar from './Avatar';
import Orbit from './Orbit';

interface PendingInfo { id: string; chatId: string; status: 'sending' | 'failed'; }

interface Props {
  user: User;
  contacts: Contact[];
  chats: Chat[];
  conversations: Record<string, Message[]>;
  activeChat: string | null;
  selectedContact: string | null;
  typing: Record<string, boolean>;
  reqBadge: number;
  online: boolean;
  pendingMsgs: PendingInfo[];
  onRetryQueue: () => void;
  onTyping: (chatId: string, isTyping: boolean) => void;
  onOpenSettings: () => void;
  onLogout: () => void;
  onOpenContact: (contactId: string) => void;
  onOpenChat: (chatId: string) => void;
  onBlock: (id: string) => void;
  onRemoveFriend: (id: string) => void;
  onSend: (text: string) => void;
  onCreateChat: (name: string, icon: string | null) => void;
  onUpdateChat: (chatId: string, patch: Partial<Pick<Chat, 'name' | 'icon'>>) => void;
  onDeleteChat: (chatId: string) => void;
  onEditMessage: (msgId: string, text: string) => void;
  onDeleteMessage: (msgId: string) => void;
  onLoadOlder: (chatId: string) => Promise<boolean>;
}

const MAX_MSG = 1000;
const EMOJIS = ['😀','😂','😍','👍','🙏','🎉','❤️','😎','🤔','💀','🚀','🎮','✨','👀','🤝','😴'];

export default function ChatScreen(p: Props) {
  const [text, setText] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [modal, setModal] = useState<{ mode: 'create' } | { mode: 'rename' } | null>(null);
  const [mName, setMName] = useState('');
  const [mIcon, setMIcon] = useState('');
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMoreServer, setHasMoreServer] = useState(true);
  const [chatLimit, setChatLimit] = useState(20);
  const tooLong = text.length > MAX_MSG;

  const boxRef = useRef<HTMLDivElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);
  const prevHRef = useRef<number | null>(null);
  const typingTimerRef = useRef<number | undefined>(undefined);

  const rawChat = p.chats.find(c => c.id === p.activeChat) ?? null;
  const rawContact = rawChat ? (p.contacts.find(c => c.id === rawChat.contactId) ?? null) : null;
  const chat = rawContact && rawContact.blocked ? null : rawChat;
  const contact = rawContact && rawContact.blocked ? null : rawContact;

  const isRestricted = contact?.blockedMe || contact?.removedMe;
  const selectedContactData = p.selectedContact ? p.contacts.find(c => c.id === p.selectedContact) : null;
  const isSelectedRestricted = selectedContactData?.blockedMe || selectedContactData?.removedMe;
  const visibleChats = p.chats.filter(ch => {
    if (ch.contactId !== p.selectedContact) return false;
    const c = p.contacts.find(x => x.id === ch.contactId);
    return !!c && !c.blocked && !c.removed;
  });

  const all = chat ? (p.conversations[chat.id] ?? []) : [];
  const canLoadMore = all.length > 0 && hasMoreServer && !loadingOlder;

  useEffect(() => { setChatLimit(20); }, [p.selectedContact]);
  /* při přepnutí chatu resetuj – nový chat může mít další starší zprávy */
  useEffect(() => { setHasMoreServer(true); }, [p.activeChat]);

  useEffect(() => {
    if (!emojiOpen) return;
    const close = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) setEmojiOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [emojiOpen]);

  /* po otevření chatu / nové zprávě skoč dolů (jen když se zrovna nescrolluje historie) */
  useEffect(() => {
    const el = boxRef.current;
    if (el && prevHRef.current == null) el.scrollTop = el.scrollHeight;
  }, [p.conversations, p.activeChat, p.typing, editing]);

  /* po prependnutí starších zpráv zachovej pozici scrollu */
  useLayoutEffect(() => {
    const el = boxRef.current;
    if (el && prevHRef.current != null) {
      el.scrollTop += el.scrollHeight - prevHRef.current;
      prevHRef.current = null;
    }
  }, [all.length]);

  const loadMore = async () => {
    if (!chat || !canLoadMore) return;
    const el = boxRef.current;
    if (el) prevHRef.current = el.scrollHeight;
    setLoadingOlder(true);
    try {
      const hasMore = await p.onLoadOlder(chat.id);
      setHasMoreServer(hasMore);
    } finally {
      setLoadingOlder(false);
    }
  };

  const onMessagesScroll = () => {
    const el = boxRef.current;
    if (el && el.scrollTop < 40 && canLoadMore) void loadMore();
  };

  const onSidebarScroll = (e: RUIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 30 && chatLimit < visibleChats.length) {
      setChatLimit(l => l + 20);
    }
  };

  const handleTyping = () => {
    if (!chat) return;
    p.onTyping(chat.id, true);
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = window.setTimeout(() => p.onTyping(chat.id, false), 2000);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t || !chat || tooLong || isRestricted) return;
    setText('');
    p.onSend(t);
  };

  const openCreate = () => {
    if (!p.selectedContact) { toast('Nejdřív vyber kontakt dole.'); return; }
    if (isSelectedRestricted) { toast('S tímto uživatelem nelze spravovat chaty.'); return; }
    setMName(''); setMIcon('');
    setModal({ mode: 'create' });
  };

  const openEdit = () => {
    if (!chat || isRestricted) return;
    setMName(chat.name); setMIcon(chat.icon ?? '');
    setModal({ mode: 'rename' });
  };

  const submitModal = (e: FormEvent) => {
    e.preventDefault();
    const n = mName.trim();
    const icon = mIcon.trim() ? mIcon.trim() : null;
    if (!modal) return;
    if (modal.mode === 'create') {
      if (!n) return;
      p.onCreateChat(n, icon);
    } else if (chat) {
      const patch: Partial<Pick<Chat, 'name' | 'icon'>> = { icon };
      if (!chat.global) { if (!n) return; patch.name = n; }
      p.onUpdateChat(chat.id, patch);
    }
    setModal(null);
  };
  const delChat = () => {
    if (!chat || isRestricted) return;
    if (chat.global) { toast('Obecný chat nejde smazat 🚫'); return; }
    if (window.confirm('Smazat chat "' + chat.name + '"?')) p.onDeleteChat(chat.id);
  };

  const saveEdit = () => {
    const t = editText.trim();
    const original = editing ? all.find(x => x.id === editing) : undefined;
    if (editing && t && original) {
      if (t !== original.text) {
        p.onEditMessage(editing, t);
      } else {
        toast('Zpráva nebyla změněna.');
      }
    }
    setEditing(null);
  };

  const contactTyping: Record<string, boolean> = {};
  for (const ch of p.chats) {
    if (p.typing[ch.id]) contactTyping[ch.contactId] = true;
  }

  const renderChatIcon = (ch: Chat, c: Contact | undefined) => {
    if (ch.icon && (ch.icon.startsWith('http') || ch.icon.startsWith('data:'))) {
      return <span className="chat-ico-img" style={{ backgroundImage: 'url(' + ch.icon + ')' }} />;
    }
    if (ch.icon) return <span className="chat-ico-emoji">{ch.icon}</span>;
    return c ? <Avatar user={c} cls="av-head" /> : null;
  };

  const msgStatus = (m: Message) => {
    if (m.dir !== 'out') return null;
    const pm = p.pendingMsgs.find(x => x.id === m.id);
    if (!pm) return <span className="msg-status">✓</span>;
    if (pm.status === 'sending') return <span className="msg-status">⏳</span>;
    return <button className="retry-btn" title="Znovu odeslat" onClick={p.onRetryQueue}>!</button>;
  };

  return (
      <div id="screen-chat" className="screen active">
        <header className="chat-header">
          <button className="btn small" id="btn-settings" title="Nastavení" onClick={p.onOpenSettings}>
            <Avatar user={p.user} cls="av-head" />⚙
            {p.reqBadge > 0 && <span className="badge gear-badge">{p.reqBadge > 9 ? '9+' : p.reqBadge}</span>}
          </button>
          {chat && (
              <div className="chat-title">
                <b># {chat.name}</b>
                <span>{contact ? contact.name : ''}</span>
              </div>
          )}
          {chat && (
              <div className="chat-tools">
                <button
                    className="btn small"
                    title={isRestricted ? 'Nelze upravovat chat' : 'Upravit chat (název/ikona)'}
                    onClick={openEdit}
                    disabled={isRestricted}
                    style={isRestricted ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
                >✏️</button>
                <button
                    className="btn small danger"
                    title={chat.global ? 'Obecný chat nejde smazat' : (isRestricted ? 'Nelze mazat chat' : 'Smazat chat')}
                    onClick={delChat}
                    disabled={chat.global || isRestricted}
                    style={(chat.global || isRestricted) ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
                >🗑</button>
              </div>
          )}
          <div className="spacer" />
          <button className="btn small" onClick={p.onLogout}>Odhlásit</button>
        </header>

        {!p.online && (
            <div className="offline-banner">📴 Jsi offline. Zprávy se odešlou automaticky, až se připojíš.</div>
        )}

        <div className="chat-body">
          <aside className="chats-sidebar" onScroll={onSidebarScroll}>
            <div className="sidebar-head">
              Chaty
              <button
                  className="btn small accent"
                  title={isSelectedRestricted ? 'Nelze vytvořit chat s tímto uživatelem' : 'Vytvořit nový chat'}
                  onClick={openCreate}
                  disabled={isSelectedRestricted}
                  style={isSelectedRestricted ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
              >+</button>
            </div>
            {visibleChats.slice(0, chatLimit).map(ch => {
              const c = p.contacts.find(x => x.id === ch.contactId);
              if (!c) return null;
              const arr = p.conversations[ch.id] ?? [];
              const last = arr[arr.length - 1];
              const isTyping = !!p.typing[ch.id];
              return (
                  <button key={ch.id} className={'chat-item' + (ch.id === p.activeChat ? ' active' : '')} onClick={() => p.onOpenChat(ch.id)}>
                    {renderChatIcon(ch, c)}
                    <span className="ci-names">
                  <b>{ch.name}{ch.global ? ' ⭐' : ''}</b>
                  <i className={isTyping ? 'typing-preview' : ''}>
                    {isTyping ? 'píše…' : (last ? (last.dir === 'out' ? 'Ty: ' : '') + last.text : 'Žádné zprávy')}
                  </i>
                </span>
                    {ch.unread > 0 && <span className="badge chat-badge">{ch.unread > 9 ? '9+' : ch.unread}</span>}
                  </button>
              );
            })}
            {visibleChats.length > chatLimit && (
                <button className="btn small load-more" onClick={() => setChatLimit(l => l + 20)}>Zobrazit další</button>
            )}
          </aside>

          <div className="chat-center">
            <main className="messages" ref={boxRef} onScroll={onMessagesScroll}>
              {chat ? (
                  <>
                    {canLoadMore && (
                        <button className="load-more" onClick={() => void loadMore()}>↑ Načíst starší zprávy</button>
                    )}
                    {loadingOlder && <div className="day-sep"><span>Načítám starší…</span></div>}
                    {all.map((m, i) => {
                      const prev = all[i - 1];
                      const newDay = !prev || new Date(prev.createdAt).toDateString() !== new Date(m.createdAt).toDateString();
                      return (
                          <Fragment key={m.id}>
                            {newDay && <div className="day-sep"><span>{fmtDay(m.createdAt)}</span></div>}
                            <div className={'msg ' + m.dir}>
                              {m.dir === 'in' && contact ? <Avatar user={contact} cls="av-msg" /> : null}
                              {m.dir === 'out' ? <Avatar user={p.user} cls="av-msg" /> : null}
                              <div className="msg-content">
                                {editing === m.id ? (
                                    <div className="edit-row">
                                      <input value={editText} onChange={e => setEditText(e.target.value)} autoFocus />
                                      <button
                                          className="btn small accent"
                                          onClick={saveEdit}
                                          disabled={!editText.trim() || editText.trim() === m.text}
                                          title={!editText.trim() ? 'Zpráva nesmí být prázdná' : (editText.trim() === m.text ? 'Zpráva nebyla změněna' : 'Uložit')}
                                      >💾</button>
                                      <button className="btn small" onClick={() => setEditing(null)}>✖</button>
                                    </div>
                                ) : (
                                    <div className="bubble">
                                      {m.text}
                                      {m.edited ? <span className="edited"> (upraveno)</span> : null}
                                      {m.dir === 'out' && (
                                          <span className="msg-actions">
                                  <button title="Upravit" onClick={() => { setEditing(m.id); setEditText(m.text); }}>✏️</button>
                                  <button title="Smazat" onClick={() => p.onDeleteMessage(m.id)}>🗑</button>
                                </span>
                                      )}
                                    </div>
                                )}
                                <div className="time" title={new Date(m.createdAt).toLocaleString('cs-CZ')}>
                                  {fmtTime(m.createdAt)} {msgStatus(m)}
                                </div>
                              </div>
                            </div>
                          </Fragment>
                      );
                    })}
                  </>
              ) : (
                  <div className="chat-empty">Vyber chat vlevo, klikni na profilovku dole,<br />nebo vytvoř nový chat tlačítkem +.</div>
              )}
            </main>

            <div id="typing-line" className={chat && p.typing[chat.id] ? '' : 'hidden'}>
              <span id="typing-name">{contact ? contact.name : ''}</span>
              <span className="tdots"><span /><span /><span /></span>
              <span>píše…</span>
            </div>

            {contact && contact.blockedMe ? (
                <div className="blocked-notice">
                  🚫 {contact.name} si tě zablokoval(a). Zprávy si můžeš prohlížet, ale nemůžeš mu psát.
                </div>
            ) : (
                <form className="composer" onSubmit={submit}>
                  <div className="emoji-wrap" ref={emojiRef}>
                    <button
                        type="button"
                        className="btn small"
                        title="Emoji"
                        onClick={() => setEmojiOpen(o => !o)}
                        disabled={!chat || contact?.removedMe}
                    >😊</button>
                    {emojiOpen && (
                        <div className="emoji-pop">
                          {EMOJIS.map(e => (
                              <button key={e} type="button" onClick={() => setText(t => t + e)}>{e}</button>
                          ))}
                        </div>
                    )}
                  </div>
                  <input
                      id="inp-send" value={text}
                      onChange={e => { setText(e.target.value); handleTyping(); }}
                      autoComplete="off"
                      placeholder={
                        !chat ? 'Vyber chat…' :
                            contact?.removedMe ? 'Odesílání zpráv je povoleno pouze mezi přáteli.' :
                                'Napiš zprávu do #' + chat.name + '…'
                      }
                      disabled={!chat || contact?.removedMe}
                      className={tooLong ? 'inp-over' : undefined}
                  />
                  {!contact?.removedMe && (
                      <span className={'char-count' + (tooLong ? ' over' : '')}>{text.length}/{MAX_MSG}</span>
                  )}
                  <button
                      className="btn accent"
                      type="submit"
                      disabled={!chat || tooLong || contact?.removedMe}
                  >Odeslat</button>
                </form>
            )}
          </div>

          <aside className="profile-panel">
            {contact ? (
                <>
                  <div className="pp-banner" style={contact.banner ? { backgroundImage: 'url(' + contact.banner + ')' } : undefined} />
                  <div className="pp-body">
                    <div className="pp-avatar">
                      <Avatar user={contact} cls="av-pp" />
                      <span className={'pp-dot dot ' + visibleStatus(contact)} />
                    </div>
                    <h3>{contact.name}</h3>
                    {contact.badges.length > 0 && (
                        <div className="pp-badges">
                          {contact.badges.map((b, i) => (
                              <span key={i} className="pp-badge-wrap" data-title={b.title}>
                        {b.icon.startsWith('http') || b.icon.startsWith('data:') ? (
                            <img className="pp-badge-img" src={b.icon} alt={b.title} />
                        ) : (
                            <span className="pp-badge">{b.icon}</span>
                        )}
                      </span>
                          ))}
                        </div>
                    )}
                    <div className="pp-line">
                      <span className={'dot ' + visibleStatus(contact)} />
                      {STATUS_CS[visibleStatus(contact)]}
                      {!contact.blockedMe && contact.statusText ? ' · ' + contact.statusText : ''}
                    </div>
                    <div className="pp-section"><b>Členem od</b><span>{contact.memberSince}</span></div>
                  </div>
                </>
            ) : (
                <div className="pp-empty">Vyber kontakt</div>
            )}
          </aside>
        </div>

        <Orbit
            contacts={p.contacts}
            activeId={chat ? chat.contactId : null}
            typing={contactTyping}
            onOpenChat={p.onOpenContact}
            onRemoveFriend={p.onRemoveFriend}
            onBlock={p.onBlock}
        />

        {modal && (
            <div className="modal-back" onClick={() => setModal(null)}>
              <form className="modal" onClick={e => e.stopPropagation()} onSubmit={submitModal}>
                <h3>{modal.mode === 'create' ? 'Vytvořit nový chat' : 'Upravit chat'}</h3>
                {modal.mode === 'create' && (
                    <div className="modal-info">Vytváříš chat s <b>{contact ? contact.name : '…'}</b></div>
                )}
                {modal.mode === 'rename' && chat && chat.global && (
                    <div className="modal-info">Obecný chat ⭐ nejde přejmenovat, ale ikonu změnit můžeš.</div>
                )}
                <label>Název chatu
                  <input
                      value={mName}
                      onChange={e => setMName(e.target.value)}
                      placeholder="např. projekt 🚀"
                      disabled={modal.mode === 'rename' && !!chat && chat.global}
                      autoFocus
                  />
                </label>
                <label>Ikona chatu (emoji, nebo nahraj obrázek)
                  <input
                      value={mIcon.startsWith('data:') || mIcon.startsWith('http') ? '(vlastní obrázek)' : mIcon}
                      onChange={e => setMIcon(e.target.value)}
                      placeholder="např. 🎮 nebo URL"
                  />
                </label>
                <label className="btn small" style={{ cursor: 'pointer' }}>
                  Nahrát obrázek
                  <input type="file" accept="image/*" hidden onChange={e => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    void uploadFile(f, 'CHAT_ICON')
                        .then(url => setMIcon(url))
                        .catch((err: unknown) => toast(err instanceof Error ? err.message : 'Nahrání selhalo 🚫'));
                  }} />
                </label>
                {mIcon && (
                    <div className="chat-ico-preview">
                      {mIcon.startsWith('data:') || mIcon.startsWith('http')
                          ? <span className="chat-ico-img" style={{ backgroundImage: 'url(' + mIcon + ')' }} />
                          : <span className="chat-ico-emoji">{mIcon}</span>}
                    </div>
                )}
                <div className="modal-btns">
                  <button type="button" className="btn" onClick={() => setModal(null)}>Zrušit</button>
                  <button type="submit" className="btn accent">{modal.mode === 'create' ? 'Vytvořit' : 'Uložit'}</button>
                </div>
              </form>
            </div>
        )}
      </div>
  );
}