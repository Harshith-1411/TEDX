import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const SECTIONS = [
  { id: 'hero', label: 'ORIGIN' },
  { id: 'about', label: '01 \u00B7 ABOUT' },
  { id: 'why', label: '02 \u00B7 WHY' },
  { id: 'countdown', label: '03 \u00B7 CLOCK' },
  { id: 'speakers', label: '04 \u00B7 SPEAKERS' },
  { id: 'team', label: '05 \u00B7 TEAM' },
  { id: 'spark', label: '06 \u00B7 SPARK' },
  { id: 'faq', label: '07 \u00B7 FAQ' },
  { id: 'details', label: '08 \u00B7 DETAILS' },
  { id: 'contact', label: '09 \u00B7 CONTACT' },
];

export default function SectionNav() {
  const [activeId, setActiveId] = useState('hero');
  const location = useLocation();

  // Only display on homepage
  const isHome = location.pathname === '/';

  useEffect(() => {
    if (!isHome) return;

    const elements = SECTIONS.map(s => document.getElementById(s.id)).filter(Boolean);
    if (!elements.length) return;

    // Use IntersectionObserver with mid-screen threshold
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveId(entry.target.id);
        }
      });
    }, {
      rootMargin: '-30% 0px -50% 0px',
      threshold: [0, 0.25],
    });

    elements.forEach(el => observer.observe(el));

    // Also support scroll listener for smooth fallback
    const onScroll = () => {
      const scrollPos = window.scrollY + window.innerHeight * 0.4;
      for (let i = elements.length - 1; i >= 0; i--) {
        const el = elements[i];
        if (el.offsetTop <= scrollPos) {
          setActiveId(el.id);
          break;
        }
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, [isHome]);

  if (!isHome) return null;

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="rail mono" id="rail" role="navigation" aria-label="Section navigation">
      {SECTIONS.map((sec) => (
        <a
          key={sec.id}
          href={`#${sec.id}`}
          className={`rail-item ${activeId === sec.id ? 'active' : ''}`}
          data-target={sec.id}
          onClick={(e) => {
            e.preventDefault();
            scrollTo(sec.id);
          }}
          aria-label={sec.label}
        >
          <span className="rail-label">{sec.label}</span>
          <span className="rail-dot" />
        </a>
      ))}
    </div>
  );
}
