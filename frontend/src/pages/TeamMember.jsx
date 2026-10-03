import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuth';
import {
  deleteAdminFaculty,
  deleteAdminMember,
  getAdminFaculty,
  getAdminMembers,
  getFacultyBySlug,
  getFacultyMembers,
  getTeamMemberBySlug,
  getTeamMembers,
  updateAdminFaculty,
  updateAdminMember,
} from '../services/api';
import EditableImage from '../components/EditableImage';
import MemberEditor from '../components/MemberEditor';
import PhotoCursor from '../components/PhotoCursor';
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

// Fill any blank/missing field (API record or not) from the static catalog, then from the slug.
function normalizeMember(raw, slug) {
  const fb = STATIC_REGISTRY[slug] || {};
  const src = raw || {};
  const get = (k) => {
    const v = src[k] ?? src[k.charAt(0).toUpperCase() + k.slice(1)];
    return v !== undefined && v !== null && String(v).trim() !== '' ? v : undefined;
  };
  const slugName = String(slug || '').split('-').filter(Boolean).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  return {
    ...fb,
    ...src,
    name: get('name') || fb.name || slugName,
    role: get('role') || fb.role || '',
    team: get('team') || fb.team,
    description: get('description') || fb.description,
    roles: Array.isArray(src.roles) && src.roles.length ? src.roles : fb.roles,
  };
}

function Teammate({ person }) {
  const ref = useRef(null);
  return (
    <Link to={`/${person.slug}`} className="pf-mate">
      <div className="pf-mate-photo" ref={ref}>
        {person.image ? <img src={person.image} alt={person.name} loading="lazy" /> : <span>{getInitials(person.name)}</span>}
        <PhotoCursor targetRef={ref} name={person.name} sub={person.role} image={person.image} />
      </div>
      <div className="pf-mate-name">{person.name}</div>
      <div className="pf-mate-role mono">{person.role}</div>
    </Link>
  );
}

