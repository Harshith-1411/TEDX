import { useEffect, useId, useState } from 'react';
import { readImageAsBase64 } from '../utils/readImageAsBase64';
import './MemberEditor.css';

const emptyMember = {
  name: '',
  slug: '',
  image: '',
  role: '',
  description: '',
  team: '',
  email: '',
  linkedin: '',
  instagram: '',
};

function MemberEditor({
  open,
  mode = 'edit',
  initialMember = null,
  saving = false,
  error = '',
  onClose,
  onSave,
}) {
  const titleId = useId();
  const [form, setForm] = useState(emptyMember);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (!open) return;
    setForm(initialMember ? { ...emptyMember, ...initialMember } : emptyMember);
    setLocalError('');
  }, [open, initialMember]);

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

  async function handleImage(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const image = await readImageAsBase64(file);
      setForm((current) => ({ ...current, image }));
      setLocalError('');
    } catch (readError) {
      setLocalError(readError.message || 'Unable to read image.');
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLocalError('');
    await onSave({
      name: form.name,
      slug: form.slug,
      image: form.image,
      role: form.role,
      description: form.description,
      team: form.team,
      email: form.email,
      linkedin: form.linkedin,
      instagram: form.instagram,
    });
  }

  const displayError = localError || error;

  return (
    <div className="member-editor-backdrop" role="presentation" onClick={() => !saving && onClose()}>
      <div
        className="member-editor"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="member-editor-header">
          <h2 id={titleId}>{mode === 'create' ? 'Add team member' : 'Edit details'}</h2>
          <button
            type="button"
            className="member-editor-close"
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form className="member-editor-form" onSubmit={handleSubmit}>
          <div className="member-editor-grid">
            <label>
              Name
              <input name="name" value={form.name} onChange={updateField} required />
            </label>
            <label>
              Slug
              <input
                name="slug"
                value={form.slug}
                onChange={updateField}
                required
                placeholder="first-last"
              />
            </label>
            <label>
              Role
              <input name="role" value={form.role} onChange={updateField} required />
            </label>
            <label>
              Team
              <input name="team" value={form.team} onChange={updateField} required />
            </label>
            <label>
              Email
              <input name="email" type="email" value={form.email} onChange={updateField} />
            </label>
            <label>
              LinkedIn
              <input name="linkedin" value={form.linkedin} onChange={updateField} />
            </label>
            <label className="member-editor-span">
              Instagram
              <input name="instagram" value={form.instagram} onChange={updateField} />
            </label>
            <label className="member-editor-span">
              Description
              <textarea
                name="description"
                value={form.description}
                onChange={updateField}
                rows="4"
                required
              />
            </label>
            <label className="member-editor-span">
              Photo
              <input type="file" accept="image/*" onChange={handleImage} />
            </label>
          </div>

          {form.image && (
            <img className="member-editor-preview" src={form.image} alt="" />
          )}

          {displayError && (
            <p className="member-editor-error" role="alert">
              {displayError}
            </p>
          )}

          <div className="member-editor-actions">
            <button className="btn btn-ghost" type="button" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? 'Saving…' : mode === 'create' ? 'Create member' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MemberEditor;
