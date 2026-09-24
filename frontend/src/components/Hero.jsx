import './Hero.css';

function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-heading">
      <div className="hero-media" aria-hidden="true">
        <div className="hero-overlay" />
      </div>

      <div className="container hero-content">
        <p className="hero-brand fade-up">
          <span className="hero-brand-ted">TED</span>
          <span className="hero-brand-x">x</span>
          <span className="hero-brand-event"> BIET</span>
        </p>
        <h1 id="hero-heading" className="hero-title fade-up fade-up-delay-1">
          Ideas Worth Spreading
        </h1>
        <p className="hero-sub fade-up fade-up-delay-2">
          Bharat Institute of Engineering and Technology
        </p>
        <a href="#about" className="btn btn-primary fade-up fade-up-delay-3">
          Discover TEDx BIET
        </a>
      </div>
    </section>
  );
}

export default Hero;
