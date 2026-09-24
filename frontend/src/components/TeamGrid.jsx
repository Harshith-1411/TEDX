import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuth';
import {
  createAdminMember,
  deleteAdminMember,
  getAdminMembers,
  getTeamMembers,
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

function TeamGrid({ limit, showViewAll = false }) {
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
        const data = isAdmin ? await getAdminMembers(token) : await getTeamMembers();
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
  }, [handleAuthFailure, isAdmin, token]);

  useEffect(() => {
    if (!isAdmin) return;
    if (searchParams.get('add') !== '1') return;
    setEditorMode('create');
    setEditingMember(null);
    setEditorError('');
    setEditorOpen(true);
    const next = new URLSearchParams(searchParams);
    next.delete('add');
    setSearchParams(next, { replace: true });
  }, [isAdmin, searchParams, setSearchParams]);

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
        const saved = await createAdminMember(token, form);
        setMembers((current) => [...current, saved].sort((a, b) => a.name.localeCompare(b.name)));
        setStatusMessage(`${saved.name} created`);
      } else {
        const saved = await updateAdminMember(token, editingMember._id, form);
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
      setEditorError(requestError.data?.message || 'Unable to save team member.');
    } finally {
      setSaving(false);
    }
  }

  async function removeMember(member) {
    if (!window.confirm(`Remove ${member.name}?`)) return;

    try {
      await deleteAdminMember(token, member._id);
      setMembers((current) => current.filter((item) => item._id !== member._id));
      setStatusMessage(`${member.name} removed`);
    } catch (requestError) {
      if (requestError.status === 401) {
        handleAuthFailure();
        return;
      }
      setStatusMessage(requestError.data?.message || 'Unable to remove member.');
    }
  }

  async function uploadPhoto(member, image) {
    setUploadingId(member._id);
    try {
      const saved = await updateAdminMember(token, member._id, { ...member, image });
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

  const visible = limit ? members.slice(0, limit) : members;

  if (loading) {
    return (
      <div className="team-grid-state">
        <p className="team-status">Loading the team...</p>
        <TeamSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="team-grid-state team-error" role="alert">
        <p>Unable to load team members.</p>
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

      <div className="team-grid">
        {visible.map((member) => (
          <TeamCard
            key={member._id || member.slug}
            member={member}
            isAdmin={isAdmin}
            uploadingId={uploadingId}
            onEdit={openEdit}
            onDelete={removeMember}
            onUploadPhoto={uploadPhoto}
          />
        ))}
      </div>

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
