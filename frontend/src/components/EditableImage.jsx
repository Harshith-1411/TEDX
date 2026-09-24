import { useRef, useState } from 'react';
import { readImageAsBase64 } from '../utils/readImageAsBase64';
import './EditableImage.css';

const PLACEHOLDER = '/team/placeholder-1.svg';

function EditableImage({
  src,
  alt,
  className = '',
  wrapClassName = '',
  canEdit = false,
  onUpload,
  uploading = false,
}) {
  const inputRef = useRef(null);
  const [localError, setLocalError] = useState('');

  async function handleChange(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !onUpload) return;

    setLocalError('');
    try {
      const dataUrl = await readImageAsBase64(file);
      await onUpload(dataUrl);
    } catch (error) {
      setLocalError(error.message || 'Unable to upload photo.');
    }
  }

  return (
    <div className={`editable-image ${wrapClassName}`.trim()}>
      <img
        src={src || PLACEHOLDER}
        alt={alt}
        className={className}
        loading="lazy"
      />
      {canEdit && (
        <>
          <button
            type="button"
            className="editable-image-upload"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              inputRef.current?.click();
            }}
            disabled={uploading}
          >
            {uploading ? 'Uploading…' : src ? 'Change photo' : 'Upload photo'}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="editable-image-input"
            onChange={handleChange}
            tabIndex={-1}
          />
          {localError && <p className="editable-image-error">{localError}</p>}
        </>
      )}
    </div>
  );
}

export default EditableImage;
