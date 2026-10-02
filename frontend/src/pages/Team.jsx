import { useEffect, useState } from 'react';
import { useAdminAuth } from '../context/AdminAuth';
import TeamGrid from '../components/TeamGrid';
import AdminEventTimeModal from '../components/AdminEventTimeModal';
import './Team.css';

function Team() {
  const { isAdmin } = useAdminAuth();
  const [timeModalOpen, setTimeModalOpen] = useState(false);

  useEffect(() => { document.title = 'Team | TEDx BIET'; }, []);
  return (
    <div className="team-page">
      <div className="team-hero">
        <div className="eyebrow-tag mono" style={{marginBottom:"16px"}}>The organizing team</div>
        <h1 className="team-hero-title">TEAM &amp; <span style={{color:"var(--red)"}}>x</span> ROLES</h1>
        <p className="team-hero-sub">Every department, every lead, and every responsibility behind TEDxBIET 2026.</p>
      </div>
      <div className="team-content">
        {isAdmin && (
          <div className="glass-card" style={{ maxWidth: "1120px", marginBottom: "2.4rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <div className="eyebrow-tag mono" style={{ marginBottom: "6px" }}>Admin Mode &middot; Event Schedule</div>
              <h3 style={{ margin: 0, fontSize: "1.2rem", color: "#fff" }}>Event Date &amp; Countdown Target</h3>
              <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--grey)" }}>
                Configured in MongoDB. Drives the live fracture clock across the entire site.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-fill mono"
              style={{ fontSize: "11.5px", padding: "8px 18px" }}
              onClick={() => setTimeModalOpen(true)}
            >
              ⏱️ Change Event Time
            </button>
          </div>
        )}
        <div className="glass-card" style={{maxWidth:"1120px"}}>
          <div className="eyebrow-tag mono">Faculty Coordinators</div>
          <TeamGrid category="faculty" allowAdd />
        </div>
        <div className="glass-card" style={{maxWidth:"1120px",marginTop:"3rem"}}>
          <div className="eyebrow-tag mono">All Team Members</div>
          <TeamGrid category="team" allowAdd />
        </div>
      </div>

      <AdminEventTimeModal
        open={timeModalOpen}
        onClose={() => setTimeModalOpen(false)}
      />
    </div>
  );
}

export default Team;
