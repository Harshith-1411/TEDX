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

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || ['gxv', 'qul6b'].join('');

// Fallback catalog from template for all 22 team members
const STATIC_REGISTRY = {
  'shaik-fathima-sania': {
    name: 'Shaik Fathima Sania',
    role: 'Organizer / License Holder',
    team: 'Leadership',
    description: 'Leading and overseeing the entire TEDx event, ensuring full TEDx compliance, and coordinating all departments, sponsors, and speakers.',
    roles: [
      'Lead and oversee the entire TEDx event',
      'Make key decisions and ensure TEDx compliance',
      'Coordinate all departments and speakers',
      'Approve budgets, plans, and timelines',
      'Represent the event with sponsors, partners, and guests',
      'Ensure successful event execution',
    ],
  },
  'sai-aarushi-channa': {
    name: 'Sai Aarushi Channa',
    role: 'Co-Organizer',
    team: 'Leadership',
    description: 'Supporting the Organizer in all event operations, monitoring progress and milestones, and driving cross-team synchronization.',
    roles: [
      'Support the Organizer in all event operations',
      'Monitor department progress and deadlines',
      'Coordinate communication between teams',
      'Assist in planning, problem-solving, and event management',
      'Take charge when the Organizer is unavailable',
      'Ensure smooth execution before and during the event',
    ],
  },
  'v-lakshmi-anudeep': {
    name: 'V. Lakshmi Anudeep',
    role: 'Lead',
    team: 'Sponsorship',
    description: 'Driving sponsorship relations and industry collaborations for TEDxBIET 2026.',
    roles: [
      'Identify potential sponsors and partners',
      'Prepare sponsorship proposals and packages',
      'Contact companies and schedule meetings',
      'Negotiate sponsorship benefits and agreements',
    ],
  },
  'shashi-preetham': {
    name: 'Shashi Preetham',
    role: 'Deputy Lead',
    team: 'Sponsorship',
    description: 'Assisting sponsorship acquisition, partner communications, and deliverable fulfillment.',
    roles: [
      'Maintain sponsor relationships before and during event',
      'Ensure sponsor deliverables are fulfilled',
      'Collect sponsorship agreements and documents',
    ],
  },
  'nizam': {
    name: 'Nizam',
    role: 'Lead',
    team: 'Design',
    description: 'Crafting the visual identity, digital art, and scenic branding of TEDxBIET.',
    roles: [
      'Create event branding and visual identity',
      'Design posters, banners, passes, certificates, and presentations',
      'Ensure TEDx branding guidelines are followed across all media',
    ],
  },
  'joy-vihaan': {
    name: 'Joy Vihaan',
    role: 'Member',
    team: 'Design',
    description: 'Visual designer specializing in creative assets and multimedia storytelling.',
    roles: [
      'Design digital social assets and banners',
      'Assist with stage visual aesthetics and merchandise graphics',
    ],
  },
  'akshay': {
    name: 'Akshay',
    role: 'Member',
    team: 'Design',
    description: 'Graphic designer supporting promotional collateral and brand consistency.',
    roles: [
      'Design event passes, certificates, and signage',
      'Maintain brand guidelines across all published media',
    ],
  },
  'shaik-faisal-aiyan': {
    name: 'Shaik Faisal Aiyan',
    role: 'Lead',
    team: 'Photography & Videography',
    description: 'Directing the visual capture and cinematic documentation of TEDxBIET.',
    roles: [
      'Plan photo and video coverage across all stages',
      'Assign photographers and videographers to key zones',
      'Capture event preparations, speakers, and audience moments',
    ],
  },
  'n-sruthi': {
    name: 'N. Sruthi',
    role: 'Lead',
    team: 'Finance',
    description: 'Managing overall budget allocation, financial transparency, and accounts.',
    roles: [
      'Prepare and manage the event budget',
      'Track income, expenses, and invoices',
      'Prepare the post-event financial report',
    ],
  },
  'k-srija': {
    name: 'K. Srija',
    role: 'Deputy Lead',
    team: 'Finance',
    description: 'Supporting financial audits, expense documentation, and vendor disbursements.',
    roles: [
      'Maintain payment records and receipts',
      'Coordinate with the sponsorship team regarding funds',
    ],
  },
  'revanth': {
    name: 'Revanth',
    role: 'Lead',
    team: 'Editing',
    description: 'Post-production lead producing teaser videos, speaker intros, and after-movies.',
    roles: [
      'Edit promotional videos and reels',
      'Create speaker introduction videos',
      'Produce highlight videos and the official after-movie',
    ],
  },
  'ch-tanmay-prudhvinandan': {
    name: 'Ch. Tanmay Prudhvinandan',
    role: 'Lead',
    team: 'Registration',
    description: 'Managing attendee onboarding, ticket verifications, and front-desk logistics.',
    roles: [
      'Manage attendee registrations and confirmations',
      'Maintain participant databases and check-in desks',
    ],
  },
  'k-mithali': {
    name: 'K. Mithali',
    role: 'Lead',
    team: 'Event Management',
    description: 'Directing stage schedule, venue flow, and overall audience experience.',
    roles: [
      'Coordinate venue logistics and stage setup',
      'Manage event day schedule and crowd control',
    ],
  },
  'palle-pranay': {
    name: 'Palle Pranay',
    role: 'Deputy Lead',
    team: 'Event Management',
    description: 'Assisting event day execution and backstage speaker coordination.',
    roles: [
      'Oversee sound, lighting, and stage flow',
      'Support speakers and guests on event day',
    ],
  },
  'harika': {
    name: 'Harika',
    role: 'Member',
    team: 'Event Management',
    description: 'Facilitating attendee navigation and stage operations.',
    roles: [
      'Manage hall transitions and guest guidance',
    ],
  },
  's-sunny-abhishek': {
    name: 'S. Sunny Abhishek',
    role: 'Content Creator',
    team: 'Content Creation',
    description: 'Crafting captivating social media narratives, copies, and digital outreach.',
    roles: [
      'Manage Instagram, LinkedIn, and social platforms',
      'Create the content calendar and countdown campaigns',
      'Engage with followers and track analytics',
    ],
  },
  'g-manohar': {
    name: 'G. Manohar',
    role: 'Lead',
    team: 'Technical',
    description: 'Leading web architecture, platform development, and digital systems.',
    roles: [
      'Develop and maintain the official TEDxBIET website',
      'Implement interactive web features and countdown systems',
      'Ensure high performance, mobile responsiveness, and uptime',
    ],
  },
  'harshith': {
    name: 'Harshith',
    role: 'Deputy Lead',
    team: 'Technical',
    description: 'Full-stack developer implementing responsive web features and API integrations.',
    roles: [
      'Maintain digital assets and web infrastructure',
      'Support frontend performance and backend services',
    ],
  },
  'noel-charan': {
    name: 'Noel Charan',
    role: 'Lead',
    team: 'Purchasing',
    description: 'Overseeing procurement, material quality, and vendor deliveries.',
    roles: [
      'Procure official TEDx materials, badges, and merchandise',
      'Manage vendor orders and delivery schedules',
    ],
  },
  'b-tejaswini': {
    name: 'B. Tejaswini',
    role: 'Lead',
    team: 'Documentation',
    description: 'Overseeing official minutes, archival records, and compliance files.',
    roles: [
      'Maintain official TEDx records and progress reports',
      'Manage agreements, permissions, and approvals',
      'Compile the final TEDx event report',
    ],
  },
  'harsha-vardhan': {
    name: 'Harsha Vardhan',
    role: 'Deputy Lead',
    team: 'Documentation',
    description: 'Documenting meeting records, speaker agreements, and participant archives.',
    roles: [
      'Prepare meeting minutes and attendance records',
      'Store files in organized digital repositories',
    ],
  },
  'keerthana-chukka': {
    name: 'Keerthana Chukka',
    role: 'Lead',
    team: 'Hospitality',
    description: 'Hosting distinguished guests, coordinating refreshments, and concierge services.',
    roles: [
      'Welcome and host distinguished guests, speakers, and attendees',
      'Coordinate catering and guest accommodations',
    ],
  },
  'nazneen-fatima': {
    name: 'Nazneen Fatima',
    role: 'Faculty Coordinator',
    team: 'Faculty Coordination',
    image: `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/v1790871663/tedx-faculty-coordinators/nazneen-fatima.jpg`,
    description: 'Provides academic guidance and coordinates faculty activities to support the team’s goals and initiatives.',
    roles: [
      'Provide academic guidance and institutional support for TEDxBIET',
      'Coordinate faculty involvement, departmental permissions, and academic scheduling',
      'Liaise between student organizers and college administration',
      'Ensure event execution adheres to university standards and safety policies',
    ],
  },
  'rehana': {
    name: 'Rehana',
    role: 'Faculty Coordinator',
    team: 'Faculty Coordination',
    image: `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/v1790871708/tedx-faculty-coordinators/rehana.jpg`,
    description: 'Supports student and team activities while helping coordinate academic programs, events, and faculty involvement.',
    roles: [
      'Support student organizing committees across operational and logistics workflows',
      'Coordinate academic department outreach and auditorium scheduling',
      'Facilitate student permissions, certifications, and institutional arrangements',
      'Mentor leadership leads on project management and event protocol',
    ],
  },
};

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
      // 1. First attempt to load from live API
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

      // 2. Fallback to rich static catalog
      const fallback = STATIC_REGISTRY[slug];
      if (fallback && !cancelled) {
        const isFac = fallback.team === 'Faculty Coordination' || fallback.role?.includes('Faculty');
        setMember({ ...fallback, slug, _id: slug });
        setKind(isFac ? 'faculty' : 'team');
        document.title = `${fallback.name} | TEDx BIET`;
      } else if (!cancelled) {
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

  const staticFallback = STATIC_REGISTRY[slug] || {};
  const rolesList = member.roles || staticFallback.roles || [];
  const teamName = member.team || staticFallback.team || (isFaculty ? 'Faculty Coordination' : 'Organizing Team');
  const description = member.description || staticFallback.description || 'Dedicated to bringing ideas worth spreading to Bharat Institute of Engineering and Technology.';

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
