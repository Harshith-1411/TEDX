import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './ImageCropper.css';

const MIN_CROP = 48;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Square crop UI over a selected image. Confirms with a cropped data URL.
 */
function ImageCropper({ src, open, onConfirm, onCancel }) {
  const titleId = useId();
  const frameRef = useRef(null);
  const imageRef = useRef(null);
  const dragRef = useRef(null);
  const [natural, setNatural] = useState({ width: 0, height: 0 });
  const [display, setDisplay] = useState({ width: 0, height: 0, left: 0, top: 0 });
  const [crop, setCrop] = useState({ x: 0, y: 0, size: 0 });

  const layoutImage = useCallback(() => {
    const frame = frameRef.current;
    const image = imageRef.current;
    if (!frame || !image || !image.naturalWidth) return;

    const frameRect = frame.getBoundingClientRect();
    if (frameRect.width < 1 || frameRect.height < 1) return;

    const maxW = frameRect.width;
    const maxH = frameRect.height;
    const ratio = image.naturalWidth / image.naturalHeight;

    let width = maxW;
    let height = width / ratio;
    if (height > maxH) {
      height = maxH;
      width = height * ratio;
    }

    const left = (maxW - width) / 2;
    const top = (maxH - height) / 2;
    setNatural({ width: image.naturalWidth, height: image.naturalHeight });
    setDisplay({ width, height, left, top });

    const size = Math.min(width, height) * 0.85;
    setCrop({
      x: left + (width - size) / 2,
      y: top + (height - size) / 2,
      size,
    });
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function onKeyDown(event) {
      if (event.key === 'Escape') onCancel();
    }

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', layoutImage);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', layoutImage);
    };
  }, [open, onCancel, layoutImage]);

  useEffect(() => {
    if (!open || !src) return undefined;

    setNatural({ width: 0, height: 0 });
    setDisplay({ width: 0, height: 0, left: 0, top: 0 });
    setCrop({ x: 0, y: 0, size: 0 });

    // Data URLs often finish loading before paint; re-layout after mount.
    let frameId = requestAnimationFrame(() => {
      frameId = requestAnimationFrame(() => {
        if (imageRef.current?.complete) layoutImage();
      });
    });

    return () => cancelAnimationFrame(frameId);
  }, [open, src, layoutImage]);

  function startDrag(event, mode) {
    event.preventDefault();
    event.stopPropagation();
    const point = 'touches' in event ? event.touches[0] : event;
    dragRef.current = {
      mode,
      startX: point.clientX,
      startY: point.clientY,
      origin: { ...crop },
    };
  }

  useEffect(() => {
    if (!open) return undefined;

    function onMove(event) {
      const drag = dragRef.current;
      if (!drag) return;
      if ('touches' in event) event.preventDefault();
      const point = 'touches' in event ? event.touches[0] : event;
      const dx = point.clientX - drag.startX;
      const dy = point.clientY - drag.startY;
      const { left, top, width, height } = display;

      if (drag.mode === 'move') {
        const size = drag.origin.size;
        setCrop({
          size,
          x: clamp(drag.origin.x + dx, left, left + width - size),
          y: clamp(drag.origin.y + dy, top, top + height - size),
        });
        return;
      }

      const nextSize = clamp(
        drag.origin.size + Math.max(dx, dy),
        MIN_CROP,
        Math.min(width, height)
      );
      setCrop({
        size: nextSize,
        x: clamp(drag.origin.x, left, left + width - nextSize),
        y: clamp(drag.origin.y, top, top + height - nextSize),
      });
    }

    function onUp() {
      dragRef.current = null;
    }

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [open, display]);

  function handleConfirm() {
    const image = imageRef.current;
    if (!image || !natural.width || !crop.size) return;

    const scaleX = natural.width / display.width;
    const scaleY = natural.height / display.height;
    const sx = (crop.x - display.left) * scaleX;
    const sy = (crop.y - display.top) * scaleY;
    const sw = crop.size * scaleX;
    const sh = crop.size * scaleY;

    const canvas = document.createElement('canvas');
    // 1200px gives a good balance: high enough for profile photo quality
    // without sending enormous files. Cloudinary stores this as the original
    // and can deliver smaller sizes via URL transformations if needed.
    const output = Math.min(1200, Math.round(sw));
    canvas.width = output;
    canvas.height = output;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, sx, sy, sw, sh, 0, 0, output, output);

    // Convert canvas to a File so we can upload it as multipart/form-data
    // instead of sending a large base64 string in the JSON body.
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
        onConfirm(file);
      },
      'image/jpeg',
      0.92
    );
  }

  if (!open || !src) return null;

  return createPortal(
    <div className="image-cropper-backdrop" role="presentation" onClick={onCancel}>
      <div
        className="image-cropper"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="image-cropper-header">
          <h2 id={titleId}>Crop photo</h2>
          <p className="image-cropper-hint">Drag to reposition. Use the corner to resize.</p>
        </div>

        <div className="image-cropper-frame" ref={frameRef}>
          <img
            ref={imageRef}
            src={src}
            alt=""
            className="image-cropper-image"
            style={
              display.width
                ? {
                    width: display.width,
                    height: display.height,
                    left: display.left,
                    top: display.top,
                  }
                : undefined
            }
            onLoad={layoutImage}
            draggable={false}
          />
          {crop.size > 0 && (
            <div
              className="image-cropper-box"
              style={{
                left: crop.x,
                top: crop.y,
                width: crop.size,
                height: crop.size,
              }}
              onMouseDown={(event) => startDrag(event, 'move')}
              onTouchStart={(event) => startDrag(event, 'move')}
            >
              <span
                className="image-cropper-handle"
                onMouseDown={(event) => startDrag(event, 'resize')}
                onTouchStart={(event) => startDrag(event, 'resize')}
              />
            </div>
          )}
        </div>

        <div className="image-cropper-actions">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={handleConfirm}>
            Use cropped photo
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default ImageCropper;
