import { useEffect, useRef, useState } from 'react';

export default function Loader() {
  const [pct, setPct] = useState(0);
  const [text, setText] = useState('ALIGNING THE FRACTURE — 0%');
  const [hidden, setHidden] = useState(() => {
    try {
      return sessionStorage.getItem('tedx_initial_loader_shown') === 'true';
    } catch {
      return false;
    }
  });
  const fillRef = useRef(null);

  useEffect(() => {
    if (hidden) return;

    try {
      sessionStorage.setItem('tedx_initial_loader_shown', 'true');
    } catch {}

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) { setHidden(true); return; }

    let current = 0;
    const interval = setInterval(() => {
      current = Math.min(100, current + Math.random() * 22 + 8);
      setPct(Math.floor(current));
      setText(`ALIGNING THE FRACTURE — ${Math.floor(current)}%`);
      if (current >= 100) {
        clearInterval(interval);
        setTimeout(() => setHidden(true), 380);
      }
    }, 180);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      setHidden(true);
    }, 3200);

    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [hidden]);

  if (hidden) return null;

  return (
    <div id="loader">
      <div className="loader-ring" />
      <div className="loader-text mono">{text}</div>
      <div className="loader-bar">
        <span className="loader-bar-fill" style={{ width: pct + '%' }} ref={fillRef} />
      </div>
    </div>
  );
}
