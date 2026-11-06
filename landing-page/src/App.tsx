import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Particles from './components/Particles';
import Home from './pages/Home';
import Conditions from './pages/Conditions';
import Recruitment from './pages/Recruitment';

function App() {
    return (
        <BrowserRouter>
            <Particles />
            <Navbar />
            <main style={{ flex: 1 }}>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/conditions" element={<Conditions />} />
                    <Route path="/recruitment" element={<Recruitment />} />
                </Routes>
            </main>
            <Footer />
        </BrowserRouter>
    );
}

export default App;