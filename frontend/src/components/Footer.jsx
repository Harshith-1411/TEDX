import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuth';
import SocialLinks, { footerSocialItems } from './SocialLinks';
import FooterEditor from './FooterEditor';
import { getFooter, updateAdminFooter, updateAdminLogo } from '../services/api';
import './Footer.css';

function Footer({ siteSettings = {}, onSiteSettingsChange }) {
  const { isAdmin, token, clearSession } = useAdminAuth();
  const [footer, setFooter] = useState({
    instagram: '',
    linkedin: '',
    youtube: '',
  });
  const [editorOpen, setEditorOpen] = useState(false);
  const [focusField, setFocusField] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editorError, setEditorError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const footerLogoInputRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    getFooter()
      .then((data) => {
        if (!cancelled) setFooter(data || {});
      })
      .catch(() => {
        if (!cancelled) setFooter({ instagram: '', linkedin: '', youtube: '' });
      });

    function onFooterUpdated(event) {
      if (event.detail) setFooter(event.detail);
    }

    window.addEventListener('tedx-footer-updated', onFooterUpdated);
    return () => {
      cancelled = true;
      window.removeEventListener('tedx-footer-updated', onFooterUpdated);
    };
  }, []);

  function openEdit(item) {
    setFocusField(item.key);
    setEditorError('');
    setEditorOpen(true);
  }

  async function handleFooterLogoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const updated = await updateAdminLogo(token, 'footer', file);
      if (typeof onSiteSettingsChange === 'function') {
        onSiteSettingsChange(updated);
      }
      setStatusMessage('Footer logo updated');
    } catch (err) {
      if (err.status === 401) {
        clearSession?.();
      } else {
        alert(err.data?.message || 'Failed to update footer logo.');
      }
    } finally {
      setUploadingLogo(false);
      if (footerLogoInputRef.current) footerLogoInputRef.current.value = '';
    }
  }

  async function saveFooter(form) {
    setSaving(true);
    setEditorError('');
    try {
      const saved = await updateAdminFooter(token, form);
      setFooter(saved);
      setEditorOpen(false);
      setFocusField(null);
      setStatusMessage('Link saved');
      window.dispatchEvent(new CustomEvent('tedx-footer-updated', { detail: saved }));
    } catch (requestError) {
      if (requestError.status === 401) {
        clearSession();
        return;
      }
      setEditorError(requestError.data?.message || 'Unable to save footer link.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <div className="footer-logo-row">
            {siteSettings.footerLogo ? (
              <img
                src={siteSettings.footerLogo}
                alt="TEDx Bharat Institute of Engineering and Technology"
                className="footer-logo"
                width={280}
                height={64}
              />
            ) : (
              <p className="footer-logo">TED<span aria-hidden="true">x</span> BIET</p>
            )}
            {isAdmin && (
              <div className="footer-logo-actions">
                <button
                  type="button"
                  className="social-link-edit logo-edit-btn footer-logo-edit-btn"
                  onClick={() => footerLogoInputRef.current?.click()}
                  disabled={uploadingLogo}
                  aria-label="Edit footer logo"
                >
                  {uploadingLogo ? 'Uploading...' : 'Edit'}
                </button>
                <input
                  ref={footerLogoInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleFooterLogoUpload}
                />
              </div>
            )}
          </div>
          <p className="footer-tagline">Ideas Worth Spreading</p>
          <p className="footer-institute">
            Bharat Institute of Engineering and Technology
          </p>
        </div>

        <div className="footer-col">
          <h2 className="footer-heading">Quick Links</h2>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <a href="/#faculty">Faculty</a>
            </li>
            <li>
              <Link to="/team">Team</Link>
            </li>
          </ul>
        </div>

        <div className="footer-col">
          <h2 className="footer-heading">Follow TEDx BIET</h2>
          <SocialLinks
            items={footerSocialItems(footer)}
            variant="footer"
            onEdit={isAdmin ? openEdit : undefined}
          />
          {isAdmin && statusMessage ? (
            <p className="footer-admin-status" role="status">
              {statusMessage}
            </p>
          ) : null}
        </div>
      </div>

      <div className="container footer-bottom">
        <p>© 2026 TEDx BIET</p>
        <p className="footer-disclaimer">
          This independent TEDx event is operated under license from TED.
        </p>
      </div>

      {isAdmin && (
        <FooterEditor
          open={editorOpen}
          initialFooter={footer}
          focusField={focusField}
          saving={saving}
          error={editorError}
          onClose={() => {
            if (saving) return;
            setEditorOpen(false);
            setFocusField(null);
          }}
          onSave={saveFooter}
        />
      )}
    </footer>
  );
}

export default Footer;
