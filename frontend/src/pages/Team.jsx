import { useEffect } from 'react';
import { useAdminAuth } from '../context/AdminAuth';
import TeamGrid from '../components/TeamGrid';
import RevealOnScroll from '../components/RevealOnScroll';
import './Team.css';

function Team() {
  const { isAdmin } = useAdminAuth();

  useEffect(() => {
    document.title = isAdmin ? 'Team (Admin) | TEDx BIET' : 'Team | TEDx BIET';
  }, [isAdmin]);

  return (
    <section className="section team-page" aria-labelledby="team-page-heading">
      <div className="container">
        <RevealOnScroll>
          <span className="section-label">{isAdmin ? 'Admin · TEDx BIET' : 'TEDx BIET'}</span>
          <h1 id="team-page-heading" className="team-page-title">
            The Team
          </h1>
          <p className="team-page-intro">
            {isAdmin
              ? 'Edit member details, change the slug, or upload photos. Changes save to the database.'
              : 'Meet the people organizing TEDx BIET.'}
          </p>
        </RevealOnScroll>
        <RevealOnScroll delay={80}>
          <TeamGrid allowAdd />
        </RevealOnScroll>
      </div>
    </section>
  );
}

export default Team;
