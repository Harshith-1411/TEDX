import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './ImageCropper.css';

const MIN_CROP = 48;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Crop UI over a selected image. Supports square (1:1) and vertical portrait (e.g. 3:4) ratios.
 */
function ImageCropper({ src, open, onConfirm, onCancel, aspectRatio = 1 }) {
  const titleId = useId();
  const frameRef = useRef(null);
  const imageRef = useRef(null);
  const dragRef = useRef(null);
  const [natural, setNatural] = useState({ width: 0, height: 0 });
  const [display, setDisplay] = useState({ width: 0, height: 0, left: 0, top: 0 });
  const [crop, setCrop] = useState({ x: 0, y: 0, width: 0, height: 0 });

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

    let cropW = width * 0.85;
    let cropH = cropW / aspectRatio;
    if (cropH > height * 0.85) {
      cropH = height * 0.85;
      cropW = cropH * aspectRatio;
    }

    setCrop({
      x: left + (width - cropW) / 2,
      y: top + (height - cropH) / 2,
      width: cropW,
      height: cropH,
    });
  }, [aspectRatio]);

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
    setCrop({ x: 0, y: 0, width: 0, height: 0 });

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
        const { width: cropW, height: cropH } = drag.origin;
        setCrop({
          width: cropW,
          height: cropH,
          x: clamp(drag.origin.x + dx, left, left + width - cropW),
          y: clamp(drag.origin.y + dy, top, top + height - cropH),
        });
        return;
      }

      const delta = Math.max(dx, dy * aspectRatio);
      let nextW = clamp(
        drag.origin.width + delta,
        MIN_CROP * Math.max(0.6, aspectRatio),
        width
      );
      let nextH = nextW / aspectRatio;
      if (nextH > height) {
        nextH = height;
        nextW = nextH * aspectRatio;
      }
      if (drag.origin.x + nextW > left + width) {
        nextW = left + width - drag.origin.x;
        nextH = nextW / aspectRatio;
      }
      if (drag.origin.y + nextH > top + height) {
        nextH = top + height - drag.origin.y;
        nextW = nextH * aspectRatio;
      }

      setCrop({
        width: nextW,
        height: nextH,
        x: drag.origin.x,
        y: drag.origin.y,
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
  }, [open, display, aspectRatio]);

  function handleConfirm() {
    const image = imageRef.current;
    if (!image || !natural.width || !crop.width || !crop.height) return;

    const scaleX = natural.width / display.width;
    const scaleY = natural.height / display.height;
    const sx = (crop.x - display.left) * scaleX;
    const sy = (crop.y - display.top) * scaleY;
    const sw = crop.width * scaleX;
    const sh = crop.height * scaleY;

    const canvas = document.createElement('canvas');
    const outputW = Math.min(2048, Math.max(600, Math.round(sw)));
    const outputH = Math.round(outputW / aspectRatio);
    canvas.width = outputW;
    canvas.height = outputH;
    const ctx = canvas.getContext('2d');

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(image, sx, sy, sw, sh, 0, 0, outputW, outputH);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
        onConfirm(file);
      },
      'image/jpeg',
      0.96
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
          <span className="image-cropper-tag">TEDx &middot; Avatar Cropper</span>
          <h2 id={titleId}>Adjust &amp; Crop Photo</h2>
          <p className="image-cropper-hint">Drag the frame to position. Pull the corner handle to scale.</p>
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
          {crop.width > 0 && crop.height > 0 && (
            <div
              className="image-cropper-box"
              style={{
                left: crop.x,
                top: crop.y,
                width: crop.width,
                height: crop.height,
              }}
              onMouseDown={(event) => startDrag(event, 'move')}
              onTouchStart={(event) => startDrag(event, 'move')}
            >
              <span
                className="image-cropper-handle"
                title="Drag to resize"
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
            Apply Cropped Photo
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default ImageCropper;
