import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './NotFound.css';

function NotFound() {
  useEffect(() => { document.title = '404 | TEDx BIET'; }, []);
  return (
    <div className="not-found-page">
      <div className="glass-card not-found-card reveal-element active">
        <div className="eyebrow-tag mono">404 — Not found</div>
        <h1 className="not-found-title">Glass<br /><span>Shattered.</span></h1>
        <p className="not-found-desc">The page you were looking for has cracked and fallen away. Let's get you back on solid ground.</p>
        <Link to="/" className="btn btn-fill" style={{marginTop:"2rem"}}>Back to Origin</Link>
      </div>
    </div>
  );
}

export default NotFound;
