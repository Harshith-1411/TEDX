import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import ImageCropper from './ImageCropper';
import './SpeakerEditor.css';

const emptySpeaker = {
  name: '',
  slug: '',
  role: 'Inauguration guest',
  note: '',
  topic: '',
  order: 1,
  image: '',
};

export default function SpeakerEditor({
  open,
  mode = 'create',
  initialSpeaker = null,
  saving = false,
  error = '',
  onClose,
  onSave,
}) {
  const titleId = useId();
  const fileInputRef = useRef(null);
  const [form, setForm] = useState(emptySpeaker);
  const [localError, setLocalError] = useState('');
  const [cropSrc, setCropSrc] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    if (!open) return;
    setForm(initialSpeaker ? { ...emptySpeaker, ...initialSpeaker } : emptySpeaker);
    setLocalError('');
    setCropSrc('');
    setImageFile(null);
    setPreviewUrl('');
  }, [open, initialSpeaker]);

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
    function onKeyDown(e) {
      if (e.key === 'Escape' && !saving && !cropSrc) onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, saving, onClose, cropSrc]);

  if (!open) return null;

  function updateField(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setLocalError('Please choose a valid image file.');
      return;
    }

    setLocalError('');
    const objectUrl = URL.createObjectURL(file);
    setCropSrc(objectUrl);
  }

  function handleCropConfirm(croppedFile) {
    URL.revokeObjectURL(cropSrc);
    setCropSrc('');
    setImageFile(croppedFile);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(croppedFile));
  }

  function handleCropCancel() {
    URL.revokeObjectURL(cropSrc);
    setCropSrc('');
  }

  function handleRemovePhoto() {
    setImageFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl('');
    setForm((prev) => ({ ...prev, image: '' }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      setLocalError('Speaker name is required.');
      return;
    }

    const payload = {
      ...form,
      name: form.name.trim(),
      role: form.role.trim() || 'Inauguration guest',
      note: form.note.trim(),
      topic: form.topic.trim(),
      order: Number(form.order) || 1,
    };

    if (imageFile) {
      payload.image = imageFile;
    }

    onSave(payload);
  }

  const activePhoto = previewUrl || form.image;
  const isCreate = mode === 'create';

  return createPortal(
    <div className="speaker-modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="speaker-modal-dialog glass-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="speaker-modal-header">
          <div>
            <div className="eyebrow-tag mono">Admin Speaker Panel</div>
            <h2 id={titleId} className="speaker-modal-title">
              {isCreate ? '+ Add New Speaker' : 'Edit Speaker Details'}
            </h2>
          </div>
          <button
            type="button"
            className="speaker-modal-close"
            onClick={onClose}
            aria-label="Close dialog"
            disabled={saving}
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="speaker-modal-form">
          {(error || localError) && (
            <div className="speaker-modal-alert" role="alert">
              {error || localError}
            </div>
          )}

          <div className="speaker-modal-body">
            {/* Photo Section */}
            <div className="speaker-photo-row">
              <div className="speaker-photo-preview-wrap">
                {activePhoto ? (
                  <img src={activePhoto} alt="Speaker Preview" className="speaker-photo-preview" />
                ) : (
                  <div className="speaker-photo-placeholder mono">
                    <span>3:4</span>
                    <span>No Photo</span>
                  </div>
                )}
              </div>
              <div className="speaker-photo-controls">
                <label className="mono speaker-field-label">Speaker Portrait (3:4)</label>
                <div className="speaker-photo-btns">
                  <button
                    type="button"
                    className="btn btn-line btn-sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={saving}
                  >
                    {activePhoto ? '📷 Change Photo' : '📷 Upload Photo'}
                  </button>
                  {Boolean(activePhoto) && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm btn-del"
                      onClick={handleRemovePhoto}
                      disabled={saving}
                    >
                      Remove Photo
                    </button>
                  )}
                </div>
                <p className="speaker-photo-tip">
                  Vertical portraits look best. We provide a built-in crop tool.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleFileSelect}
                />
              </div>
            </div>

            {/* Form Fields */}
            <div className="speaker-form-grid">
              <div className="speaker-field">
                <label className="speaker-field-label mono">
                  Speaker Full Name <span className="req">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  className="speaker-input"
                  placeholder="e.g. Ajay Kumar"
                  value={form.name}
                  onChange={updateField}
                  required
                  disabled={saving}
                />
              </div>

              <div className="speaker-field">
                <label className="speaker-field-label mono">Role / Designation</label>
                <input
                  type="text"
                  name="role"
                  className="speaker-input"
                  placeholder="e.g. Inauguration guest, Keynote Speaker"
                  value={form.role}
                  onChange={updateField}
                  disabled={saving}
                />
              </div>

              <div className="speaker-field">
                <label className="speaker-field-label mono">Note / Affiliation / Company</label>
                <input
                  type="text"
                  name="note"
                  className="speaker-input"
                  placeholder="e.g. Soulfulvolgs, HR, Founder"
                  value={form.note}
                  onChange={updateField}
                  disabled={saving}
                />
              </div>

              <div className="speaker-field">
                <label className="speaker-field-label mono">Display Order</label>
                <input
                  type="number"
                  name="order"
                  className="speaker-input"
                  min="1"
                  max="99"
                  value={form.order}
                  onChange={updateField}
                  disabled={saving}
                />
              </div>

              <div className="speaker-field full-width">
                <label className="speaker-field-label mono">The Idea / Talk Topic</label>
                <textarea
                  name="topic"
                  className="speaker-input speaker-textarea"
                  rows={3}
                  placeholder="e.g. Creative Storytelling & Digital Journey"
                  value={form.topic}
                  onChange={updateField}
                  disabled={saving}
                />
              </div>
            </div>
          </div>

          <div className="speaker-modal-footer">
            <button
              type="button"
              className="btn btn-line"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-fill"
              disabled={saving}
            >
              {saving ? 'Saving...' : isCreate ? 'Add Speaker' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      <ImageCropper
        open={Boolean(cropSrc)}
        src={cropSrc}
        aspectRatio={3 / 4}
        onCancel={handleCropCancel}
        onConfirm={handleCropConfirm}
      />
    </div>,
    document.body
  );
}
