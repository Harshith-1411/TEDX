import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuth';
import {
  deleteAdminMember,
  getAdminMembers,
  getTeamMemberBySlug,
  updateAdminMember,
} from '../services/api';
import EditableImage from '../components/EditableImage';
import MemberEditor from '../components/MemberEditor';
import './TeamMember.css';

function ProfileSkeleton() {
  return (
    <div className="profile-skeleton" aria-hidden="true">
      <div className="skeleton profile-skeleton-image" />
      <div className="profile-skeleton-copy">
        <div className="skeleton profile-skeleton-line wide" />
        <div className="skeleton profile-skeleton-line" />
        <div className="skeleton profile-skeleton-line short" />
      </div>
    </div>
  );
}

function TeamMember() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAdmin, token, clearSession } = useAdminAuth();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editorError, setEditorError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const handleAuthFailure = useCallback(() => {
    clearSession();
    navigate('/admin/login', { replace: true });
  }, [clearSession, navigate]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    setError(false);
    setMember(null);
    setStatusMessage('');

    async function load() {
      try {
        let data;
        if (isAdmin) {
          const members = await getAdminMembers(token);
          data = members.find((item) => item.slug === slug);
          if (!data) {
            const err = new Error('Not found');
            err.status = 404;
            throw err;
          }
        } else {
          data = await getTeamMemberBySlug(slug);
        }

        if (!cancelled) {
          setMember(data);
          document.title = `${data.name} | TEDx BIET`;
        }
      } catch (err) {
        if (!cancelled) {
          if (isAdmin && err.status === 401) {
            handleAuthFailure();
            return;
          }
          if (err.status === 404) {
            setNotFound(true);
            document.title = 'Team member not found | TEDx BIET';
          } else {
            setError(true);
            document.title = 'Error | TEDx BIET';
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [slug, isAdmin, token, handleAuthFailure]);

  async function saveMember(form) {
    setSaving(true);
    setEditorError('');

    try {
      const saved = await updateAdminMember(token, member._id, form);
      setMember(saved);
      setEditorOpen(false);
      setStatusMessage('Details saved');
      document.title = `${saved.name} | TEDx BIET`;
      if (saved.slug !== slug) {
        navigate(`/${saved.slug}`, { replace: true });
      }
    } catch (requestError) {
      if (requestError.status === 401) {
        handleAuthFailure();
        return;
      }
      setEditorError(requestError.data?.message || 'Unable to save team member.');
    } finally {
      setSaving(false);
    }
  }

  async function uploadPhoto(image) {
    setUploading(true);
    try {
      const saved = await updateAdminMember(token, member._id, { ...member, image });
      setMember(saved);
      setStatusMessage('Photo updated');
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

  async function removeMember() {
    if (!window.confirm(`Remove ${member.name}?`)) return;

    try {
      await deleteAdminMember(token, member._id);
      navigate('/team', { replace: true });
    } catch (requestError) {
      if (requestError.status === 401) {
        handleAuthFailure();
        return;
      }
      setStatusMessage(requestError.data?.message || 'Unable to remove member.');
    }
  }

  if (loading) {
    return (
      <section className="section profile-page">
        <div className="container">
          <p className="profile-status">Loading profile...</p>
          <ProfileSkeleton />
        </div>
      </section>
    );
  }

  if (notFound) {
    return (
      <section className="section profile-page profile-state">
        <div className="container">
          <h1>Team member not found.</h1>
          <Link to="/team" className="btn btn-ghost">
            ← Back to Team
          </Link>
        </div>
      </section>
    );
  }

  if (error || !member) {
    return (
      <section className="section profile-page profile-state">
        <div className="container">
          <h1>Unable to load profile.</h1>
          <p>Try again later.</p>
          <Link to="/team" className="btn btn-ghost">
            ← Back to Team
          </Link>
        </div>
      </section>
    );
  }

  const hasEmail = Boolean(member.email);
  const hasLinkedIn = Boolean(member.linkedin);
  const hasInstagram = Boolean(member.instagram);
  const showSocial = hasEmail || hasLinkedIn || hasInstagram || isAdmin;

  return (
    <article className="section profile-page">
      <div className="container">
        {isAdmin && (
          <div className="profile-admin-bar">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setEditorError('');
                setEditorOpen(true);
              }}
            >
              Edit details
            </button>
            <button type="button" className="btn btn-ghost profile-admin-delete" onClick={removeMember}>
              Remove member
            </button>
            {statusMessage && <p className="profile-admin-status">{statusMessage}</p>}
          </div>
        )}

        <div className="profile-hero">
          <EditableImage
            src={member.image}
            alt={member.name}
            className="profile-image"
            wrapClassName="profile-image-wrap"
            canEdit={isAdmin}
            uploading={uploading}
            onUpload={uploadPhoto}
          />
          <div className="profile-intro">
            <span className="section-label">TEDx BIET</span>
            <h1 className="profile-name">{member.name}</h1>
            <p className="profile-role">{member.role}</p>
            <p className="profile-org">TEDx BIET</p>
            {isAdmin && (
              <p className="profile-slug-hint">
                Profile URL: /{member.slug}
              </p>
            )}
          </div>
        </div>

        <div className="profile-body">
          <section className="profile-about" aria-labelledby="about-member">
            <h2 id="about-member" className="profile-section-title">
              About
            </h2>
            <p>{member.description}</p>
          </section>

          <div className="profile-meta">
            <div>
              <h2 className="profile-section-title">Role</h2>
              <p className="profile-meta-value">{member.role}</p>
            </div>
            <div>
              <h2 className="profile-section-title">Team</h2>
              <p className="profile-meta-value">{member.team}</p>
            </div>
          </div>

          {showSocial && (
            <section className="profile-social" aria-labelledby="social-heading">
              <h2 id="social-heading" className="profile-section-title">
                Social Links
              </h2>
              <ul>
                {hasLinkedIn && (
                  <li>
                    <a
                      href={member.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      LinkedIn
                    </a>
                  </li>
                )}
                {hasInstagram && (
                  <li>
                    <a
                      href={member.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Instagram
                    </a>
                  </li>
                )}
                {hasEmail && (
                  <li>
                    <a href={`mailto:${member.email}`}>Email</a>
                  </li>
                )}
                {isAdmin && !hasLinkedIn && !hasInstagram && !hasEmail && (
                  <li className="profile-social-empty">No links yet — use Edit details to add them.</li>
                )}
              </ul>
            </section>
          )}

          <Link to="/team" className="btn btn-ghost profile-back">
            ← Back to Team
          </Link>
        </div>
      </div>

      {isAdmin && (
        <MemberEditor
          open={editorOpen}
          mode="edit"
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

export default TeamMember;
