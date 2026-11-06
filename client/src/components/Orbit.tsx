import { useEffect, useRef, useState, type MouseEvent as RMouseEvent, type WheelEvent as RWheelEvent } from 'react';
import type { Contact } from '../types';
import { visibleStatus } from '../utils';
import Avatar from './Avatar';

interface Props {
  contacts: Contact[];
  activeId: string | null;
  typing: Record<string, boolean>;
  onOpenChat: (contactId: string) => void;
  onBlock: (id: string) => void;
  onRemoveFriend: (id: string) => void;
}

// Zde doplněno onRemoveFriend do parametrů
export default function Orbit({ contacts, activeId, typing, onOpenChat, onBlock, onRemoveFriend }: Props) {
  const listRef = useRef<HTMLDivElement>(null);
  const [menu, setMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const [tip, setTip] = useState<{ text: string; x: number; y: number } | null>(null);
  const [sb, setSb] = useState({ left: 0, width: 100 });

  const visible = contacts.filter(c => !c.blocked && !c.removed);
  const updateSb = () => {
    const el = listRef.current;
    if (!el) return;
    const sw = Math.max(el.scrollWidth, el.clientWidth);
    setSb({ left: (el.scrollLeft / sw) * 100, width: (el.clientWidth / sw) * 100 });
  };
  useEffect(() => { updateSb(); }, [contacts]);
  useEffect(() => {
    window.addEventListener('resize', updateSb);
    return () => window.removeEventListener('resize', updateSb);
  }, []);

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [menu]);

  const onWheel = (e: RWheelEvent<HTMLDivElement>) => {
    const el = listRef.current;
    if (el) el.scrollLeft += e.deltaY;
  };

  /* fixed tooltip – overflow scroll containeru ho neusekne */
  const showTip = (e: RMouseEvent<HTMLButtonElement>, text: string) => {
    const r = e.currentTarget.getBoundingClientRect();
    setTip({ text, x: r.left + r.width / 2, y: r.top - 10 });
  };

  return (
      <div className="contacts-wrap">
        <div className="contacts-bar" ref={listRef} role="radiogroup" aria-label="Kontakty"
             onScroll={() => { updateSb(); setTip(null); }} onWheel={onWheel}>
          {visible.map(c => {
            const tipText = c.name + (!c.blockedMe && c.statusText ? ' · ' + c.statusText : '');
            return (
                <button
                    key={c.id}
                    className={'contact' + (activeId === c.id ? ' selected' : '')}
                    role="radio"
                    aria-checked={activeId === c.id}
                    onMouseEnter={e => showTip(e, tipText)}
                    onMouseLeave={() => setTip(null)}
                    onClick={() => onOpenChat(c.id)}
                    onContextMenu={e => {
                      e.preventDefault();
                      setTip(null);
                      setMenu({
                        id: c.id,
                        x: Math.min(e.clientX, window.innerWidth - 210),
                        y: Math.min(e.clientY, window.innerHeight - 110),
                      });
                    }}
                >
                  <Avatar user={c} cls="av-sm" />
                  {typing[c.id]
                      ? <span className="typing-pip" title="píše…"><i /><i /><i /></span>
                      : <span className={'status-pip dot ' + visibleStatus(c)} />}
                  {c.unread > 0 && <span className="badge">{c.unread > 9 ? '9+' : c.unread}</span>}
                </button>
            );
          })}
          {visible.length === 0 && <div className="contacts-empty">Žádné kontakty.</div>}
        </div>

        <div className="scroll-line">
          <div className="scroll-thumb" style={{ left: sb.left + '%', width: sb.width + '%' }} />
        </div>

        {tip && (
            <div className="orbit-tip" style={{ left: tip.x, top: tip.y }}>{tip.text}</div>
        )}

        {menu && (
            <div id="ctx-menu" style={{ left: menu.x, top: menu.y }}>
              <button onClick={() => { onOpenChat(menu.id); setMenu(null); }}>💬 Otevřít chat</button>
              <button className="ban" onClick={() => { onBlock(menu.id); setMenu(null); }}>🚫 Zablokovat</button>
              <button className="ban" onClick={() => { onRemoveFriend(menu.id); setMenu(null); }}>🗑 Odstranit přítele</button>
            </div>
        )}
      </div>
  );
}