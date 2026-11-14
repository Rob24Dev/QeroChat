import { useState, useEffect, type FormEvent } from 'react';
import { api } from '../api';
import { toast } from '../utils';
import type { User } from '../types';
import Particles from './Particles';

// Zrušena možnost 'register' z typů formuláře
type Form = 'login' | 'forgot' | 'reset';

const IcoPerson = () => (
    <svg className="inp-ico" viewBox="0 0 24 24"><path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0 2c-4.4 0-8 2.2-8 5v1h16v-1c0-2.8-3.6-5-8-5z" /></svg>
);
const IcoMail = () => (
    <svg className="inp-ico" viewBox="0 0 24 24"><path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4-8 5-8-5V6l8 5 8-5z" /></svg>
);
const IcoLock = () => (
    <svg className="inp-ico" viewBox="0 0 24 24"><path d="M17 9V7a5 5 0 0 0-10 0v2H5v13h14V9zm-8 0V7a3 3 0 0 1 6 0v2z" /></svg>
);
const IcoEye = ({ off }: { off: boolean }) => (
    <svg viewBox="0 0 24 24">
      <path d="M12 5C5 5 2 12 2 12s3 7 10 7 10-7 10-7-3-7-10-7zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8z" />
      {off && <path d="M3 3l18 18" stroke="currentColor" strokeWidth="2" fill="none" />}
    </svg>
);

