import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAdminAuth } from '../context/AdminAuth';
import { getSiteSettings, updateAdminEventTime } from '../services/api';
import './AdminEventTimeModal.css';

export default function AdminEventTimeModal({ open, onClose, onSaved }) {
  const { token } = useAdminAuth();
  const [eventDate, setEventDate] = useState('2026-10-05T09:00');
  const [dateLabel, setDateLabel] = useState('5 October 2026');
  const [timeLabel, setTimeLabel] = useState('9:00 AM IST');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError('');
    setSuccess('');
    getSiteSettings()
      .then((settings) => {
        if (settings.eventDate) {
          try {
            const d = new Date(settings.eventDate);
            const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
              .toISOString()
              .slice(0, 16);
            setEventDate(localIso);
          } catch {
            setEventDate('2026-10-05T09:00');
          }
        }
        if (settings.eventDateLabel) setDateLabel(settings.eventDateLabel);
        if (settings.eventTimeLabel) setTimeLabel(settings.eventTimeLabel);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!token) {
      setError('You must be logged in as admin.');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const parsedDate = new Date(eventDate);
      if (isNaN(parsedDate.getTime())) {
        setError('Please select a valid date and time.');
        setSaving(false);
        return;
      }

      // Auto-generate labels if empty
      const generatedDateLabel =
        dateLabel.trim() ||
        parsedDate.toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
      const generatedTimeLabel =
        timeLabel.trim() ||
        parsedDate.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }) + ' IST';

      const payload = {
        eventDate: parsedDate.toISOString(),
        eventDateLabel: generatedDateLabel,
        eventTimeLabel: generatedTimeLabel,
      };

      const res = await updateAdminEventTime(token, payload);
      setSuccess('Event date and time saved to MongoDB successfully!');

      window.dispatchEvent(
        new CustomEvent('event-time-updated', {
          detail: res.siteSettings || payload,
        })
      );

      if (onSaved) onSaved(res.siteSettings || payload);

      setTimeout(() => {
        if (onClose) onClose();
      }, 1200);
    } catch (err) {
      setError(err.data?.message || err.message || 'Failed to update event time in database.');
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="event-time-modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="event-time-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-time-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="event-time-header">
          <div className="event-time-tag mono">Admin Mode &middot; Settings</div>
          <h2 id="event-time-title">Event Date &amp; Time</h2>
          <p className="event-time-sub">
            Update the official TEDx event time. Changes persist in MongoDB and dynamically drive the homepage countdown clock.
          </p>
        </div>

        {loading ? (
          <div className="event-time-loading mono">Loading current settings from MongoDB...</div>
        ) : (
          <form onSubmit={handleSave} className="event-time-form">
            <div className="event-time-field">
              <label className="mono" htmlFor="event-datetime-input">
                Target Date &amp; Time (Local)
              </label>
              <input
                id="event-datetime-input"
                type="datetime-local"
                className="event-time-input mono"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required
              />
            </div>

            <div className="event-time-row">
              <div className="event-time-field">
                <label className="mono" htmlFor="event-date-label">
                  Display Date Label
                </label>
                <input
                  id="event-date-label"
                  type="text"
                  className="event-time-input mono"
                  placeholder="e.g. 5 October 2026"
                  value={dateLabel}
                  onChange={(e) => setDateLabel(e.target.value)}
                />
              </div>

              <div className="event-time-field">
                <label className="mono" htmlFor="event-time-label">
                  Display Time Label
                </label>
                <input
                  id="event-time-label"
                  type="text"
                  className="event-time-input mono"
                  placeholder="e.g. 9:00 AM IST"
                  value={timeLabel}
                  onChange={(e) => setTimeLabel(e.target.value)}
                />
              </div>
            </div>

            {error && <div className="event-time-alert err mono">{error}</div>}
            {success && <div className="event-time-alert ok mono">{success}</div>}

            <div className="event-time-actions">
              <button
                type="button"
                className="btn btn-ghost mono"
                onClick={onClose}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary mono"
                disabled={saving}
              >
                {saving ? 'Saving to Database...' : 'Save & Update Clock'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}
