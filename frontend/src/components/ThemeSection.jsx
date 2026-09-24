import './ThemeSection.css';

function ThemeSection() {
  return (
    <section className="section theme" aria-labelledby="theme-heading">
      <div className="container theme-inner">
        <span className="section-label theme-label">Event Theme</span>
        <h2 id="theme-heading" className="theme-title">
          Ideas in Motion
        </h2>
        <p className="theme-desc">
          A temporary theme exploring how ideas move people, communities, and
          conversations forward. Official theme details will be announced soon.
        </p>
        <div className="theme-accent" aria-hidden="true" />
      </div>
    </section>
  );
}

export default ThemeSection;
