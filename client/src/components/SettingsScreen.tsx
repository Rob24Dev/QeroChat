import { useState, type ChangeEvent, type FormEvent, useRef } from 'react';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

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

// Pomocná funkce pro vycentrování počátečního ořezu 1:1
function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
  return centerCrop(
      makeAspectCrop({ unit: '%', width: 90 }, aspect, mediaWidth, mediaHeight),
      mediaWidth,
      mediaHeight
  );
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

  // --- STAVY PRO CROPPER ---
  const [cropModalSrc, setCropModalSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const imgRef = useRef<HTMLImageElement | null>(null);

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
      name: (name ?? '').trim(),
      status,
      statusText: (statusText ?? '').trim(),
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
          setEmailErr(msg);
        });
  };

  const handleUpload = (file: File, fileType: 'PROFILE_PICTURE' | 'BANNER') => {
    if (fileType === 'PROFILE_PICTURE') {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCropModalSrc(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      return;
    }

    executeUpload(file, fileType);
  };

  const executeUpload = (file: File, fileType: 'PROFILE_PICTURE' | 'BANNER') => {
    void uploadFile(file, fileType)
        .then(url => {
          void p.onSave({
            name: (name ?? '').trim(),
            status,
            statusText: (statusText ?? '').trim(),
            avatar: fileType === 'PROFILE_PICTURE' ? url : p.user.avatar,
            banner: fileType === 'BANNER' ? url : p.user.banner,
          });
          toast('Obrázek nahrán a uložen ✔');
          setCropModalSrc(null);
        })
        .catch((err: unknown) => toast(err instanceof Error ? err.message : 'Nahrání selhalo 🚫'));
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, 1)); // Vynutit poměr 1:1
  };

  const handleCropConfirm = () => {
    const image = imgRef.current;
    if (!image || !crop) return;

    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    const targetSize = 400; // Výsledné rozlišení na backendu (400x400 px = čistý 1:1 poměr)
    canvas.width = targetSize;
    canvas.height = targetSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = targetSize * pixelRatio;
    canvas.height = targetSize * pixelRatio;
    ctx.scale(pixelRatio, pixelRatio);

    const cropX = crop.x * scaleX;
    const cropY = crop.y * scaleY;
    const cropW = crop.width * scaleX;
    const cropH = crop.height * scaleY;

    ctx.drawImage(
        image,
        cropX,
        cropY,
        cropW,
        cropH,
        0,
        0,
        targetSize,
        targetSize
    );

    canvas.toBlob((blob) => {
      if (!blob) return;
      const croppedFile = new File([blob], 'avatar-cropped.jpg', { type: 'image/jpeg' });
      executeUpload(croppedFile, 'PROFILE_PICTURE');
    }, 'image/jpeg', 0.9);
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
                {/* 1. Odznaky nahoře */}
                {p.user.badges && p.user.badges.length > 0 && (
                    <div className="pp-badges" style={{ marginBottom: '8px' }}>
                      {p.user.badges.map((b, i) => (
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

                {/* 2. Status uprostřed */}
                <div className="my-statustext" style={{ marginBottom: '8px' }}>
                  {STATUS_CS[status]}{statusText ? ' · ' + statusText : ''}
                </div>

                {/* 3. Tlačítka úplně dole */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <label className="btn small" style={{ margin: 0, cursor: 'pointer' }}>
                    Změnit profilovku
                    <input type="file" accept="image/*" hidden onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      const f = e.target.files?.[0];
                      if (f) handleUpload(f, 'PROFILE_PICTURE');
                    }} />
                  </label>
                  <label className="btn small" style={{ margin: 0, cursor: 'pointer' }}>
                    Změnit banner
                    <input type="file" accept="image/*" hidden onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      const f = e.target.files?.[0];
                      if (f) handleUpload(f, 'BANNER');
                    }} />
                  </label>
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

          {/* Ostatní sekce */}
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

        {/* --- 1:1 CROPPER MODAL (REACT-IMAGE-CROP) --- */}
        {cropModalSrc && (
            <div className="modal-backdrop" style={{
              position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
              background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
            }}>
              <div className="card" style={{ width: 'max-content', maxWidth: '90vw', textAlign: 'center', background: 'var(--bg-card, #222)', padding: '20px', borderRadius: '12px' }}>
                <h3>Upravit profilovou fotku (1:1)</h3>
                <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '15px' }}>
                  Označ myší oblast, kterou chceš vyříznout.
                </p>

                <div style={{ maxHeight: '60vh', overflow: 'auto', marginBottom: '15px' }}>
                  <ReactCrop
                      crop={crop}
                      onChange={(c) => setCrop(c)}
                      aspect={1}
                  >
                    <img
                        ref={imgRef}
                        src={cropModalSrc}
                        alt="Crop preview"
                        onLoad={onImageLoad}
                        style={{ maxHeight: '50vh', display: 'block' }}
                    />
                  </ReactCrop>
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <button className="btn" onClick={() => setCropModalSrc(null)}>Zrušit</button>
                  <button className="btn accent" onClick={handleCropConfirm}>Uložit profilovku</button>
                </div>
              </div>
            </div>
        )}
      </div>
  );
}