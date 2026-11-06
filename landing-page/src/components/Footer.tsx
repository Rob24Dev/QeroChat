import { Link } from 'react-router-dom';

export default function Footer() {
    return (
        <footer>
            <p className="warn">⚠️ Aplikace je ve vývoji a je poskytována „jak je".</p>
            <p>© 2026 QeroChat · Vyrobeno s ❤️ a spoustou nápadů</p>
            <div className="links">
                <Link to="/conditions">Podmínky používání</Link>
                <Link to="/conditions#gdpr">Zpracování osobních údajů</Link>
            </div>
        </footer>
    );
}