import { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import ImageCropper from './ImageCropper';
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
  category = 'team',
  initialMember = null,
  saving = false,
  error = '',
  onClose,
  onSave,
}) {
  const titleId = useId();
  const [form, setForm] = useState(emptyMember);
  const [localError, setLocalError] = useState('');
  // cropSrc is a temporary blob URL used only for the cropper preview
  const [cropSrc, setCropSrc] = useState('');
  // imageFile holds the File selected by the admin (File object, not base64)
  const [imageFile, setImageFile] = useState(null);
  // previewUrl is a local blob URL shown as a preview thumbnail
  const [previewUrl, setPreviewUrl] = useState('');

  const isFaculty = category === 'faculty';

  useEffect(() => {
    if (!open) return;
    setForm(initialMember ? { ...emptyMember, ...initialMember } : emptyMember);
    setLocalError('');
    setCropSrc('');
    setImageFile(null);
    setPreviewUrl('');
  }, [open, initialMember]);

  // Clean up blob URLs when editor closes or preview changes
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!open) return undefined;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    function onKeyDown(event) {
      if (event.key === 'Escape' && !saving && !cropSrc) onClose();
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, saving, onClose, cropSrc]);

  if (!open) return null;

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleImage(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setLocalError('Please choose an image file.');
      return;
    }

    setLocalError('');
    // Blob URL just for the cropper to render from
    const objectUrl = URL.createObjectURL(file);
    setCropSrc(objectUrl);
  }

  function handleCropConfirm(croppedFile) {
    // Release the temporary cropper URL
    URL.revokeObjectURL(cropSrc);
    setCropSrc('');

    // Store the cropped File; create a preview blob URL for the thumbnail
    setImageFile(croppedFile);
    const preview = URL.createObjectURL(croppedFile);
    setPreviewUrl((old) => {
      if (old) URL.revokeObjectURL(old);
      return preview;
    });
    setLocalError('');
  }

  function handleCropCancel() {
    URL.revokeObjectURL(cropSrc);
    setCropSrc('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLocalError('');

    const payload = {
      name: form.name,
      slug: form.slug,
      // If a new file was selected, send the File object.
      // Otherwise preserve the existing image string (Cloudinary URL or empty).
      image: imageFile || form.image || '',
      role: form.role,
      description: form.description,
      email: form.email,
      linkedin: form.linkedin,
      instagram: form.instagram,
    };

    if (!isFaculty) {
      payload.team = form.team;
    }

    await onSave(payload);
  }

  const displayError = localError || error;
  const title =
    mode === 'create'
      ? isFaculty
        ? 'Add faculty coordinator'
        : 'Add team member'
      : 'Edit details';

  // Show new preview (blob URL) if available, otherwise fall back to the stored Cloudinary URL
  const thumbnailSrc = previewUrl || form.image;

  return createPortal(
    <>
      <div
        className="member-editor-backdrop"
        role="presentation"
        onClick={() => !saving && !cropSrc && onClose()}
      >
        <div
          className="member-editor"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="member-editor-header">
            <h2 id={titleId}>{title}</h2>
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
              {!isFaculty && (
                <label>
                  Team
                  <input name="team" value={form.team} onChange={updateField} required />
                </label>
              )}
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

            {thumbnailSrc && (
              <img className="member-editor-preview" src={thumbnailSrc} alt="" />
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
                {saving
                  ? 'Saving…'
                  : mode === 'create'
                    ? isFaculty
                      ? 'Create coordinator'
                      : 'Create member'
                    : 'Save changes'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <ImageCropper
        open={Boolean(cropSrc)}
        src={cropSrc}
        onCancel={handleCropCancel}
        onConfirm={handleCropConfirm}
      />
    </>,
    document.body
  );
}

export default MemberEditor;
