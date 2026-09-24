import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './NotFound.css';

function NotFound() {
  useEffect(() => {
    document.title = '404 | TEDx BIET';
  }, []);

  return (
    <section className="section not-found" aria-labelledby="not-found-heading">
      <div className="container not-found-inner">
        <p className="not-found-code">404</p>
        <h1 id="not-found-heading">
          Looks like this idea hasn&apos;t been found yet.
        </h1>
        <Link to="/" className="btn btn-ghost">
          ← Back to TEDx BIET
        </Link>
      </div>
    </section>
  );
}

export default NotFound;
