import { useCallback, useEffect, useRef, useState } from 'react';

export function useToast() {
  const [msg, setMsg] = useState('');
  const [show, setShow] = useState(false);
  const timerRef = useRef(null);

  const showToast = useCallback((message) => {
    setMsg(message);
    setShow(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setShow(false), 2800);
  }, []);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return { msg, show, showToast };
}

export function Toast({ msg, show }) {
  return (
    <div id="toast" className={`mono ${show ? 'show' : ''}`}>
      <span className="dot" />
      <span>{msg}</span>
    </div>
  );
}
