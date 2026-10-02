import { Link } from 'react-router-dom';
import './TeamCard.css';

function TeamCard({ member, onEdit, isAdmin }) {
  const initials = member.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  return (
    <article className="team-card">
      <div className="team-card-image-wrap">
        {member.image
          ? <img src={member.image} alt={member.name} className="team-card-image" loading="lazy" />
          : <div className="team-card-initials">{initials}</div>}
        {isAdmin && onEdit && (
          <button type="button" className="team-card-edit-btn" onClick={(e) => { e.preventDefault(); onEdit(member); }}>
            Edit
          </button>
        )}
      </div>
      <Link to={`/${member.slug}`} className="team-card-body" style={{display:"block",textDecoration:"none"}}>
        <div className="team-card-name">{member.name}</div>
        <div className="team-card-role">{member.role}</div>
        {member.team && <div className="team-card-team">{member.team}</div>}
      </Link>
    </article>
  );
}

export default TeamCard;
