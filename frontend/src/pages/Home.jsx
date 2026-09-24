import { useEffect } from 'react';
import Hero from '../components/Hero';
import About from '../components/About';
import ThemeSection from '../components/ThemeSection';
import TeamGrid from '../components/TeamGrid';
import RevealOnScroll from '../components/RevealOnScroll';
import './Home.css';

function Home() {
  useEffect(() => {
    document.title = 'TEDx BIET | Ideas Worth Spreading';
  }, []);

  return (
    <>
      <Hero />

      <RevealOnScroll as="div">
        <About />
      </RevealOnScroll>

      <RevealOnScroll as="div">
        <ThemeSection />
      </RevealOnScroll>

      <section
        id="team"
        className="section team-preview"
        aria-labelledby="team-heading"
      >
        <div className="container">
          <RevealOnScroll>
            <span className="section-label">Our Team</span>
            <h2 id="team-heading" className="team-preview-title">
              The Team Behind TEDx BIET
            </h2>
          </RevealOnScroll>
          <RevealOnScroll delay={80}>
            <TeamGrid limit={4} showViewAll />
          </RevealOnScroll>
        </div>
      </section>
    </>
  );
}

export default Home;
