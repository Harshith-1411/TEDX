import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuth';
import { updateAdminLogo } from '../services/api';
import AdminEventTimeModal from './AdminEventTimeModal';
import './Header.css';

const THEMES = [
  { id: 'red', name: 'Red', sub: 'Original', sw: 'linear-gradient(135deg,#020203 45%,#e62b1e)' },
  { id: 'white', name: 'White', sub: 'Light', sw: 'linear-gradient(135deg,#f3f3f6 50%,#d42215 50%)' },
  { id: 'matrix', name: 'Matrix', sub: 'Code rain', sw: 'linear-gradient(135deg,#000a04 40%,#00e676)' },
  { id: 'marvel', name: 'Marvel', sub: 'Red + gold', sw: 'linear-gradient(135deg,#e23636 0%,#f5c542 55%,#0d1330 55%)' },
  { id: 'cyberpunk', name: 'Cyberpunk', sub: 'Pink + cyan', sw: 'linear-gradient(135deg,#ff2bd6 0%,#00e5ff 60%,#120633 60%)' },
  { id: 'maths', name: 'Maths', sub: 'Chalk + blue', sw: 'linear-gradient(135deg,#ffd166 0%,#7cc7ff 55%,#0e231d 55%)' },
  { id: 'gotham', name: 'Gotham', sub: 'Black + yellow', sw: 'linear-gradient(135deg,#ffd400 0%,#8ea2bd 50%,#05060a 50%)' },
];

