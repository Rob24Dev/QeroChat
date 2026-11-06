import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
    const location = useLocation();
    const isHome = location.pathname === '/';

    return (
        <nav>
            <Link to="/" className="nav-logo">
                <img src="/assets/icon.png" alt="QeroChat Logo" className="logo-img" />
                QeroChat
            </Link>

            {isHome ? (
                <div className="nav-links">
                    <Link to="/recruitment">Nábor</Link>
                    <a href="#funkce">Funkce</a>
                    <a href="#o-projektu">O projektu</a>
                    <a href="#team">Team</a>
                    <a href="#faq">FAQ</a>
                </div>
            ) : (
                <Link to="/" style={{ marginLeft: 'auto', color: 'var(--muted)', fontWeight: 600, fontSize: 14 }}>
                    ← Zpět na hlavní stránku
                </Link>
            )}

            {isHome && (
                <button className="btn-gradient" onClick={() => document.getElementById('beta')?.scrollIntoView({ behavior: 'smooth' })}>
                    Chci do bety
                </button>
            )}
        </nav>
    );
}