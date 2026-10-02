import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AdminAuthProvider } from './context/AdminAuth';
import Header from './components/Header';
import AdminToolbar from './components/AdminToolbar';
import GlassEffects from './components/GlassEffects';
import Loader from './components/Loader';
import SectionNav from './components/SectionNav';
import AskTedx from './components/AskTedx';
import Home from './pages/Home';
import Team from './pages/Team';
import TeamMember from './pages/TeamMember';
import NotFound from './pages/NotFound';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import { getSiteSettings } from './services/api';

function App() {
  const [siteSettings, setSiteSettings] = useState({});

  useEffect(() => {
    getSiteSettings().then(setSiteSettings).catch(() => {});
  }, []);

  return (
    <BrowserRouter>
      <AdminAuthProvider>
        <Loader />
        <GlassEffects />
        <SectionNav />
        <AskTedx />
        <a href="#main" className="skip-link">Skip to content</a>
        <Header siteSettings={siteSettings} onSiteSettingsChange={setSiteSettings} />
        <main id="main" className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/team" element={<Team />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/:slug" element={<TeamMember />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </AdminAuthProvider>
    </BrowserRouter>
  );
}

export default App;