export default function AuthScreen({ onAuthed }: { onAuthed: (u: User, t: string, remember: boolean) => void }) {
  /* pokud URL obsahuje ?reset=TOKEN (odkaz z e-mailu), rovnou reset formulář */
  const [form, setForm] = useState<Form>(() =>
      new URLSearchParams(window.location.search).get('reset') ? 'reset' : 'login'
  );
  const [resetToken] = useState(() =>
      new URLSearchParams(window.location.search).get('reset') ?? ''
  );

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginErr, setLoginErr] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const [remember, setRemember] = useState(true);

  /* --- REGISTRACE ZAKOMENTOVÁNA PRO BETHU --- */
  /*
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regPass2, setRegPass2] = useState('');
  const [regErr, setRegErr] = useState('');
  const [showReg, setShowReg] = useState(false);
  */

  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotErr, setForgotErr] = useState('');

  const [resetPass, setResetPass] = useState('');
  const [resetPass2, setResetPass2] = useState('');
  const [resetErr, setResetErr] = useState('');
  const [showReset, setShowReset] = useState(false);

  // --- AUTOMATICKÉ POTVRZENÍ E-MAILU Z URL (?confirm-email=TOKEN) ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const confirmToken = params.get('confirm-email');

    if (confirmToken) {
      api.confirmEmail(confirmToken)
          .then(() => {
            toast('E-mail byl úspěšně ověřen ✔ Nyní se můžeš přihlásit.');
            window.history.replaceState(null, '', window.location.pathname);
          })
          .catch((err: unknown) => {
            const msg = err instanceof Error ? err.message : 'Ověření e-mailu selhalo.';
            setLoginErr(msg);
            window.history.replaceState(null, '', window.location.pathname);
          });
    }
  }, []);

  const errText = (e: unknown, fallback: string) =>
      e instanceof Error ? e.message : fallback;

  const submitLogin = async (e: FormEvent) => {
    e.preventDefault(); setLoginErr('');
    if (!loginEmail || !loginPass) { setLoginErr('Vyplň e-mail i heslo.'); return; }
    try {
      const res = await api.login(loginEmail, loginPass);
      onAuthed(res.user, res.token, remember);
    } catch (err) {
      setLoginErr(errText(err, 'Přihlášení selhalo.'));
    }
  };

  /* --- REGISTRAČNÍ FUNKCE ZAKOMENTOVÁNA --- */
  /*
  const submitRegister = async (e: FormEvent) => {
    e.preventDefault(); setRegErr('');
    if (!regName || !regEmail) { setRegErr('Vyplň jméno i e-mail.'); return; }
    if (regPass.length < 6) { setRegErr('Heslo musí mít aspoň 6 znaků.'); return; }
    if (regPass !== regPass2) { setRegErr('Hesla se neshodují.'); return; }
    try {
      const res = await api.register(regName, regEmail, regPass);
      onAuthed(res.user, res.token, true);
      toast('Účet vytvořen 🎉');
    } catch (err) {
      setRegErr(errText(err, 'Registrace selhala.'));
    }
  };
  */

  const submitForgot = async (e: FormEvent) => {
    e.preventDefault(); setForgotErr('');
    if (!forgotEmail) { setForgotErr('Vyplň e-mail.'); return; }
    try {
      await api.forgotPassword(forgotEmail);
      toast('Pokud účet existuje, poslali jsme resetovací odkaz na ' + forgotEmail);
      setForm('login');
    } catch (err) {
      setForgotErr(errText(err, 'Odeslání selhalo.'));
    }
  };

  const submitReset = async (e: FormEvent) => {
    e.preventDefault(); setResetErr('');
    if (!resetToken) { setResetErr('Chybí reset token – použij odkaz z e-mailu.'); return; }
    if (resetPass.length < 6) { setResetErr('Heslo musí mít aspoň 6 znaků.'); return; }
    if (resetPass !== resetPass2) { setResetErr('Hesla se neshodují.'); return; }
    try {
      await api.resetPassword(resetToken, resetPass);
      window.history.replaceState(null, '', window.location.pathname);
      toast('Heslo změněno ✔ Přihlas se.');
      setForm('login');
    } catch (err) {
      setResetErr(errText(err, 'Reset hesla selhal.'));
    }
  };

  const eye = (shown: boolean, toggle: () => void) => (
      <button type="button" className="inp-eye" onClick={toggle} tabIndex={-1}>
        <IcoEye off={!shown} />
      </button>
  );

  return (
      <div id="screen-auth" className="screen active">
        <Particles />
        <div className="auth-card">

          <div className="auth-logo">
            <img
                src="/icon.png"
                alt="QeroChat Logo"
                style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '8px' }}
            />
          </div>

          <h1 className="auth-title">QeroChat</h1>
          <p className="auth-sub">
            {form === 'login' && 'Vítej zpět! Přihlas se ke svému účtu.'}
            {form === 'forgot' && 'Pošleme ti odkaz pro obnovu hesla.'}
            {form === 'reset' && 'Zadej nové heslo pro svůj účet.'}
          </p>

          {form === 'login' && (
              <form onSubmit={submitLogin} noValidate>
                <div className="inp-wrap"><IcoPerson /><input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value.trim())} placeholder="E-mail" /></div>
                <div className="inp-wrap"><IcoLock /><input type={showLogin ? 'text' : 'password'} value={loginPass} onChange={e => setLoginPass(e.target.value)} placeholder="Heslo" />{eye(showLogin, () => setShowLogin(s => !s))}</div>
                <div className="auth-row">
                  <label className="chk"><input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />Zapamatuj si mě</label>
                  <a onClick={() => setForm('forgot')}>Zapomenuté heslo?</a>
                </div>
                <div className="form-err">{loginErr}</div>
                <button className="btn-gradient" type="submit">Přihlásit se</button>
                {/* Odkaz na registraci byl odstraněn/zakomentován, protože v betě se uživatelé registrují přes webový waitlist */}
              </form>
          )}

          {/* --- REGISTRAČNÍ FORMULÁŘ ZAKOMENTOVÁN --- */}
          {/*
          {form === 'register' && (
              <form onSubmit={submitRegister} noValidate>
                <div className="inp-wrap"><IcoPerson /><input type="text" value={regName} onChange={e => setRegName(e.target.value.trim())} placeholder="Jméno" /></div>
                <div className="inp-wrap"><IcoMail /><input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value.trim())} placeholder="E-mail" /></div>
                <div className="inp-wrap"><IcoLock /><input type={showReg ? 'text' : 'password'} value={regPass} onChange={e => setRegPass(e.target.value)} placeholder="Heslo (min. 6 znaků)" />{eye(showReg, () => setShowReg(s => !s))}</div>
                <div className="inp-wrap"><IcoLock /><input type={showReg ? 'text' : 'password'} value={regPass2} onChange={e => setRegPass2(e.target.value)} placeholder="Heslo znovu" />{eye(showReg, () => setShowReg(s => !s))}</div>
                <div className="form-err">{regErr}</div>
                <button className="btn-gradient" type="submit">Vytvořit účet</button>
                <p className="auth-switch">Už máš účet? <a onClick={() => setForm('login')}>Přihlas se</a></p>
              </form>
          )}
          */}

          {form === 'forgot' && (
              <form onSubmit={submitForgot} noValidate>
                <div className="inp-wrap"><IcoMail /><input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value.trim())} placeholder="E-mail" /></div>
                <div className="form-err">{forgotErr}</div>
                <button className="btn-gradient" type="submit">Poslat resetovací odkaz</button>
                <p className="auth-switch"><a onClick={() => setForm('login')}>Zpět na přihlášení</a></p>
              </form>
          )}

          {form === 'reset' && (
              <form onSubmit={submitReset} noValidate>
                <div className="inp-wrap">
                  <IcoLock />
                  <input type={showReset ? 'text' : 'password'} value={resetPass} onChange={e => setResetPass(e.target.value)} placeholder="Nové heslo (min. 6 znaků)" />
                  {eye(showReset, () => setShowReset(s => !s))}
                </div>
                <div className="inp-wrap"><IcoLock /><input type={showReset ? 'text' : 'password'} value={resetPass2} onChange={e => setResetPass2(e.target.value)} placeholder="Heslo znovu" /></div>
                <div className="form-err">{resetErr}</div>
                <button className="btn-gradient" type="submit">Nastavit nové heslo</button>
                <p className="auth-switch"><a onClick={() => setForm('login')}>Zpět na přihlášení</a></p>
              </form>
          )}
        </div>
      </div>
  );
}