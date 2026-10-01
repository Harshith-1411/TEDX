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
import SocialLinks, { memberSocialItems } from '../components/SocialLinks';
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

async function findBySlug({ slug, isAdmin, token }) {
  if (isAdmin) {
    const [team, faculty] = await Promise.all([
      getAdminMembers(token),
      getAdminFaculty(token),
    ]);
    const teamMatch = team.find((item) => item.slug === slug);
    if (teamMatch) return { data: teamMatch, kind: 'team' };
    const facultyMatch = faculty.find((item) => item.slug === slug);
    if (facultyMatch) return { data: facultyMatch, kind: 'faculty' };
    const err = new Error('Not found');
    err.status = 404;
    throw err;
  }

  try {
    const data = await getTeamMemberBySlug(slug);
    return { data, kind: 'team' };
  } catch (teamError) {
    if (teamError.status !== 404) throw teamError;
    const data = await getFacultyBySlug(slug);
    return { data, kind: 'faculty' };
  }
}

function TeamMember() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAdmin, token, clearSession } = useAdminAuth();
  const [member, setMember] = useState(null);
  const [kind, setKind] = useState('team');
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(false);
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
    setNotFound(false);
    setError(false);
    setMember(null);
    setStatusMessage('');

    async function load() {
      try {
        const { data, kind: foundKind } = await findBySlug({ slug, isAdmin, token });
        if (!cancelled) {
          setMember(data);
          setKind(foundKind);
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
            document.title = 'Profile not found | TEDx BIET';
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
      const saved = isFaculty
        ? await updateAdminFaculty(token, member._id, form)
        : await updateAdminMember(token, member._id, form);
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
      setEditorError(
        requestError.data?.message ||
          (isFaculty ? 'Unable to save faculty coordinator.' : 'Unable to save team member.')
      );
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
      if (isFaculty) {
        await deleteAdminFaculty(token, member._id);
        navigate('/', { replace: true });
      } else {
        await deleteAdminMember(token, member._id);
        navigate('/team', { replace: true });
      }
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
          <h1>Profile not found.</h1>
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

  const socialItems = memberSocialItems(member);
  const showSocial = socialItems.length > 0 || isAdmin;

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
              {isFaculty ? 'Remove coordinator' : 'Remove member'}
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
            <span className="section-label">
              {isFaculty ? 'Faculty Coordinator' : 'TEDx BIET'}
            </span>
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
            {!isFaculty && (
              <div>
                <h2 className="profile-section-title">Team</h2>
                <p className="profile-meta-value">{member.team}</p>
              </div>
            )}
          </div>

          {showSocial && (
            <section className="profile-social" aria-labelledby="social-heading">
              <h2 id="social-heading" className="profile-section-title">
                Social Links
              </h2>
              <SocialLinks
                items={socialItems}
                emptyMessage={
                  isAdmin ? 'No links yet — use Edit details to add them.' : ''
                }
              />
            </section>
          )}

          <Link to={isFaculty ? '/#faculty' : '/team'} className="btn btn-ghost profile-back">
            {isFaculty ? '← Back to Faculty' : '← Back to Team'}
          </Link>
        </div>
      </div>

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

export default TeamMember;
