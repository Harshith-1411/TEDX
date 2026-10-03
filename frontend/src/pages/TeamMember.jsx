import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuth';
import {
  deleteAdminFaculty,
  deleteAdminMember,
  getAdminFaculty,
  getAdminMembers,
  getFacultyBySlug,
  getTeamMemberBySlug,
  updateAdminFaculty,
  updateAdminMember,
} from '../services/api';
import EditableImage from '../components/EditableImage';
import MemberEditor from '../components/MemberEditor';
import './TeamMember.css';

const getInitials = (n) => {
  const w = String(n || '').split(/\s+/).filter((x) => !/\.$/.test(x));
  return (w.length ? w : String(n || '').split(/\s+/)).slice(0, 2).map((x) => x[0]).join('').toUpperCase();
};

export default function TeamMember() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAdmin, token, clearSession } = useAdminAuth();

  const [member, setMember] = useState(null);
  const [kind, setKind] = useState('team');
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editorError, setEditorError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const isFaculty = kind === 'faculty';

  const handleAuthFailure = useCallback(() => {
    clearSession();
    navigate('/admin/login', { replace: true });
  }, [clearSession, navigate]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setStatusMessage('');

    async function load() {
      try {
        if (isAdmin) {
          const [team, faculty] = await Promise.all([getAdminMembers(token), getAdminFaculty(token)]);
          const teamMatch = team.find((m) => m.slug === slug);
          if (teamMatch) {
            if (!cancelled) {
              setMember(teamMatch);
              setKind('team');
              document.title = `${teamMatch.name} | TEDx BIET`;
            }
            return;
          }
          const facultyMatch = faculty.find((m) => m.slug === slug);
          if (facultyMatch) {
            if (!cancelled) {
              setMember(facultyMatch);
              setKind('faculty');
              document.title = `${facultyMatch.name} | TEDx BIET`;
            }
            return;
          }
        } else {
          try {
            const data = await getTeamMemberBySlug(slug);
            if (!cancelled && data) {
              setMember(data);
              setKind('team');
              document.title = `${data.name} | TEDx BIET`;
              return;
            }
          } catch {
            // Not a team member, attempt faculty lookup
          }
          try {
            const data = await getFacultyBySlug(slug);
            if (!cancelled && data) {
              setMember(data);
              setKind('faculty');
              document.title = `${data.name} | TEDx BIET`;
              return;
            }
          } catch {
            // Not found in faculty endpoint
          }
        }
      } catch (err) {
        if (isAdmin && err.status === 401) {
          handleAuthFailure();
          return;
        }
      }

      if (!cancelled) {
        setMember(null);
        document.title = 'Profile Not Found | TEDx BIET';
      }
    }

    load().finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [slug, isAdmin, token, handleAuthFailure]);

  async function saveMember(form) {
    setSaving(true);
    setEditorError('');
    try {
      const saved = isFaculty
        ? await updateAdminFaculty(token, member._id, form)
        : await updateAdminMember(token, member._id, form);
      setMember(saved);
      setEditorOpen(false);
      setStatusMessage('Details saved successfully.');
      document.title = `${saved.name} | TEDx BIET`;
      if (saved.slug !== slug) navigate(`/${saved.slug}`, { replace: true });
    } catch (requestError) {
      if (requestError.status === 401) {
        handleAuthFailure();
        return;
      }
      setEditorError(requestError.data?.message || 'Unable to save details.');
    } finally {
      setSaving(false);
    }
  }

  async function uploadPhoto(image) {
    setUploading(true);
    try {
      const payload = { ...member, image };
      const saved = isFaculty
        ? await updateAdminFaculty(token, member._id, payload)
        : await updateAdminMember(token, member._id, payload);
      setMember(saved);
      setStatusMessage('Photo updated successfully.');
    } catch (requestError) {
      if (requestError.status === 401) {
        handleAuthFailure();
        return;
      }
      setStatusMessage(requestError.data?.message || 'Unable to upload photo.');
      throw requestError;
    } finally {
      setUploading(false);
    }
  }

  async function removePhoto() {
    if (!member) return;
    setUploading(true);
    try {
      const saved = isFaculty
        ? await updateAdminFaculty(token, member._id, { ...member, image: '' })
        : await updateAdminMember(token, member._id, { ...member, image: '' });
      setMember(saved);
      setStatusMessage('Photo removed.');
    } catch (requestError) {
      if (requestError.status === 401) {
        handleAuthFailure();
        return;
      }
      setStatusMessage(requestError.data?.message || 'Unable to remove photo.');
    } finally {
      setUploading(false);
    }
  }

  async function removeMember() {
    if (!window.confirm(`Are you sure you want to remove ${member.name}?`)) return;
    try {
      if (isFaculty) await deleteAdminFaculty(token, member._id);
      else await deleteAdminMember(token, member._id);
      navigate('/team', { replace: true });
    } catch (err) {
      alert(err.data?.message || 'Failed to remove member.');
    }
  }

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-state">
          <p className="mono">LOADING PROFILE...</p>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="profile-page">
        <div className="profile-state">
          <h1>Profile not found</h1>
          <p>The requested team member could not be located.</p>
          <Link to="/team" className="btn btn-line mono">
            &larr; Back to Team Directory
          </Link>
        </div>
      </div>
    );
  }

  const rolesList = Array.isArray(member.roles) && member.roles.length > 0
    ? member.roles
    : typeof member.roles === 'string' && member.roles.trim()
      ? member.roles.split('\n').map((r) => r.trim()).filter(Boolean)
      : [
          `Execute and coordinate responsibilities for the ${member.team || 'TEDxBIET'} team.`,
          'Ensure high quality event delivery and adherence to TEDx regulations.',
        ];
  const teamName = member.team || (isFaculty ? 'Faculty Coordination' : 'Organizing Team');
  const description = member.description || 'Dedicated to bringing ideas worth spreading to Bharat Institute of Engineering and Technology.';

  return (
    <article className="profile-page">
      <div className="profile-container">
        {/* Breadcrumb Navigation */}
        <div className="profile-breadcrumbs">
          <Link to="/#team" className="profile-back-link">
            <span>&larr;</span> 05 &middot; Back to Organizing Team
          </Link>
        </div>

        {/* Admin Bar */}
        {isAdmin && (
          <div className="profile-admin-panel">
            <button
              type="button"
              className="btn btn-fill"
              onClick={() => {
                setEditorError('');
                setEditorOpen(true);
              }}
            >
              Edit Details
            </button>
            <button
              type="button"
              className="btn btn-line profile-admin-delete"
              onClick={removeMember}
            >
              Remove Member
            </button>
            {statusMessage && <span className="profile-admin-status">{statusMessage}</span>}
          </div>
        )}

        {/* Glass Card Showcase */}
        <div className="profile-card">
          <div className="profile-card-inner">
            {/* Left: Portrait */}
            <div className="profile-portrait-pane">
              <div className="profile-photo-wrapper">
                {isAdmin ? (
                  <EditableImage
                    src={member.image}
                    alt={member.name}
                    canEdit={isAdmin}
                    uploading={uploading}
                    onUpload={uploadPhoto}
                    onRemove={removePhoto}
                  />
                ) : member.image ? (
                  <img src={member.image} alt={member.name} />
                ) : (
                  <div className="profile-initials-fallback">
                    {getInitials(member.name)}
                  </div>
                )}
              </div>

              <div className="profile-dept-pill mono">{teamName}</div>

              <div className="profile-meta-tags">
                <span className="profile-meta-tag mono">TEDxBIET 2026</span>
                <span className="profile-meta-tag mono">INDEPENDENT</span>
              </div>
            </div>

            {/* Right: Info & Responsibilities */}
            <div className="profile-content-pane">
              <div className="profile-eyebrow mono">
                {isFaculty ? '05 \u00B7 Faculty Coordinator' : '05 \u00B7 Organizing Team'}
              </div>
              <h1 className="profile-title">{member.name}</h1>
              <div className="profile-role-line mono">{member.role}</div>
              <div className="profile-affiliation">
                Bharat Institute of Engineering and Technology &mdash; Hyderabad
              </div>

              <div className="profile-divider" />

              {/* Responsibilities Block */}
              {rolesList.length > 0 && (
                <div className="profile-block">
                  <div className="profile-block-heading mono">Mission &amp; Responsibilities</div>
                  <ul className="profile-roles-list">
                    {rolesList.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* About Block */}
              <div className="profile-block">
                <div className="profile-block-heading mono">About</div>
                <p className="profile-bio-text">{description}</p>
              </div>

              {/* Social / Connect Buttons */}
              <div className="profile-social-row">
                {member.email && (
                  <a
                    href={`mailto:${member.email}`}
                    className="profile-social-btn"
                    title="Send Email"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M22 6 12 13 2 6" />
                      <path d="M2 6h20v12H2z" />
                    </svg>
                    Email
                  </a>
                )}
                {member.linkedin && (
                  <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="profile-social-btn"
                    title="LinkedIn"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                    LinkedIn
                  </a>
                )}
                {member.instagram && (
                  <a
                    href={member.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="profile-social-btn"
                    title="Instagram"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                    </svg>
                    Instagram
                  </a>
                )}
                <Link to="/team" className="profile-social-btn">
                  Full Directory &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Edit Modal */}
      {isAdmin && (
        <MemberEditor
          open={editorOpen}
          mode="edit"
          category={isFaculty ? 'faculty' : 'team'}
          initialMember={member}
          saving={saving}
          error={editorError}
          onClose={() => !saving && setEditorOpen(false)}
          onSave={saveMember}
        />
      )}
    </article>
  );
}
