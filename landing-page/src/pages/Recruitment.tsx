export default function Recruitment() {
    return (
        <>
            <header className="hero recruitment-hero">
                <h1><span className="emoji">🚀</span>OTEVŘENÉ NÁBORY</h1>
                <p>Chceš se stát součástí našeho týmu? Hledáme nové talenty, který chtějí růst a pomáhat nám budovat naši vizi.</p>
            </header>

            <div className="recruitment-grid">
                <div className="recruitment-card">
                    <div className="card-header">
                        <div className="card-icon dev">👨‍💻</div>
                        <div className="card-title">
                            <h3>Frontend Developer</h3>
                            <span>Otevřený nábor</span>
                        </div>
                    </div>
                    <div className="card-body">
                        <p>Zajímáš se o vývoj webových aplikací? Máš cit pro grafiku a vizuál? Pak hledáme přímo tebe!</p>
                        <ul>
                            <li>Možnost realizovat své nápady</li>
                            <li>Odznak a zmínění v sekci tým</li>
                            <li>Kariérní růst v týmu</li>
                            <li>Rozvoj dovedností</li>
                            <li>Přátelský kolektiv</li>
                            <li>Online akce a teambuildingy</li>
                        </ul>
                    </div>
                    <div className="card-footer">
                        <a href="https://forms.google.com/developer" target="_blank" rel="noopener noreferrer" className="btn-form">Vyplnit přihlášku →</a>
                    </div>
                </div>

                <div className="recruitment-card">
                    <div className="card-header">
                        <div className="card-icon graphic-designer">🖌️</div>
                        <div className="card-title">
                            <h3>2D Grafik</h3>
                            <span>Otevřený nábor</span>
                        </div>
                    </div>
                    <div className="card-body">
                        <p>Zajímáš se o digitální grafiku? Máš cit pro vizuál? Pak hledáme přímo tebe!</p>
                        <ul>
                            <li>Možnost realizovat své nápady</li>
                            <li>Odznak a zmínění v sekci tým</li>
                            <li>Kariérní růst v týmu</li>
                            <li>Rozvoj dovedností</li>
                            <li>Přátelský kolektiv</li>
                            <li>Online akce a teambuildingy</li>
                        </ul>
                    </div>
                    <div className="card-footer">
                        <a href="https://forms.google.com/developer" target="_blank" rel="noopener noreferrer" className="btn-form">Vyplnit přihlášku →</a>
                    </div>
                </div>

                <div className="recruitment-card">
                    <div className="card-header">
                        <div className="card-icon mod">👮‍♂️</div>
                        <div className="card-title">
                            <h3>Moderátor</h3>
                            <span>Otevřený nábor</span>
                        </div>
                    </div>
                    <div className="card-body">
                        <p>Jsi komunikativní povaha a rád pomáháš? Pokud ano, budeme moc rádi, když se k nám přidáš.</p>
                        <ul>
                            <li>Kariérní růst v týmu</li>
                            <li>Odznak a zmínění v sekci tým</li>
                            <li>Rozvoj dovedností</li>
                            <li>Přátelský kolektiv</li>
                            <li>Online akce a teambuildingy</li>
                        </ul>
                    </div>
                    <div className="card-footer">
                        <a href="https://forms.google.com/moderator" target="_blank" rel="noopener noreferrer" className="btn-form">Vyplnit přihlášku →</a>
                    </div>
                </div>

                <div className="recruitment-card">
                    <div className="card-header">
                        <div className="card-icon marketing-specialist">📈</div>
                        <div className="card-title">
                            <h3>Marketingový specialista</h3>
                            <span>Otevřený nábor</span>
                        </div>
                    </div>
                    <div className="card-body">
                        <p>Nebojíš se čísel a grafů? Umíš promovat a sociální sítě Ti nejsou cizí? Pokud ano, jsi ten správný typ uchazeče, kterého hledáme.</p>
                        <ul>
                            <li>Kariérní růst v týmu</li>
                            <li>Odznak a zmínění v sekci tým</li>
                            <li>Rozvoj dovedností</li>
                            <li>Přátelský kolektiv</li>
                            <li>Online akce a teambuildingy</li>
                        </ul>
                    </div>
                    <div className="card-footer">
                        <a href="https://forms.google.com/tester" target="_blank" rel="noopener noreferrer" className="btn-form">Vyplnit přihlášku →</a>
                    </div>
                </div>
            </div>
        </>
    );
}