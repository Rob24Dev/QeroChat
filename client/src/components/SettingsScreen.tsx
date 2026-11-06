import { useState, type ChangeEvent, type FormEvent } from 'react';
import type { Contact, FriendRequest, Requests, Status, Theme, User } from '../types';
import { api, uploadFile } from '../api';
import { STATUS_CS, toast } from '../utils';
import Avatar from './Avatar';

interface Props {
  user: User;
  requests: Requests;
  contacts: Contact[];
  theme: Theme;
  onBack: () => void;
  onLogout: () => void;
  onSave: (patch: Partial<User>) => Promise<void>;
  onAvatar: (url: string) => void;
  onBanner: (url: string) => void;
  onRespond: (r: FriendRequest, accept: boolean) => void;
  onCancel: (r: FriendRequest) => void;
  onUnblock: (id: string) => void;
  onAddFriend: (email: string) => Promise<void>;
  onThemeChange: (t: Theme) => void;
}

export default function SettingsScreen(p: Props) {
  const [name, setName] = useState(p.user.name);
  const [status, setStatus] = useState<Status>(p.user.status);
  const [statusText, setStatusText] = useState(p.user.statusText);
  const [oldP, setOldP] = useState('');
  const [newP, setNewP] = useState('');
  const [newP2, setNewP2] = useState('');
  const [passErr, setPassErr] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [emailPass, setEmailPass] = useState('');
  const [emailErr, setEmailErr] = useState('');
  const [inLimit, setInLimit] = useState(10);
  const [outLimit, setOutLimit] = useState(10);
  const [profileErr, setProfileErr] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addErr, setAddErr] = useState('');
  const blocked = p.contacts.filter(c => c.blocked);
  const [deleteErr, setDeleteErr] = useState('');

  const handleDeleteAccount = () => {
    if (!window.confirm('Opravdu chceš trvale smazat svůj účet? Tato akce je nevratná.')) {
      return;
    }
    setDeleteErr('');
    api.deleteAccount()
        .then(() => {
          toast('Účet byl úspěšně smazán');
          p.onLogout();
        })
        .catch((err: unknown) => {
          setDeleteErr(err instanceof Error ? err.message : 'Smazání účtu selhalo.');
        });
  };

  const save = () => {
    setProfileErr('');
    if (!name.trim()) { setProfileErr('Jméno je povinné.'); return; }
    p.onSave({
      name: name.trim(),
      status,
      statusText: statusText.trim(),
      avatar: p.user.avatar,
      banner: p.user.banner,
    }).catch((err: unknown) => {
      setProfileErr(err instanceof Error ? err.message : 'Uložení profilu selhalo.');
    });
  };

  const savePass = () => {
    setPassErr('');
    if (!oldP || newP.length < 6) { setPassErr('Nové heslo musí mít aspoň 6 znaků.'); return; }
    if (newP !== newP2) { setPassErr('Hesla se neshodují.'); return; }
    api.changePassword(oldP, newP)
        .then(() => {
          setOldP(''); setNewP(''); setNewP2('');
          toast('Heslo změněno ✔');
        })
        .catch((err: unknown) => {
          setPassErr(err instanceof Error ? err.message : 'Změna hesla selhala.');
        });
  };

  const changeEmail = () => {
    setEmailErr('');
    if (!newEmail.trim()) { setEmailErr('Zadej nový e-mail.'); return; }
    if (!emailPass) { setEmailErr('Pro změnu e-mailu zadej aktuální heslo.'); return; }
    api.changeEmail(newEmail.trim(), emailPass)
        .then(() => {
          toast('Potvrzovací e-mail byl odeslán na ' + newEmail);
          setNewEmail(''); setEmailPass('');
        })
        .catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : 'Změna e-mailu selhala.';
          console.error('Change email error:', err);
          setEmailErr(msg);
        });
  };

  const handleUpload = (file: File, fileType: 'PROFILE_PICTURE' | 'BANNER') => {
    void uploadFile(file, fileType)
        .then(url => {
          void p.onSave({
            name: name.trim(),
            status,
            statusText: statusText.trim(),
            avatar: fileType === 'PROFILE_PICTURE' ? url : p.user.avatar,
            banner: fileType === 'BANNER' ? url : p.user.banner,
          });
          toast('Obrázek nahrán a uložen ✔');
        })
        .catch((err: unknown) => toast(err instanceof Error ? err.message : 'Nahrání selhalo 🚫'));
  };

  const submitAdd = (e: FormEvent) => {
    e.preventDefault();
    setAddErr('');
    const n = addEmail.trim();
    if (!n) { setAddErr('Vyplň e-mail uživatele.'); return; }
    p.onAddFriend(n)
        .then(() => setAddEmail(''))
        .catch((err: unknown) => {
          setAddErr(err instanceof Error ? err.message : 'Odeslání žádosti selhalo.');
        });
  };

  return (
      <div id="screen-settings" className="screen active">
        <header className="top-bar">
          <button className="btn small" onClick={p.onBack}>← Zpět</button>
          <h2>Nastavení</h2>
          <button className="btn small danger" onClick={p.onLogout}>Odhlásit se</button>
        </header>

        <div className="settings-scroll">
          <section className="card">
            <h3>Vzhled</h3>
            <label>Režim
              <select value={p.theme} onChange={e => p.onThemeChange(e.target.value as Theme)}>
                <option value="dark">Tmavý</option>
                <option value="light">Světlý</option>
              </select>
            </label>
          </section>

          <section className="card">
            <h3>Profil</h3>
            <div className="profile-row">
              <Avatar user={p.user} cls="av-lg" />
              <div>
                <label className="btn small" style={{ margin: 0, cursor: 'pointer' }}>
                  Změnit profilovku
                  <input type="file" accept="image/*" hidden onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    const f = e.target.files?.[0];
                    if (f) handleUpload(f, 'PROFILE_PICTURE');
                  }} />
                </label>
                <label className="btn small" style={{ margin: '0 0 0 10px', cursor: 'pointer' }}>
                  Změnit banner
                  <input type="file" accept="image/*" hidden onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    const f = e.target.files?.[0];
                    if (f) handleUpload(f, 'BANNER');
                  }} />
                </label>
                <div className="my-statustext">
                  {STATUS_CS[status]}{statusText ? ' · ' + statusText : ''}
                </div>
              </div>
            </div>
            {p.user.banner && <div className="banner-preview" style={{ backgroundImage: 'url(' + p.user.banner + ')' }} />}
            <label>Jméno<input type="text" value={name} onChange={e => setName(e.target.value)} /></label>
            <label>E-mail (pro změnu použij sekci níže)
              <input type="email" value={p.user.email} disabled style={{ opacity: 0.7, cursor: 'not-allowed' }} />
            </label>
            <label>Status
              <select value={status} onChange={e => setStatus(e.target.value as Status)}>
                <option value="ONLINE">Online</option>
                <option value="AWAY">Pryč</option>
                <option value="BUSY">Nerušit</option>
                <option value="OFFLINE">Offline</option>
              </select>
            </label>
            <label>Status text<input value={statusText} onChange={e => setStatusText(e.target.value)} placeholder="např. Ve schůzce do 15:00" /></label>
            <button className="btn accent" onClick={save}>Uložit změny</button>
            <div className="form-err">{profileErr}</div>
          </section>

          <section className="card">
            <h3>Změna hesla</h3>
            <label>Aktuální heslo<input type="password" value={oldP} onChange={e => setOldP(e.target.value)} /></label>
            <label>Nové heslo<input type="password" value={newP} onChange={e => setNewP(e.target.value)} /></label>
            <label>Nové heslo znovu<input type="password" value={newP2} onChange={e => setNewP2(e.target.value)} /></label>
            <div className="form-err">{passErr}</div>
            <button className="btn accent" onClick={savePass}>Změnit heslo</button>
          </section>

          <section className="card">
            <h3>Změna e-mailu</h3>
            <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '12px' }}>
              Pro změnu e-mailu ti pošleme potvrzovací odkaz na novou adresu.
            </p>
            <label>Nový e-mail
              <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value.trim())} placeholder="novy@email.cz" />
            </label>
            <label>Aktuální heslo (pro ověření)
              <input type="password" value={emailPass} onChange={e => setEmailPass(e.target.value)} placeholder="Zadej své současné heslo" />
            </label>
            <div className="form-err">{emailErr}</div>
            <button className="btn accent" onClick={changeEmail}>Změnit e-mail</button>
          </section>

          <section className="card">
            <h3>Přidat přítele</h3>
            <form className="add-friend" onSubmit={submitAdd}>
              <input value={addEmail} onChange={e => setAddEmail(e.target.value)} placeholder="E-mail uživatele…" />
              <button className="btn accent" type="submit">Odeslat žádost</button>
            </form>
            <div className="form-err">{addErr}</div>
          </section>

          <section className="card">
            <h3>Žádosti o přátelství</h3>

            <h4>Příchozí</h4>
            {p.requests.incoming.length === 0 && <div className="req-empty">Žádné příchozí žádosti.</div>}
            {p.requests.incoming.slice(0, inLimit).map(r => (
                <div className="req-item" key={r.id}>
                  <Avatar user={r} cls="av-head" />
                  <div className="who"><b>{r.name}</b><span>{r.note}</span></div>
                  <button className="btn small accent" onClick={() => p.onRespond(r, true)}>Přijmout</button>
                  <button className="btn small danger" onClick={() => p.onRespond(r, false)}>Odmítnout</button>
                </div>
            ))}
            {p.requests.incoming.length > inLimit && (
                <button className="btn small load-more" onClick={() => setInLimit(l => l + 10)}>Zobrazit další</button>
            )}

            <h4>Odchozí</h4>
            {p.requests.outgoing.length === 0 && <div className="req-empty">Žádné odchozí žádosti.</div>}
            {p.requests.outgoing.slice(0, outLimit).map(r => (
                <div className="req-item" key={r.id}>
                  <Avatar user={r} cls="av-head" />
                  <div className="who"><b>{r.name}</b><span>{r.note}</span></div>
                  <button className="btn small danger" onClick={() => p.onCancel(r)}>Zrušit</button>
                </div>
            ))}
            {p.requests.outgoing.length > outLimit && (
                <button className="btn small load-more" onClick={() => setOutLimit(l => l + 10)}>Zobrazit další</button>
            )}
          </section>

          <section className="card">
            <h3>Zablokovaní uživatelé</h3>
            {blocked.length === 0 && <div className="req-empty">Nikdo není zablokován.</div>}
            {blocked.map(c => (
                <div className="req-item" key={c.id}>
                  <Avatar user={c} cls="av-head" />
                  <div className="who"><b>{c.name}</b><span>zablokován</span></div>
                  <button className="btn small" onClick={() => p.onUnblock(c.id)}>Odblokovat</button>
                </div>
            ))}
          </section>

          <section className="card danger-zone" style={{ border: '1px solid var(--danger, #ff4d4f)' }}>
            <h3 style={{ color: 'var(--danger, #ff4d4f)' }}>Odstranění účtu</h3>
            <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '12px' }}>
              Jakmile účet smažeš, přijdeš o všechny zprávy a kontakty. Akci nelze vzít zpět.
            </p>
            <div className="form-err">{deleteErr}</div>
            <button className="btn danger" onClick={handleDeleteAccount}>
              Smazat účet
            </button>
          </section>
        </div>
      </div>
  );
}