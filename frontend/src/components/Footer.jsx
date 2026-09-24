import { Link } from 'react-router-dom';
import './Footer.css';

function Footer({ siteSettings }) {
  return (
    <footer id="contact" className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          {siteSettings.footerLogo ? (
            <img
              src={siteSettings.footerLogo}
              alt="TEDx Bharat Institute of Engineering and Technology"
              className="footer-logo"
              width={280}
              height={64}
            />
          ) : (
            <p className="footer-logo">TED<span aria-hidden="true">x</span> BIET</p>
          )}
          <p className="footer-tagline">Ideas Worth Spreading</p>
          <p className="footer-institute">
            Bharat Institute of Engineering and Technology
          </p>
        </div>

        <div className="footer-col">
          <h2 className="footer-heading">Quick Links</h2>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <a href="/#about">About</a>
            </li>
            <li>
              <Link to="/team">Team</Link>
            </li>
            <li>
              <a href="/#contact">Contact</a>
            </li>
          </ul>
        </div>

        <div className="footer-col">
          <h2 className="footer-heading">Follow TEDx BIET</h2>
          <ul>
            <li>
              <span className="footer-placeholder">Instagram</span>
            </li>
            <li>
              <span className="footer-placeholder">LinkedIn</span>
            </li>
            <li>
              <span className="footer-placeholder">YouTube</span>
            </li>
          </ul>
          <p className="footer-note">Social links coming soon</p>
        </div>
      </div>

      <div className="container footer-bottom">
        <p>© 2026 TEDx BIET</p>
        <p className="footer-disclaimer">
          This independent TEDx event is operated under license from TED.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