function Header({ siteSettings = {}, onSiteSettingsChange }) {
  const { isAdmin, token, clearSession, logout } = useAdminAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [eventTimeModalOpen, setEventTimeModalOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('red');
  const [reduceFx, setReduceFx] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const themeMenuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('tedx-theme') || 'red';
      setCurrentTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
      const savedFx = localStorage.getItem('tedx-reduce') === '1';
      setReduceFx(savedFx);
      document.documentElement.classList.toggle('reduce-fx', savedFx);
    } catch (e) {}
  }, []);

  const selectTheme = (themeId) => {
    setCurrentTheme(themeId);
    document.documentElement.setAttribute('data-theme', themeId);
    try { localStorage.setItem('tedx-theme', themeId); } catch(e){}
    setThemeMenuOpen(false);
    window.dispatchEvent(new CustomEvent('tedx-theme', { detail: themeId }));
  };

  const toggleLightDark = () => {
    const next = currentTheme === 'white' ? 'red' : 'white';
    selectTheme(next);
  };

  const toggleFx = () => {
    const next = !reduceFx;
    setReduceFx(next);
    document.documentElement.classList.toggle('reduce-fx', next);
    try { localStorage.setItem('tedx-reduce', next ? '1' : '0'); } catch(e){}
    window.dispatchEvent(new CustomEvent('tedx-fx', { detail: next }));
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target) && !e.target.closest('#theme-pick')) {
        setThemeMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const updated = await updateAdminLogo(token, 'header', file, currentTheme);
      if (typeof onSiteSettingsChange === 'function') onSiteSettingsChange(updated);
    } catch (err) {
      if (err.status === 401) clearSession?.();
      else alert(err.data?.message || 'Failed to update header logo.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Each theme strictly uses its own uploaded logo. Only the default 'red' theme falls back to headerLogo.
  const activeLogo = siteSettings.themeLogos?.[currentTheme] || (currentTheme === 'red' ? (siteSettings.themeLogos?.red || siteSettings.headerLogo) : null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  const handleHashClick = (e, hash) => {
    closeMenu();
    if (window.location.pathname === '/') {
      e.preventDefault();
      const el = document.querySelector(hash);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const navItems = [
    { label: 'About', href: '#about', hash: true },
    { label: 'Countdown', href: '#countdown', hash: true },
    { label: 'Speakers', href: '#speakers', hash: true },
    { label: 'Team', href: '#team', hash: true },
    { label: 'FAQ', href: '#faq', hash: true },
    { label: 'Contact', href: '#contact', hash: true },
  ];

  return (
    <>
      <nav className={`site-nav mono ${scrolled ? 'is-scrolled' : ''}`}>
        <div className="nav-logo">
          <Link to="/" onClick={closeMenu}>
            {activeLogo ? (
              <img src={activeLogo} alt="TEDx BIET" className="nav-logo-img" />
            ) : (
              <span>TED<span className="nav-x">x</span>BIET</span>
            )}
          </Link>
          {isAdmin && (
            <>
              <button
                type="button"
                className="logo-edit-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                aria-label={`Edit ${currentTheme} logo`}
                title={`Change logo for ${currentTheme} theme`}
              >
                {uploading ? '...' : `Edit (${currentTheme})`}
              </button>
              <button
                type="button"
                className="logo-edit-btn"
                style={{ marginLeft: '6px' }}
                onClick={() => setEventTimeModalOpen(true)}
                title="Change Event Date & Time (Persists in Database)"
              >
                ⏱️ Event Time
              </button>
            </>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} />
        </div>

        <ul className="nav-links">
          {navItems.map((item) => (
            <li key={item.label}>
              <a href={item.href} onClick={(e) => handleHashClick(e, item.href)}>
                {item.label}
              </a>
            </li>
          ))}
          {!isAdmin && (
            <li>
              <NavLink to="/admin/login" className="nav-login-btn" onClick={closeMenu}>
                Log In
              </NavLink>
            </li>
          )}
          {isAdmin && (
            <li>
              <button type="button" className="nav-sign-out" onClick={() => { closeMenu(); logout(); navigate('/'); }}>
                Sign Out
              </button>
            </li>
          )}
        </ul>

        <div className="nav-tools">
          {/* Theme Palette Picker */}
          <button
            type="button"
            className="nav-tool"
            id="theme-pick"
            aria-haspopup="true"
            aria-expanded={themeMenuOpen}
            aria-controls="theme-menu"
            aria-label="Choose a theme"
            title="Themes"
            onClick={(e) => { e.stopPropagation(); setThemeMenuOpen(!themeMenuOpen); }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 3a9 9 0 1 0 0 18c1.4 0 2-1 2-2 0-1.6-1-1.8-1-3 0-1 .8-2 2-2h2.5A3.5 3.5 0 0 0 21 10.5C21 6.4 17 3 12 3z"/>
              <circle cx="7.5" cy="11" r="1"/>
              <circle cx="10" cy="7.2" r="1"/>
              <circle cx="14.5" cy="7.2" r="1"/>
            </svg>
          </button>

          {/* Light / Dark Quick Toggle */}
          <button
            type="button"
            className="nav-tool"
            id="theme-toggle"
            aria-label={currentTheme === 'white' ? 'Switch to dark theme' : 'Switch to light theme'}
            title={currentTheme === 'white' ? 'Dark theme' : 'Light theme'}
            onClick={toggleLightDark}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="4"/>
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>
            </svg>
          </button>

          {/* Sparks Effect On / Off Toggle */}
          <button
            type="button"
            className="nav-tool fx-btn"
            id="fx-toggle"
            aria-pressed={reduceFx}
            aria-label={reduceFx ? 'Turn on sparks effect' : 'Turn off sparks effect'}
            title={reduceFx ? 'Enable sparks & canvas animations' : 'Turn off sparks effect (lighter performance)'}
            onClick={toggleFx}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>
            </svg>
          </button>
        </div>

        <button
          type="button"
          className={`nav-toggle ${menuOpen ? 'open' : ''}`}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span /><span /><span />
        </button>
      </nav>

      {/* Theme Picker Dropdown */}
      <div id="theme-menu" ref={themeMenuRef} className={themeMenuOpen ? 'open' : ''} role="group" aria-label="Themes">
        <div className="tm-t">Pick a theme</div>
        {THEMES.map((t) => (
          <button
            key={t.id}
            type="button"
            className="tm-opt"
            data-t={t.id}
            aria-pressed={currentTheme === t.id}
            onClick={() => selectTheme(t.id)}
          >
            <span className="tm-sw" style={{ background: t.sw }} />
            <span className="tm-nm">
              {t.name}
              <small>{t.sub}</small>
            </span>
          </button>
        ))}
      </div>

      <div id="mobile-menu" className={`mobile-menu mono ${menuOpen ? 'open' : ''}`}>
        {navItems.map((item) => (
          <a key={item.label} href={item.href} onClick={(e) => handleHashClick(e, item.href)}>
            {item.label}
          </a>
        ))}
        {!isAdmin && (
          <NavLink to="/admin/login" onClick={closeMenu} className="nav-login-btn">
            Log In
          </NavLink>
        )}
        {isAdmin && (
          <>
            <button
              type="button"
              style={{ color: 'var(--red)', border: '1px solid rgba(var(--red-rgb), 0.4)', borderRadius: '6px', margin: '4px 0' }}
              onClick={() => { closeMenu(); setEventTimeModalOpen(true); }}
            >
              ⏱️ Change Event Time
            </button>
            <button type="button" onClick={() => { closeMenu(); logout(); navigate('/'); }}>
              Sign Out
            </button>
          </>
        )}
      </div>

      <AdminEventTimeModal
        open={eventTimeModalOpen}
        onClose={() => setEventTimeModalOpen(false)}
      />
    </>
  );
}

export default Header;