const SOCIALS = {
  email: { label: 'Email', icon: <><path d="M22 6 12 13 2 6" /><path d="M2 6h20v12H2z" /></>, stroke: true },
  linkedin: { label: 'LinkedIn', icon: <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />, stroke: false },
  instagram: { label: 'Instagram', icon: <><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></>, stroke: true },
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

  const stageRef = useRef(null);
  const photoRef = useRef(null);
  const [mates, setMates] = useState([]);

  // Same-department teammates (live API first, static catalog as fallback)
  useEffect(() => {
    if (!member) { setMates([]); return undefined; }
    let cancelled = false;
    const team = member.team || STATIC_REGISTRY[slug]?.team;
    const staticMates = () =>
      Object.entries(STATIC_REGISTRY)
        .filter(([k, v]) => k !== slug && v.team === team)
        .map(([k, v]) => ({ ...v, slug: k }));
    (async () => {
      let list = [];
      try {
        const data = isFaculty ? await getFacultyMembers() : await getTeamMembers();
        list = (data || []).filter((m) => m.slug !== slug && m.team === team);
      } catch { /* fall through */ }
      if (!list.length) list = staticMates();
      if (!cancelled) setMates(list.slice(0, 6));
    })();
    return () => { cancelled = true; };
  }, [member, slug, isFaculty]);

  const onStageMove = (e) => {
    const el = stageRef.current;
    if (!el || isAdmin || e.pointerType !== 'mouse') return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty('--ry', `${(px - 0.5) * 12}deg`);
    el.style.setProperty('--rx', `${(0.5 - py) * 10}deg`);
    el.style.setProperty('--mx', `${px * 100}%`);
    el.style.setProperty('--my', `${py * 100}%`);
    el.dataset.tilt = 'on';
  };
  const onStageLeave = () => {
    const el = stageRef.current;
    if (!el) return;
    el.style.setProperty('--ry', '0deg');
    el.style.setProperty('--rx', '0deg');
    delete el.dataset.tilt;
  };

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
              setMember(normalizeMember(teamMatch, slug));
              setKind('team');
              document.title = `${normalizeMember(teamMatch, slug).name} | TEDx BIET`;
            }
            return;
          }
          const facultyMatch = faculty.find((m) => m.slug === slug);
          if (facultyMatch) {
            if (!cancelled) {
              setMember(normalizeMember(facultyMatch, slug));
              setKind('faculty');
              document.title = `${normalizeMember(facultyMatch, slug).name} | TEDx BIET`;
            }
            return;
          }
        } else {
          const isKnownFaculty = slug === 'nazneen-fatima' || slug === 'rehana' || STATIC_REGISTRY[slug]?.team === 'Faculty Coordination' || STATIC_REGISTRY[slug]?.role?.includes('Faculty');
          
          try {
            const data = isKnownFaculty 
              ? await getFacultyBySlug(slug)
              : await getTeamMemberBySlug(slug);

            if (cancelled) return;
            if (data) {
              const fac = Boolean(data.isFaculty ?? isKnownFaculty);
              setMember(normalizeMember(data, slug));
              setKind(fac ? 'faculty' : 'team');
              document.title = `${normalizeMember(data, slug).name} | TEDx BIET`;
              return;
            }
          } catch {
            // Fall through if not found in primary endpoint
          }

          if (cancelled) return;

          try {
            const altData = isKnownFaculty
              ? await getTeamMemberBySlug(slug)
              : await getFacultyBySlug(slug);

            if (cancelled) return;
            if (altData) {
              const fac = Boolean(altData.isFaculty ?? !isKnownFaculty);
              setMember(normalizeMember(altData, slug));
              setKind(fac ? 'faculty' : 'team');
              document.title = `${normalizeMember(altData, slug).name} | TEDx BIET`;
              return;
            }
          } catch {
            // Not found in live API, proceed to static fallback
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
  const words = String(member.name || '').split(/\s+/).filter(Boolean);
  const lastWord = words.length > 1 ? words[words.length - 1] : words[0] || '';
  const firstWords = words.length > 1 ? words.slice(0, -1).join(' ') : '';
  const socials = ['email', 'linkedin', 'instagram'].filter((k) => member[k]);
  const kindLabel = isFaculty ? 'Faculty' : 'Organizer';
  const marqueeItems = [teamName, member.role, 'TEDxBIET 2026', kindLabel].filter(Boolean);

  return (
    <article className="profile-page">
      <div className="pf-orb pf-orb-a" aria-hidden="true" />
      <div className="pf-orb pf-orb-b" aria-hidden="true" />

      <div className="profile-container" style={{ '--len': Math.max(6, teamName.length) }}>
        <div className="profile-breadcrumbs">
          <button
            type="button"
            className="profile-back-link"
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate('/');
              }
            }}
          >
            <span>&larr;</span> Back
          </button>
          <Link to="/team" className="profile-back-link">
            All Members
          </Link>
          <button
            type="button"
            className="profile-back-link profile-back-home"
            onClick={() => {
              sessionStorage.removeItem('tedx_home_scroll_y');
              navigate('/');
            }}
          >
            Home
          </button>
        </div>

        {isAdmin && (
          <div className="profile-admin-panel">
            <button type="button" className="btn btn-fill" onClick={() => { setEditorError(''); setEditorOpen(true); }}>
              Edit Details
            </button>
            <button type="button" className="btn btn-line profile-admin-delete" onClick={removeMember}>
              Remove Member
            </button>
            {statusMessage && <span className="profile-admin-status">{statusMessage}</span>}
          </div>
        )}

        <div className="pf-ghost" aria-hidden="true">{teamName}</div>

        {/* ============ HERO ============ */}
        <section className="pf-hero">
          <div
            className="pf-stage pf-rise"
            style={{ '--d': 0 }}
            ref={stageRef}
            onPointerMove={onStageMove}
            onPointerLeave={onStageLeave}
          >
            <div className="pf-glow" aria-hidden="true" />
            <div className="pf-frame">
              {/* Corner tech accents */}
              <span className="pf-corner pf-corner-tl" aria-hidden="true" />
              <span className="pf-corner pf-corner-tr" aria-hidden="true" />
              <span className="pf-corner pf-corner-bl" aria-hidden="true" />
              <span className="pf-corner pf-corner-br" aria-hidden="true" />

              <div className="pf-photo" ref={photoRef}>
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
                  <img src={member.image} alt={member.name} loading="eager" />
                ) : (
                  <div className="profile-initials-fallback">{getInitials(member.name)}</div>
                )}
                <span className="pf-sheen" aria-hidden="true" />
              </div>

              {/* Integrated sleek badge */}
              <div className="pf-badge" aria-label="TEDxBIET 2026">
                <span className="pf-badge-dot" aria-hidden="true" />
                <span className="pf-badge-text mono">TEDxBIET</span>
                <span className="pf-badge-sep" aria-hidden="true">&bull;</span>
                <span className="pf-badge-year mono">2026</span>
              </div>
            </div>
          </div>

          <div className="pf-intro">
            <div className="pf-eyebrow mono pf-rise" style={{ '--d': 1 }}>
              <i />{isFaculty ? 'Faculty Coordinator' : 'Organizing Team'} &middot; {teamName}
            </div>

            <h1 className="pf-name" aria-label={member.name}>
              {firstWords && (
                <span className="pf-line pf-first" aria-hidden="true"><span style={{ '--d': 2 }}>{firstWords}</span></span>
              )}
              <span className="pf-line pf-last" aria-hidden="true">
                <span style={{ '--d': 3 }}>{lastWord}<em>.</em></span>
              </span>
            </h1>

            <div className="pf-role pf-rise" style={{ '--d': 4 }}>
              <i />
              <b>{member.role}</b>
              <span className="pf-tag mono">{kindLabel}</span>
            </div>

            <dl className="pf-facts pf-rise" style={{ '--d': 5 }}>
              <div><dt className="mono">Department</dt><dd>{teamName}</dd></div>
              <div><dt className="mono">Institution</dt><dd>BIET, Hyderabad</dd></div>
              <div><dt className="mono">Edition</dt><dd>2026</dd></div>
            </dl>

            <blockquote className="pf-quote pf-rise" style={{ '--d': 6 }}>
              <p>{description}</p>
            </blockquote>

            <div className="pf-actions pf-rise" style={{ '--d': 7 }}>
              {socials.map((k) => {
                const sc = SOCIALS[k];
                const href = k === 'email' ? `mailto:${member[k]}` : member[k];
                return (
                  <a
                    key={k}
                    href={href}
                    className="pf-icon-btn"
                    title={sc.label}
                    aria-label={sc.label}
                    {...(k === 'email' ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
                  >
                    <svg viewBox="0 0 24 24" fill={sc.stroke ? 'none' : 'currentColor'} stroke={sc.stroke ? 'currentColor' : undefined} strokeWidth={sc.stroke ? 1.8 : undefined}>
                      {sc.icon}
                    </svg>
                  </a>
                );
              })}
              <Link to="/team" className="pf-link mono">Full directory <span>&rarr;</span></Link>
            </div>
          </div>
        </section>
      </div>

      {/* ============ MARQUEE ============ */}
      <div className="pf-marquee" aria-hidden="true">
        <div className="pf-marquee-track">
          {[0, 1].map((g) => (
            <div className="pf-marquee-group" key={g}>
              {[...marqueeItems, ...marqueeItems].map((t, i) => (
                <span key={i} className={i % 2 ? 'pf-m-out' : 'pf-m-solid'}>{t}<i>&#10022;</i></span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="profile-container">
        {/* ============ MISSION ============ */}
        {rolesList.length > 0 && (
          <section className="pf-mission-wrap">
            <div className="pf-mission-head">
              <span className="pf-kicker mono">What I do</span>
              <h2 className="pf-h2">Mission <em>&amp;</em> Responsibilities</h2>
              <span className="pf-count mono">{String(rolesList.length).padStart(2, '0')} duties</span>
            </div>
            <ol className="pf-rows">
              {rolesList.map((r, i) => (
                <li className="pf-row" key={i}>
                  <span className="pf-row-no">{String(i + 1).padStart(2, '0')}</span>
                  <p>{r}</p>
                  <span className="pf-row-arrow" aria-hidden="true">&nearr;</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* ============ TEAMMATES ============ */}
        {mates.length > 0 && (
          <section className="pf-section">
            <div className="pf-mates-head">
              <h2 className="pf-h2">More from <em>{teamName}</em></h2>
              <Link to="/team" className="pf-link mono">All members <span>&rarr;</span></Link>
            </div>
            <div className="pf-mates">
              {mates.map((m) => <Teammate person={m} key={m._id || m.slug} />)}
            </div>
          </section>
        )}

        <Link to="/team" className="pf-cta">
          <span>Meet the whole team</span>
          <i aria-hidden="true">&nearr;</i>
        </Link>
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
