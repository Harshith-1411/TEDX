import { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import './FooterEditor.css';

const emptyFooter = {
  instagram: '',
  linkedin: '',
  youtube: '',
};

const FIELD_META = {
  instagram: {
    label: 'Instagram URL',
    placeholder: 'https://instagram.com/...',
  },
  linkedin: {
    label: 'LinkedIn URL',
    placeholder: 'https://linkedin.com/...',
  },
  youtube: {
    label: 'YouTube URL',
    placeholder: 'https://youtube.com/...',
  },
};

function FooterEditor({
  open,
  initialFooter = null,
  focusField = null,
  saving = false,
  error = '',
  onClose,
  onSave,
}) {
  const titleId = useId();
  const [form, setForm] = useState(emptyFooter);
  const [localError, setLocalError] = useState('');

  const fields = focusField && FIELD_META[focusField]
    ? [focusField]
    : Object.keys(FIELD_META);

  useEffect(() => {
    if (!open) return;
    setForm({ ...emptyFooter, ...(initialFooter || {}) });
    setLocalError('');
  }, [open, initialFooter, focusField]);

  useEffect(() => {
    if (!open) return undefined;

    function onKeyDown(event) {
      if (event.key === 'Escape' && !saving) onClose();
    }

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, saving, onClose]);

  if (!open) return null;

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLocalError('');
    await onSave({
      instagram: form.instagram.trim(),
      linkedin: form.linkedin.trim(),
      youtube: form.youtube.trim(),
    });
  }

  const displayError = localError || error;
  const title = focusField && FIELD_META[focusField]
    ? `Edit ${FIELD_META[focusField].label.replace(' URL', '')}`
    : 'Edit footer links';

  return createPortal(
    <div
      className="footer-editor-backdrop"
      role="presentation"
      onClick={() => !saving && onClose()}
    >
      <div
        className="footer-editor"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="footer-editor-header">
          <h2 id={titleId}>{title}</h2>
          <button
            type="button"
            className="footer-editor-close"
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form className="footer-editor-form" onSubmit={handleSubmit}>
          {fields.map((name) => (
            <label key={name}>
              {FIELD_META[name].label}
              <input
                name={name}
                value={form[name]}
                onChange={updateField}
                placeholder={FIELD_META[name].placeholder}
                autoFocus={focusField === name}
              />
            </label>
          ))}

          <p className="footer-editor-hint">
            Leave blank to show the platform name as non-clickable text.
          </p>

          {displayError && (
            <p className="footer-editor-error" role="alert">
              {displayError}
            </p>
          )}

          <div className="footer-editor-actions">
            <button className="btn btn-ghost" type="button" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

export default FooterEditor;
