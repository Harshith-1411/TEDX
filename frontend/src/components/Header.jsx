import { useEffect, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuth';
import { updateAdminLogo } from '../services/api';
import './Header.css';

function Header({ siteSettings = {}, onSiteSettingsChange }) {
  const { isAdmin, token, clearSession, logout } = useAdminAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const updated = await updateAdminLogo(token, 'header', file);
      if (typeof onSiteSettingsChange === 'function') {
        onSiteSettingsChange(updated);
      }
    } catch (err) {
      if (err.status === 401) {
        clearSession?.();
      } else {
        alert(err.data?.message || 'Failed to update header logo.');
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const navLinks = [
    { to: '/', label: 'Home', end: true },
    { to: '/#faculty', label: 'Faculty', hash: true },
    { to: '/team', label: 'Team' },
    ...(!isAdmin ? [{ to: '/admin/login', label: 'Admin Login' }] : []),
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
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

  return (
    <header className={`site-header ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="container header-inner">
        <div className="header-brand-wrap">
          <Link to="/" className="site-logo" onClick={closeMenu}>
            {siteSettings.headerLogo ? (
              <img
                src={siteSettings.headerLogo}
                alt="TEDx Bharat Institute of Engineering and Technology"
                className="site-logo-img"
                width={280}
                height={64}
              />
            ) : (
              <span className="site-logo-img">TED<span aria-hidden="true">x</span> BIET</span>
            )}
          </Link>
          {isAdmin && (
            <div className="header-logo-actions">
              <button
                type="button"
                className="social-link-edit logo-edit-btn header-logo-edit-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                aria-label="Edit header logo"
              >
                {uploading ? 'Uploading...' : 'Edit'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleLogoUpload}
              />
            </div>
          )}
        </div>

        <nav className="desktop-nav" aria-label="Primary">
          {navLinks.map((link) =>
            link.hash ? (
              <a
                key={link.label}
                href={link.to}
                className="nav-link"
                onClick={(e) => handleHashClick(e, link.to.replace('/', ''))}
              >
                {link.label}
              </a>
            ) : (
              <NavLink
                key={link.label}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `nav-link${isActive ? ' is-active' : ''}`
                }
                onClick={closeMenu}
              >
                {link.label}
              </NavLink>
            )
          )}
          {isAdmin && (
            <button type="button" className="nav-link nav-sign-out" onClick={() => logout()}>
              Sign out
            </button>
          )}
        </nav>

        <button
          type="button"
          className={`menu-toggle ${menuOpen ? 'is-open' : ''}`}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      <nav
        id="mobile-nav"
        className={`mobile-nav ${menuOpen ? 'is-open' : ''}`}
        aria-label="Mobile"
        hidden={!menuOpen}
      >
        {navLinks.map((link) =>
          link.hash ? (
            <a
              key={link.label}
              href={link.to}
              className="mobile-nav-link"
              onClick={(e) => handleHashClick(e, link.to.replace('/', ''))}
            >
              {link.label}
            </a>
          ) : (
            <NavLink
              key={link.label}
              to={link.to}
              end={link.end}
              className="mobile-nav-link"
              onClick={closeMenu}
            >
              {link.label}
            </NavLink>
          )
        )}
        {isAdmin && (
          <button
            type="button"
            className="mobile-nav-link"
            onClick={() => {
              closeMenu();
              logout();
            }}
          >
            Sign out
          </button>
        )}
      </nav>
    </header>
  );
}

export default Header;
