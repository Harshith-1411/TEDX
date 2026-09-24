import { Link } from 'react-router-dom';
import EditableImage from './EditableImage';
import './TeamCard.css';

function TeamCard({
  member,
  isAdmin = false,
  uploadingId = null,
  onEdit,
  onDelete,
  onUploadPhoto,
}) {
  const uploading = uploadingId === member._id;

  return (
    <article className={`team-card${isAdmin ? ' team-card-admin' : ''}`}>
      <Link to={`/${member.slug}`} className="team-card-link">
        <EditableImage
          src={member.image}
          alt={member.name}
          className="team-card-image"
          wrapClassName="team-card-image-wrap"
          canEdit={isAdmin}
          uploading={uploading}
          onUpload={
            isAdmin
              ? (image) => onUploadPhoto?.(member, image)
              : undefined
          }
        />
        <div className="team-card-body">
          <h3 className="team-card-name">{member.name}</h3>
          <p className="team-card-role">{member.role}</p>
          <p className="team-card-team">{member.team}</p>
          <span className="team-card-cta">
            View Profile <span aria-hidden="true">→</span>
          </span>
        </div>
      </Link>

      {isAdmin && (
        <div className="team-card-admin-actions">
          <button
            type="button"
            className="btn btn-ghost team-card-admin-btn"
            onClick={() => onEdit?.(member)}
          >
            Edit details
          </button>
          <button
            type="button"
            className="btn btn-ghost team-card-admin-btn team-card-admin-delete"
            onClick={() => onDelete?.(member)}
          >
            Remove
          </button>
        </div>
      )}
    </article>
  );
}

export default TeamCard;
