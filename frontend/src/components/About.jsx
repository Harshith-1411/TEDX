import './About.css';

function About() {
  return (
    <section id="about" className="section about" aria-labelledby="about-heading">
      <div className="container about-grid">
        <div className="about-intro">
          <span className="section-label">About TEDx BIET</span>
          <h2 id="about-heading">Ideas. Stories. Perspectives.</h2>
        </div>
        <div className="about-copy">
          <p>
            TEDx BIET is a locally organized TEDx event that brings together
            ideas and perspectives from our community at Bharat Institute of
            Engineering and Technology.
          </p>
          <p>
            In the spirit of ideas worth spreading, TEDx events are organized
            independently under a free license granted by TED. This is temporary
            content and will be replaced with official event information later.
          </p>
        </div>
      </div>
    </section>
  );
}

export default About;
