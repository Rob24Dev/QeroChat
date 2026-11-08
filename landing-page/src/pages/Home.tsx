import { useState, useEffect } from 'react';

export default function Home() {
    const [timeLeft, setTimeLeft] = useState({ days: '00', hours: '00', minutes: '00', seconds: '00' });
    const [showCountdown, setShowCountdown] = useState(true);

    const [email, setEmail] = useState('');
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [agreeNews, setAgreeNews] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '' as 'ok' | 'err' | '', text: '' });

    useEffect(() => {
        const TARGET_DATE = new Date('2026-12-12T16:00:00');
        const timer = setInterval(() => {
            const diff = TARGET_DATE.getTime() - new Date().getTime();
            if (diff <= 0) {
                setShowCountdown(false);
                clearInterval(timer);
                return;
            }
            setShowCountdown(true);
            setTimeLeft({
                days: String(Math.floor(diff / (1000 * 60 * 60 * 24))).padStart(2, '0'),
                hours: String(Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))).padStart(2, '0'),
                minutes: String(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0'),
                seconds: String(Math.floor((diff % (1000 * 60)) / 1000)).padStart(2, '0'),
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        // 1. Kontrola e-mailu
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setMessage({ type: 'err', text: 'Zadej platný e-mail.' });
            return;
        }

        // 2. Dvojí kontrola souhlasu s podmínkami (pro jistotu)
        if (!agreeTerms) {
            setMessage({ type: 'err', text: 'Musíš souhlasit s podmínkami používání.' });
            return;
        }

        setIsSubmitting(true);
        try {
            const API_BASE = import.meta.env.VITE_API_BASE || '';

            const res = await fetch(`${API_BASE}/v1/beta/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, agreeNews }),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                throw new Error(data.message || `HTTP chyba: ${res.status}`);
            }

            setMessage({ type: 'ok', text: data.message || `✔ Jsi na seznamu! Pozvánku pošleme na ${email}.` });
            setEmail('');
            setAgreeTerms(false);
            setAgreeNews(false);
        } catch (err: any) {
            setMessage({ type: 'err', text: err.message || 'Odeslání selhalo. Zkus to později.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <header className="hero">
                <h1>QeroChat</h1>
                <p>Moderní chat od hráčů pro hráčů. Soustředíme se na to podstatné. Skvělé funkce, jednoduchost a vše na jednom místě!</p>

                {showCountdown && (
                    <div className="countdown-wrapper">
                        <div className="countdown-label">🚀 <span>Beta otevřená</span> za:</div>
                        <div className="countdown">
                            <div className="countdown-box"><div className="num">{timeLeft.days}</div><div className="label">Dní</div></div>
                            <div className="countdown-box"><div className="num">{timeLeft.hours}</div><div className="label">Hodin</div></div>
                            <div className="countdown-box"><div className="num">{timeLeft.minutes}</div><div className="label">Minut</div></div>
                            <div className="countdown-box"><div className="num">{timeLeft.seconds}</div><div className="label">Sekund</div></div>
                        </div>
                    </div>
                )}

                <div className="hero-cta">
                    <button className="btn-gradient" onClick={() => document.getElementById('beta')?.scrollIntoView({ behavior: 'smooth' })}>🚀 Připojit se do bety</button>
                    <button className="btn-ghost" onClick={() => document.getElementById('funkce')?.scrollIntoView({ behavior: 'smooth' })}>Prozkoumat funkce</button>
                </div>
            </header>

            <section id="beta">
                <h2 className="section-title">Připoj se do <span>bety</span></h2>
                <p className="section-sub">Zadejte e-mail a jakmile se uvolní místo, pošleme ti pozvánku s přístupem do aplikace.</p>
                <form className="join-card" onSubmit={handleSubmit} noValidate>
                    <h3>🚀 Zajisti si místo ve frontě</h3>
                    <p className="sub">První vlna pozvánek odletí <b>10. října v 16:00</b>. Čím dříve se zapíšeš, tím výše ve frontě budeš.</p>
                    <div className="join-row">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="tvuj@email.cz"
                            autoComplete="email"
                            required
                        />

                        {/* ZDE JE KLÍČOVÁ ZMĚNA: disabled={isSubmitting || !agreeTerms} */}
                        <button
                            className="btn-gradient"
                            type="submit"
                            disabled={isSubmitting || !agreeTerms}
                        >
                            {isSubmitting ? 'Odesílám…' : 'Chci early access'}
                        </button>
                    </div>

                    <div className="checkbox-group">
                        <div className="checkbox-row">
                            <input
                                type="checkbox"
                                id="agree-terms"
                                checked={agreeTerms}
                                onChange={(e) => setAgreeTerms(e.target.checked)}
                                required
                            />
                            <label htmlFor="agree-terms">
                                Souhlasím s <a href="/conditions" target="_blank" rel="noopener noreferrer">podmínkami a zpracováním údajů</a>
                            </label>
                        </div>
                        <div className="checkbox-row">
                            <input
                                type="checkbox"
                                id="agree-news"
                                checked={agreeNews}
                                onChange={(e) => setAgreeNews(e.target.checked)}
                            />
                            <label htmlFor="agree-news">Chci dostávat e-maily o novinkách a vývoji projektu (nepovinné)</label>
                        </div>
                    </div>

                    <p className="join-note" style={{ color: 'var(--ok)', fontWeight: 600, marginTop: 16 }}>
                        🎁 Bonus: Prvních 100 zaregistrovaných získá doživotní "Podporovatel" odznak.
                    </p>

                    {message.text && <div className={`form-msg ${message.type}`}>{message.text}</div>}

                    <p className="join-note">⚠️ Služba je ve vývoji a je poskytována „jak je". Data mohou být kdykoliv smazána, služba může být nedostupná a mohou se vyskytnout chyby. Nepoužívejte citlivé údaje ani hesla, která používáte jinde.</p>
                </form>
            </section>

            <section id="funkce">
                <h2 className="section-title">Co <span>umíme?</span></h2>
                <p className="section-sub">Naše cesta je na začátku, ale už tak něco umíme a plno věcí se chystá. 👀</p>
                <div className="features">
                    <div className="feature"><div className="ico">🗫</div><b>Možnost více chatů s jednou osobou</b><p>Mějte vše rozdělené do kategorií a tvořte přehlednější historii zpráv. Bavíte se o práci? Udělejte si chat: #prace.</p></div>
                    <div className="feature"><div className="ico">💬</div><b>Chaty v reálném čase</b><p>Naprostá samozřejmost, a tak ani my nejsme výjimkou!</p></div>
                    <div className="feature"><div className="ico">🏅</div><b>Odznaky</b><p>Odznaky na profilu? Proč ne? A můžete je získat i vy!</p></div>
                    <div className="feature"><div className="ico">🌗</div><b>Tmavý i světlý režim</b><p>Prostředí pro všechny. Noční dravce i ranní ptáky.</p></div>
                    <div className="feature"><div className="ico">⚡</div><b>Offline režim</b><p>Výpadek? Žádný stres! Zprávy se uloží a až budete online, tak se pošlou.</p></div>
                </div>
            </section>

            <section id="o-projektu">
                <h2 className="section-title">O <span>projektu</span></h2>
                <p className="section-sub">Kdo stojí za QeroChatem a proč vůbec vzniká.</p>
                <div className="about-card">
                    <p><b>QeroChat</b> nemá za cíl stát se globální platformou. Jde o studentský projekt, který má za účel rozšířit portfolio autorů.</p>
                    <p>Tento projekt vznikl pouze z čistého nadšení pro vývoj a jako možnost naučit se něco nového. Projekt se ovšem trochu rozrostl, a tak jsem se ho rozhodl ukázat. Pokud tě vývoj zajímá více, můžeš se podívat na náš GitHub, kde máme repozitář přímo pro tento projekt. <a href="https://github.com/QeroChat" target="_blank" rel="noopener noreferrer">https://github.com/QeroChat</a><br/><i>-Rob</i></p>
                </div>
            </section>

            <section id="team">
                <h2 className="section-title">Náš <span>team a podporovatelé ❤️</span></h2>
                <p className="section-sub">Moc nás zatím není, ale to můžeš změnit! Hledáme nové posily do týmu <a href="/recruitment" target="_blank">na této stránce</a></p>
                <div className="team">
                    <div className="member">
                        <div className="av">R</div>
                        <div className="member-header">
                            <b>Rob</b>
                            <a href="https://www.instagram.com/rob24dev/" target="_blank" rel="noopener noreferrer" className="social-link" title="Instagram">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                            </a>
                        </div>
                        <div className="role">Zakladatel & Hlavní programátor</div>
                        <p>Když něco nefunguje? Zbičujte jeho. Doufám, že to bude co nejméně. 🙏</p>
                    </div>
                    <div className="member">
                        <div className="av">P</div>
                        <div className="member-header">
                            <b>Pavel</b>
                            <a href="https://www.instagram.com/x6pavelkalas/" target="_blank" rel="noopener noreferrer" className="social-link" title="Instagram">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                            </a>
                        </div>
                        <div className="role">Správce sítě</div>
                        <p>Web vůbec nenačte? Pravděpodobně je to jeho práce! 😡</p>
                    </div>
                    <div className="member">
                        <div className="av">J</div>
                        <div className="member-header">
                            <b>JustDrven</b>
                            <a href="https://www.instagram.com/justdrven.dev/" target="_blank" rel="noopener noreferrer" className="social-link" title="Instagram">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                            </a>
                        </div>
                        <div className="role">Externí specialista & podpora</div>
                        <p>Sem tam se podívá na kód a vše škrtne. 😭</p>
                    </div>
                    <div className="member">
                        <div className="av">P</div>
                        <div className="member-header">
                            <b>Petr</b>
                            <a href="https://www.instagram.com/petosek_v/" target="_blank" rel="noopener noreferrer" className="social-link" title="Instagram">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                            </a>
                        </div>
                        <div className="role">Grafik</div>
                        <p>Tvoří 2D grafiku pro tento web. 🖌️</p>
                    </div>
                </div>
            </section>

            <section id="faq">
                <h2 className="section-title">Časté <span>dotazy</span></h2>
                <p className="section-sub">Na co se lidi ptají nejčastěji.</p>
                <div className="faq">
                    <details><summary>Je QeroChat zdarma?</summary><p>Ano, během betatestu je vše zdarma a i dlouho poté. Pokud něco bude za peníze, bude to dobrovolné a spíše jako podpora pro náš tým.</p></details>
                    <details><summary>Jak se dostanu do bety?</summary><p>Zadejte e-mail do formuláře výše. Pokud je zrovna místo, pošleme vám okamžitě pozvánku s přístupovými údaji a instrukcemi.</p></details>
                    <details><summary>Je aplikace bezpečná?</summary><p>I když se snažíme udělat pro bezpečnost maximum, mohou nastat chyby a výpadky. Pokud se chcete přihlásit do bety, přečtěte si podmínky používání a GDPR. Samotná aplikace je bezpečná a nejde o žádný scam, malware.</p></details>
                    <details><summary>Co se stane s mými daty po konci bety?</summary><p>Veškerá data, chaty, statusy a zprávy budou smazané. O této akci vám dáme dostatečně vědět e-mailem i zprávou na samostatné aplikaci.</p></details>
                    <details><summary>Kdy vyjde plná verze?</summary><p>Plná verze je pro nás spoustu práce a i hodně otázek ohledně bezpečnosti a právních věcí. Přesné datum tedy není stanovené a taky ani nikdy být nemusí.</p></details>
                    <details><summary>Mohu vám nějak pomoct?</summary><p>Bohatě stačí, když nám dáte šanci a případně o naší aplikaci řeknete kámošům. Pokud chcete, můžete se přihlásit k nám do týmu prostřednictvím vyplnění formuláře na <a href="/recruitment" target="_blank">stránce</a>.</p></details>
                    <details><summary>Je web generovaný umělou inteligencí?</summary><p>Ano, náš tým zatím nedisponuje specialistou na frontend (toho, co vidíš, vzhled) webové stránky, a tedy jsme zatím použili AI. Vše ostatní včetně textu na této stránce a logiky na serveru je psáno skutečnými lidmi. Pokud se projekt rozroste, máme v plánu zaplatit programátora i na tuto část webu.</p></details>
                </div>
            </section>
        </>
    );
}