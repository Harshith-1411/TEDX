import { Component, cloneElement, isValidElement, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './PhotoCursor.css';

/*
 * PhotoCursor — spring-follow card (port of Cursor attachToParent)
 * While the pointer is over targetRef or wrapped children, the native cursor is hidden
 * and a follower card springs towards it. It reveals with height 0 -> auto, opacity 0 -> 1,
 * scale 0.3 -> 1 (spring, bounce 0.01) and reverses smoothly on exit.
 */

const STIFFNESS = 420;
const BOUNCE = 0.01;
const DAMPING = 2 * Math.sqrt(STIFFNESS) * (1 - BOUNCE);
const OFFSET = 16;

let activeBodyCursorCount = 0;

function activateBodyCursor() {
  activeBodyCursorCount++;
  document.body.classList.add('photo-cursor-active');
}

function deactivateBodyCursor() {
  activeBodyCursorCount = Math.max(0, activeBodyCursorCount - 1);
  if (activeBodyCursorCount === 0) {
    document.body.classList.remove('photo-cursor-active');
  }
}

function getInitials(name) {
  return String(name || '')
    .split(/\s+/)
    .filter((w) => w && !/\.$/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function PhotoCursorInner({ targetRef, name, sub, image, disabled = false }) {
  const [enabled, setEnabled] = useState(false);
  const [open, setOpen] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const [hasEverOpened, setHasEverOpened] = useState(false);
  const elRef = useRef(null);
  const s = useRef({
    x: 0,
    y: 0,
    tx: 0,
    ty: 0,
    vx: 0,
    vy: 0,
    raf: 0,
    last: 0,
    placed: false,
    open: false,
    bodyActive: false,
  });

  useEffect(() => {
    setImgFailed(false);
  }, [image]);

  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setEnabled(fine.matches && !reduce.matches && !disabled);
    update();
    fine.addEventListener?.('change', update);
    reduce.addEventListener?.('change', update);
    return () => {
      fine.removeEventListener?.('change', update);
      reduce.removeEventListener?.('change', update);
    };
  }, [disabled]);

  useEffect(() => {
    const target = targetRef?.current || (targetRef instanceof HTMLElement ? targetRef : null);
    if (!enabled || !target) return undefined;
    const st = s.current;

    const render = () => {
      const el = elRef.current;
      if (!el) return;
      const w = el.offsetWidth || 172;
      let x = st.x + OFFSET;
      let y = st.y + OFFSET;
      if (x + w > window.innerWidth - 8) x = st.x - OFFSET - w;
      const h = el.offsetHeight || 220;
      if (y + h > window.innerHeight - 8) y = Math.max(8, window.innerHeight - 8 - h);
      el.style.transform = `translate3d(${st.x}px, ${st.y}px, 0)`;
      el.style.setProperty('--pc-dx', `${x - st.x}px`);
      el.style.setProperty('--pc-dy', `${y - st.y}px`);
    };

    const tick = (now) => {
      const dt = Math.min(0.032, (now - st.last) / 1000 || 0.016);
      st.last = now;
      const ax = -STIFFNESS * (st.x - st.tx) - DAMPING * st.vx;
      const ay = -STIFFNESS * (st.y - st.ty) - DAMPING * st.vy;
      st.vx += ax * dt;
      st.vy += ay * dt;
      st.x += st.vx * dt;
      st.y += st.vy * dt;
      render();

      const settled =
        Math.abs(st.x - st.tx) < 0.1 &&
        Math.abs(st.y - st.ty) < 0.1 &&
        Math.abs(st.vx) < 0.1 &&
        Math.abs(st.vy) < 0.1;

      st.raf = settled && !st.open ? 0 : requestAnimationFrame(tick);
    };

    const start = () => {
      if (!st.raf) {
        st.last = performance.now();
        st.raf = requestAnimationFrame(tick);
      }
    };

    const ignored = (e) =>
      Boolean(e.target.closest?.('button, input, textarea, select, [data-photo-cursor-ignore]'));

    const show = (e) => {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      st.tx = e.clientX;
      st.ty = e.clientY;
      if (!st.placed) {
        st.x = e.clientX;
        st.y = e.clientY;
        st.vx = 0;
        st.vy = 0;
        st.placed = true;
      }
      st.open = true;
      setHasEverOpened(true);
      setOpen(true);
      if (!st.bodyActive) {
        st.bodyActive = true;
        activateBodyCursor();
      }
      render();
      start();
    };

    const hide = () => {
      st.open = false;
      st.placed = false;
      setOpen(false);
      if (st.bodyActive) {
        st.bodyActive = false;
        deactivateBodyCursor();
      }
    };

    const onEnter = (e) => {
      if (!ignored(e)) show(e);
    };

    const onMove = (e) => {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      if (ignored(e)) {
        if (st.open) hide();
        return;
      }
      if (!st.open) {
        show(e);
        return;
      }
      st.tx = e.clientX;
      st.ty = e.clientY;
      start();
    };

    target.addEventListener('pointerenter', onEnter);
    target.addEventListener('pointermove', onMove);
    target.addEventListener('pointerleave', hide);
    target.classList.add('has-photo-cursor');

    return () => {
      target.removeEventListener('pointerenter', onEnter);
      target.removeEventListener('pointermove', onMove);
      target.removeEventListener('pointerleave', hide);
      target.classList.remove('has-photo-cursor');
      if (st.raf) {
        cancelAnimationFrame(st.raf);
        st.raf = 0;
      }
      st.placed = false;
      if (st.bodyActive) {
        st.bodyActive = false;
        deactivateBodyCursor();
      }
    };
  }, [enabled, targetRef]);

  if (!enabled || !hasEverOpened) return null;

  return createPortal(
    <div className="photo-cursor" ref={elRef} aria-hidden="true">
      <span className="photo-cursor-pin" data-open={open} />
      <div className="photo-cursor-reveal" data-open={open}>
        <div className="photo-cursor-clip">
          <div className="photo-cursor-card">
            <div className="photo-cursor-photo">
              {image && !imgFailed ? (
                <img
                  src={image}
                  alt={name || ''}
                  draggable="false"
                  onError={() => setImgFailed(true)}
                />
              ) : (
                <span>{getInitials(name)}</span>
              )}
            </div>
            <div className="photo-cursor-meta">
              <strong>{name}</strong>
              {sub && <em className="mono">{sub}</em>}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// Decoration boundary: if cursor motion ever errors, it won't crash the UI.
class PhotoCursorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(err) {
    console.warn('[PhotoCursor] disabled:', err);
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function PhotoCursor({
  children,
  targetRef,
  name,
  sub,
  image,
  disabled = false,
  as: Tag = 'div',
  className,
  style,
  ...rest
}) {
  const localRef = useRef(null);
  const resolvedRef = targetRef || localRef;

  if (children && isValidElement(children)) {
    const childRef = children.props?.ref || children.ref;
    const mergedRef = (node) => {
      localRef.current = node;
      if (typeof childRef === 'function') {
        childRef(node);
      } else if (childRef && typeof childRef === 'object') {
        childRef.current = node;
      }
    };

    return (
      <>
        {cloneElement(children, { ref: mergedRef })}
        <PhotoCursorBoundary>
          <PhotoCursorInner
            targetRef={localRef}
            name={name}
            sub={sub}
            image={image}
            disabled={disabled}
          />
        </PhotoCursorBoundary>
      </>
    );
  }

  if (children) {
    return (
      <Tag
        ref={localRef}
        className={`photo-cursor-host ${className || ''}`}
        style={style}
        {...rest}
      >
        {children}
        <PhotoCursorBoundary>
          <PhotoCursorInner
            targetRef={localRef}
            name={name}
            sub={sub}
            image={image}
            disabled={disabled}
          />
        </PhotoCursorBoundary>
      </Tag>
    );
  }

  return (
    <PhotoCursorBoundary>
      <PhotoCursorInner
        targetRef={resolvedRef}
        name={name}
        sub={sub}
        image={image}
        disabled={disabled}
      />
    </PhotoCursorBoundary>
  );
}
