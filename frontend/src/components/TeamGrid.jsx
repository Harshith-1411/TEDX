import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuth';
import {
  createAdminFaculty,
  createAdminMember,
  deleteAdminFaculty,
  deleteAdminMember,
  getAdminFaculty,
  getAdminMembers,
  getFacultyMembers,
  getTeamMembers,
  updateAdminFaculty,
  updateAdminMember,
} from '../services/api';
import MemberEditor from './MemberEditor';
import TeamCard from './TeamCard';
import './TeamGrid.css';

function TeamSkeleton() {
  return (
    <div className="team-grid" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="team-skeleton">
          <div className="skeleton team-skeleton-image" />
          <div className="skeleton team-skeleton-line" />
          <div className="skeleton team-skeleton-line short" />
        </div>
      ))}
    </div>
  );
}

function TeamGrid({
  limit,
  showViewAll = false,
  category = 'team',
  allowAdd = false,
}) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAdmin, token, clearSession } = useAdminAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState('edit');
  const [editingMember, setEditingMember] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editorError, setEditorError] = useState('');
  const [uploadingId, setUploadingId] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');

  const isFaculty = category === 'faculty';

  const handleAuthFailure = useCallback(() => {
    clearSession();
    navigate('/admin/login', { replace: true });
  }, [clearSession, navigate]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(false);
      try {
        let data;
        if (isFaculty) {
          data = isAdmin ? await getAdminFaculty(token) : await getFacultyMembers();
        } else {
          data = isAdmin ? await getAdminMembers(token) : await getTeamMembers();
        }
        if (!cancelled) setMembers(data);
      } catch (requestError) {
        if (cancelled) return;
        if (isAdmin && requestError.status === 401) {
          handleAuthFailure();
          return;
        }
        setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [handleAuthFailure, isAdmin, token, isFaculty]);

  useEffect(() => {
    if (!isAdmin) return;
    const addParam = isFaculty ? 'addFaculty' : 'add';
    if (searchParams.get(addParam) !== '1') return;
    setEditorMode('create');
    setEditingMember(null);
    setEditorError('');
    setEditorOpen(true);
    const next = new URLSearchParams(searchParams);
    next.delete(addParam);
    setSearchParams(next, { replace: true });
  }, [isAdmin, searchParams, setSearchParams, isFaculty]);

  function openCreate() {
    setEditorMode('create');
    setEditingMember(null);
    setEditorError('');
    setEditorOpen(true);
  }

  function openEdit(member) {
    setEditorMode('edit');
    setEditingMember(member);
    setEditorError('');
    setEditorOpen(true);
  }

  async function saveMember(form) {
    setSaving(true);
    setEditorError('');

    try {
      if (editorMode === 'create') {
        const saved = isFaculty
          ? await createAdminFaculty(token, form)
          : await createAdminMember(token, form);
        setMembers((current) => [...current, saved].sort((a, b) => a.name.localeCompare(b.name)));
        setStatusMessage(`${saved.name} created`);
      } else {
        const saved = isFaculty
          ? await updateAdminFaculty(token, editingMember._id, form)
          : await updateAdminMember(token, editingMember._id, form);
        setMembers((current) =>
          current.map((member) => (member._id === saved._id ? saved : member))
        );
        setStatusMessage(`${saved.name} updated`);
      }
      setEditorOpen(false);
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

  async function removeMember(member) {
    const label = isFaculty ? 'faculty coordinator' : 'member';
    if (!window.confirm(`Remove ${member.name}?`)) return;

    try {
      if (isFaculty) {
        await deleteAdminFaculty(token, member._id);
      } else {
        await deleteAdminMember(token, member._id);
      }
      setMembers((current) => current.filter((item) => item._id !== member._id));
      setStatusMessage(`${member.name} removed`);
    } catch (requestError) {
      if (requestError.status === 401) {
        handleAuthFailure();
        return;
      }
      setStatusMessage(requestError.data?.message || `Unable to remove ${label}.`);
    }
  }

  async function uploadPhoto(member, image) {
    setUploadingId(member._id);
    try {
      const payload = { ...member, image };
      const saved = isFaculty
        ? await updateAdminFaculty(token, member._id, payload)
        : await updateAdminMember(token, member._id, payload);
      setMembers((current) =>
        current.map((item) => (item._id === saved._id ? saved : item))
      );
      setStatusMessage(`Photo updated for ${saved.name}`);
    } catch (requestError) {
      if (requestError.status === 401) {
        handleAuthFailure();
        return;
      }
      setStatusMessage(requestError.data?.message || 'Unable to upload photo.');
      throw requestError;
    } finally {
      setUploadingId(null);
    }
  }

  async function removePhoto(member) {
    setUploadingId(member._id);
    try {
      const payload = { ...member, image: '' };
      const saved = isFaculty
        ? await updateAdminFaculty(token, member._id, payload)
        : await updateAdminMember(token, member._id, payload);
      setMembers((current) =>
        current.map((item) => (item._id === saved._id ? saved : item))
      );
      setStatusMessage(`Photo removed for ${saved.name}`);
    } catch (requestError) {
      if (requestError.status === 401) {
        handleAuthFailure();
        return;
      }
      setStatusMessage(requestError.data?.message || 'Unable to remove photo.');
    } finally {
      setUploadingId(null);
    }
  }

  const visible = limit ? members.slice(0, limit) : members;
  const emptyLabel = isFaculty ? 'No faculty coordinators yet.' : 'No team members yet.';
  const errorLabel = isFaculty
    ? 'Unable to load faculty coordinators.'
    : 'Unable to load team members.';

  if (loading) {
    return (
      <div className="team-grid-state">
        <p className="team-status">
          {isFaculty ? 'Loading faculty…' : 'Loading the team...'}
        </p>
        <TeamSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="team-grid-state team-error" role="alert">
        <p>{errorLabel}</p>
        <p className="team-error-sub">Try again later.</p>
      </div>
    );
  }

  return (
    <div className="team-grid-wrap">
      {isAdmin && statusMessage && (
        <p className="team-admin-status" role="status">
          {statusMessage}
        </p>
      )}

      {isAdmin && allowAdd && (
        <div className="team-grid-admin-bar">
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            {isFaculty ? 'Add faculty coordinator' : 'Add team member'}
          </button>
        </div>
      )}

      {visible.length === 0 ? (
        <div className="team-grid-state">
          <p className="team-status">{emptyLabel}</p>
        </div>
      ) : (
        <div className="team-grid">
          {visible.map((member) => (
            <TeamCard
              key={member._id || member.slug}
              member={member}
              isAdmin={isAdmin}
              isFaculty={isFaculty}
              uploadingId={uploadingId}
              onEdit={openEdit}
              onDelete={removeMember}
              onUploadPhoto={uploadPhoto}
              onRemovePhoto={removePhoto}
            />
          ))}
        </div>
      )}

      {showViewAll && members.length > (limit || 0) && (
        <div className="team-view-all">
          <Link to="/team" className="btn btn-ghost">
            View full team →
          </Link>
        </div>
      )}

      {isAdmin && (
        <MemberEditor
          open={editorOpen}
          mode={editorMode}
          category={category}
          initialMember={editingMember}
          saving={saving}
          error={editorError}
          onClose={() => !saving && setEditorOpen(false)}
          onSave={saveMember}
        />
      )}
    </div>
  );
}

export default TeamGrid;
