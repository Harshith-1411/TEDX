import { useRef, useState } from 'react';
import ImageCropper from './ImageCropper';
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
  // cropSrc is a temporary object URL used to display the image in the cropper
  const [cropSrc, setCropSrc] = useState('');

  function handleChange(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !onUpload) return;

    if (!file.type.startsWith('image/')) {
      setLocalError('Please choose an image file.');
      return;
    }

    setLocalError('');
    // Create a temporary blob URL for the cropper preview
    const objectUrl = URL.createObjectURL(file);
    setCropSrc(objectUrl);
  }

  async function handleCropConfirm(croppedFile) {
    // Release the temporary preview URL
    URL.revokeObjectURL(cropSrc);
    setCropSrc('');
    try {
      await onUpload(croppedFile);
    } catch (error) {
      setLocalError(error.message || 'Unable to upload photo.');
    }
  }

  function handleCropCancel() {
    URL.revokeObjectURL(cropSrc);
    setCropSrc('');
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
          <ImageCropper
            open={Boolean(cropSrc)}
            src={cropSrc}
            onCancel={handleCropCancel}
            onConfirm={handleCropConfirm}
          />
        </>
      )}
    </div>
  );
}

export default EditableImage;
