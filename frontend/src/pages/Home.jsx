import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuth";
import {
  getTeamMembers,
  getAdminMembers,
  createAdminMember,
  updateAdminMember,
  deleteAdminMember,
  getFacultyMembers,
  getAdminFaculty,
  createAdminFaculty,
  updateAdminFaculty,
  deleteAdminFaculty,
  getSpeakers,
  createAdminSpeaker,
  updateAdminSpeaker,
  deleteAdminSpeaker,
  getSiteSettings,
  updateAdminEventTime,
} from "../services/api";
import MemberEditor from "../components/MemberEditor";
import SpeakerEditor from "../components/SpeakerEditor";
import CampusMap from "../components/CampusMap";
import ImageCropper from "../components/ImageCropper";
import "./Home.css";

const TARGET = new Date("2026-10-05T09:00:00+05:30").getTime();
const pad = (n) => String(n).padStart(2, "0");

const SPARKS = [
  "What would you build if no one could tell you it was impossible?",
  "Name one belief you held five years ago that you would now argue against.",
  "What problem in your own life could quietly become someone else's thesis?",
  "If you had eighteen minutes on this stage, what would you refuse to leave out?",
  "What's something your field accepts as obvious that probably isn't?",
  "Who taught you the most without ever meaning to teach you anything?",
  "What would change in your city if one small rule were rewritten?",
  "What's a failure you've never told anyone was actually useful?",
  "If your work disappeared tomorrow, what would people miss first?",
  "What tiny habit has quietly rewired how you think?",
  "What would you tell the version of yourself that hasn't started yet?",
];

const FAQS = [
  { q: "Who can attend TEDxBIET?", a: "Anyone with curiosity is welcome — students, faculty, alumni, and guests from outside BIET. Seats are limited, so early registration is recommended once tickets open." },
  { q: "How do I become a speaker?", a: 'Use the "Nominate A Speaker" button above, or write to us directly. We\'re looking for one real idea, clearly told — polish matters less than substance.' },
  { q: "Is TEDxBIET affiliated with TED?", a: "Yes. TEDxBIET operates under an official license from TED, following their format and standards for independently organized events, while curating our own local speakers and ideas." },
  { q: "Will tickets be free or paid?", a: "Pricing will be announced alongside the confirmed date. Sign up in the mission clock section and you'll be first to know the moment it's live." },
  { q: "Can I volunteer with the organizing team?", a: "Absolutely — we run on volunteers for curation, design, logistics, and outreach. Reach out through the contact details in the footer." },
];

function useCountdown(targetTimestamp) {
  const [cd, setCd] = useState({ d: 0, h: 0, m: 0, s: 0 });
  useEffect(() => {
    function tick() {
      const target = targetTimestamp || TARGET;
      const diff = Math.max(0, target - Date.now());
      const total = Math.floor(diff / 1000);
      setCd({ d: Math.floor(total / 86400), h: Math.floor((total % 86400) / 3600), m: Math.floor((total % 3600) / 60), s: total % 60 });
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetTimestamp]);
  return cd;
}

function RevealCard({ children, className = "", style = {} }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      el.classList.add("active");
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add("active");
          io.unobserve(el);
        }
      },
      { threshold: 0.02, rootMargin: "150px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} style={style} className={`glass-card reveal-element ${className}`}>
      {children}
    </div>
  );
}

function OrbitClock({ days, hours, mins, secs }) {
  const radii = { days: 140, hours: 112, mins: 84, secs: 56 };
  const vals = { days: 1 - Math.min(days, 60) / 60, hours: hours / 24, mins: mins / 60, secs: secs / 60 };
  const colors = { days: "#e62b1e", hours: "#f5f4f2", mins: "#ff5240", secs: "#e8a099" };
  return (
    <div className="orbit-clock">
      <svg viewBox="0 0 300 300">
        {["days","hours","mins","secs"].map((k) => <circle key={k+"t"} cx="150" cy="150" r={radii[k]} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />)}
        {["days","hours","mins","secs"].map((k) => {
          const r = radii[k];
          const c = 2 * Math.PI * r;
          const offset = c * (1 - Math.max(0, Math.min(1, vals[k])));
          const ang = (-90 + vals[k] * 360) * Math.PI / 180;
          const bx = 150 + r * Math.cos(ang);
          const by = 150 + r * Math.sin(ang);
          return (
            <g key={k}>
              <circle cx="150" cy="150" r={r} fill="none" stroke={colors[k]} strokeWidth="2.6" strokeLinecap="round" style={{ strokeDasharray: c, strokeDashoffset: offset, transform: "rotate(-90deg)", transformOrigin: "center", filter: "drop-shadow(0 0 6px currentColor)", transition: "stroke-dashoffset 0.6s cubic-bezier(0.16,1,0.3,1)" }} />
              <circle cx={bx} cy={by} r={k === "secs" ? 3.4 : 4} fill={colors[k]} style={{ filter: "drop-shadow(0 0 6px currentColor)" }} />
            </g>
          );
        })}
      </svg>
      <div className="clock-core">
        <div className="flame" aria-hidden="true" />
        <div className="clock-core-label mono">IMPACT</div>
      </div>
    </div>
  );
}

const CONSTELLATIONS = [
  { points: [[10,80],[30,20],[50,60],[70,15],[90,50]], lines: [[0,1],[1,2],[2,3],[3,4]] },
  { points: [[10,15],[35,20],[55,15],[70,35],[85,58],[60,72],[40,58]], lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6]] },
];

function ConstellationSVG({ idx }) {
  const pat = CONSTELLATIONS[idx % CONSTELLATIONS.length];
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" style={{ width: "70%", height: "70%" }}>
      {pat.lines.map(([a,b],i) => <line key={i} x1={pat.points[a][0]} y1={pat.points[a][1]} x2={pat.points[b][0]} y2={pat.points[b][1]} stroke="rgba(245,244,242,0.35)" strokeWidth="0.6" />)}
      {pat.points.map((p,i) => <g key={i}><circle cx={p[0]} cy={p[1]} r="4" fill="#e62b1e" opacity="0.35" /><circle cx={p[0]} cy={p[1]} r="1.6" fill="#e62b1e" /></g>)}
    </svg>
  );
}

const ICONS = {
  award: (<><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></>),
  pen: (<><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/></>),
  camera: (<><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></>),
  chart: (<><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>),
  film: (<><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/></>),
  check: (<><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>),
  cal: (<><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>),
  share: (<><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></>),
  code: (<><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></>),
  cart: (<><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></>),
  file: (<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></>),
  heart: (<><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></>),
};

const LEADERS = [
  {
    tag: "Organizer / License Holder",
    name: "Shaik Fathima Sania",
    slug: "shaik-fathima-sania",
    roles: [
      "Lead and oversee the entire TEDx event",
      "Make key decisions and ensure TEDx compliance",
      "Coordinate all departments and speakers",
      "Approve budgets, plans, and timelines",
      "Represent the event with sponsors, partners, and guests",
      "Ensure successful event execution",
    ],
  },
  {
    tag: "Co-Organizer",
    name: "Sai Aarushi Channa",
    slug: "sai-aarushi-channa",
    roles: [
      "Support the Organizer in all event operations",
      "Monitor department progress and deadlines",
      "Coordinate communication between teams",
      "Assist in planning, problem-solving, and event management",
      "Take charge when the Organizer is unavailable",
      "Ensure smooth execution before and during the event",
    ],
  },
];

const DEPTS = [
  {
    name: "Sponsorship",
    icon: "award",
    leads: ["V. Lakshmi Anudeep"],
    deputies: ["Shashi Preetham"],
    members: [],
    roles: [
      "Identify potential sponsors and partners",
      "Prepare sponsorship proposals and packages",
      "Contact companies and schedule meetings",
      "Negotiate sponsorship benefits",
      "Maintain sponsor relationships before, during, and after the event",
      "Ensure sponsor deliverables are fulfilled",
      "Collect sponsorship agreements and documents",
    ],
  },
  {
    name: "Design",
    icon: "pen",
    leads: [],
    deputies: [],
    members: ["Nizam", "Joy Vihaan", "Akshay"],
    roles: [
      "Create event branding and visual identity",
      "Design posters, banners, standees, certificates, passes, and presentations",
      "Ensure TEDx branding guidelines are followed",
      "Coordinate with marketing and social media teams",
      "Maintain design consistency across all platforms",
    ],
  },
  {
    name: "Photography & Videography",
    icon: "camera",
    leads: ["Shaik Faisal Aiyan"],
    deputies: [],
    members: [],
    roles: [
      "Plan photo and video coverage",
      "Assign photographers / videographers to locations",
      "Capture event preparations, speakers, audience, and activities",
      "Organize and store media files",
      "Coordinate with the editing team for content creation",
    ],
  },
  {
    name: "Finance",
    icon: "chart",
    leads: ["N. Sruthi"],
    deputies: ["K. Srija"],
    members: [],
    roles: [
      "Prepare and manage the event budget",
      "Track income and expenses",
      "Maintain invoices and payment records",
      "Coordinate with the sponsorship team regarding funds",
      "Ensure financial transparency",
      "Prepare the post-event financial report",
    ],
  },
  {
    name: "Editing",
    icon: "film",
    leads: ["Revanth"],
    deputies: [],
    members: [],
    roles: [
      "Edit promotional videos and reels",
      "Create speaker introduction videos",
      "Produce highlight videos and the after-movie",
      "Manage video content deadlines",
      "Ensure high-quality audio and visual output",
    ],
  },
  {
    name: "Registration",
    icon: "check",
    leads: ["Ch. Tanmay Prudhvinandan"],
    deputies: [],
    members: [],
    roles: [
      "Manage attendee registrations",
      "Maintain the participant database",
      "Handle ticketing and confirmations",
      "Manage the check-in desk on event day",
    ],
  },
  {
    name: "Event Management",
    icon: "cal",
    leads: ["K. Mithali"],
    deputies: ["Palle Pranay"],
    members: ["Harika"],
    roles: [
      "Coordinate venue logistics and stage setup",
      "Manage event day schedule and crowd control",
      "Oversee sound, lighting, and stage flow",
      "Support speakers and guests on event day",
    ],
  },
  {
    name: "Content Creation",
    icon: "share",
    leads: [],
    deputies: [],
    members: [{ name: "S. Sunny Abhishek", title: "Content Creator" }],
    roles: [
      "Manage Instagram, LinkedIn, and other platforms",
      "Create the content calendar",
      "Post regular updates, speaker announcements, and countdowns",
      "Engage with followers and respond to messages",
      "Track analytics and audience engagement",
      "Coordinate with design and editing teams for content",
    ],
  },
  {
    name: "Technical",
    icon: "code",
    leads: ["G. Manohar"],
    deputies: ["Harshith"],
    members: [],
    roles: [
      "Develop and maintain the official TEDxBIET website",
      "Implement interactive web features, countdown, and ticketing portals",
      "Ensure high performance, mobile responsiveness, and server reliability",
      "Manage digital assets and technical infrastructure",
    ],
  },
  {
    name: "Purchasing",
    icon: "cart",
    leads: ["Noel Charan"],
    deputies: [],
    members: [],
    roles: [
      "Procure official TEDx materials, badges, and merchandise",
      "Manage vendor orders and delivery schedules",
      "Coordinate with the Finance team on purchase orders and receipts",
    ],
  },
  {
    name: "Documentation",
    icon: "file",
    leads: ["B. Tejaswini"],
    deputies: ["Harsha Vardhan"],
    members: [],
    roles: [
      "Maintain all official TEDx event records and documents",
      "Prepare meeting minutes and attendance records",
      "Collect department progress reports",
      "Manage sponsorship agreements, permissions, and approvals",
      "Organize speaker information, profiles, and consent forms",
      "Maintain registration and volunteer databases",
      "Prepare event reports and post-event documentation",
      "Store all files in an organized digital repository",
      "Coordinate with all departments for proper record-keeping",
      "Compile the final TEDx event report for future reference",
    ],
  },
  {
    name: "Hospitality",
    icon: "heart",
    leads: ["Keerthana Chukka"],
    deputies: [],
    members: [],
    roles: [
      "Welcome and host distinguished guests, speakers, and attendees",
      "Coordinate refreshments, catering, and guest accommodations",
      "Provide concierge assistance and ensure comfortable guest experience",
    ],
  },
];

const slugify = (n) => String(n).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const getInitials = (n) => {
  const w = String(n).split(/\s+/).filter(x => !/\.$/.test(x));
  return (w.length ? w : String(n).split(/\s+/)).slice(0, 2).map(x => x[0]).join('').toUpperCase();
};

function SpeakerCard({
  speaker,
  idx,
  isAdmin,
  onUploadPhoto,
  onEditSpeaker,
  onDeleteSpeaker,
}) {
  const [flipped, setFlipped] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cropSrc, setCropSrc] = useState("");
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !onUploadPhoto) return;
    if (!file.type.startsWith("image/")) return;

    const objectUrl = URL.createObjectURL(file);
    setCropSrc(objectUrl);
  };

  const handleCropConfirm = async (croppedFile) => {
    URL.revokeObjectURL(cropSrc);
    setCropSrc("");
    setUploading(true);
    try {
      await onUploadPhoto(speaker, croppedFile);
    } finally {
      setUploading(false);
    }
  };

  const handleCropCancel = () => {
    URL.revokeObjectURL(cropSrc);
    setCropSrc("");
  };

  const handleCardClick = (e) => {
    if (e.target.closest("button") || e.target.closest("input") || e.target.closest(".speaker-admin-actions")) return;
    setFlipped((f) => !f);
  };

  return (
    <div
      className={`speaker-card-flip ${flipped ? "flipped" : ""}`}
      onClick={handleCardClick}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && !e.target.closest("button") && setFlipped((f) => !f)}
      tabIndex={0}
      role="button"
      aria-pressed={flipped}
      aria-label={`${speaker.name}. Click to reveal the idea.`}
    >
      <div className="sc-inner">
        <div className="sc-face sc-front">
          <div className="speaker-avatar-wrap">
            {speaker.image ? (
              <img src={speaker.image} alt={speaker.name} className="speaker-avatar-img" />
            ) : (
              <ConstellationSVG idx={idx} />
            )}
            <span className="sc-hint mono">Tap to flip</span>
            {isAdmin && (
              <div className="speaker-admin-actions" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  className="speaker-upload-trigger"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  title="Upload & Crop Speaker Photo (3:4)"
                >
                  {uploading ? "Uploading..." : "📷 Change Photo"}
                </button>
                {onEditSpeaker && (
                  <button
                    type="button"
                    className="speaker-action-btn"
                    onClick={() => onEditSpeaker(speaker)}
                    disabled={uploading}
                    title="Edit Speaker Details"
                  >
                    ✏️
                  </button>
                )}
                {onDeleteSpeaker && (
                  <button
                    type="button"
                    className="speaker-action-btn del"
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to remove speaker "${speaker.name}"?`)) {
                        onDeleteSpeaker(speaker);
                      }
                    }}
                    disabled={uploading}
                    title="Remove Speaker"
                  >
                    🗑️
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
              </div>
            )}
          </div>
          <div className="speaker-info-block">
            <div className="speaker-role mono">{speaker.role || "Inauguration guest"}</div>
            <h4>{speaker.name}</h4>
            <p>{speaker.note}</p>
          </div>
        </div>
        <div className="sc-face sc-back">
          <div className="sc-back-lbl mono">The idea</div>
          <div className="sc-topic">{speaker.topic || "To be announced"}</div>
          <div className="sc-back-hint mono">Tap to flip back</div>
        </div>
      </div>
      {isAdmin && (
        <ImageCropper
          open={Boolean(cropSrc)}
          src={cropSrc}
          aspectRatio={3 / 4}
          onCancel={handleCropCancel}
          onConfirm={handleCropConfirm}
        />
      )}
    </div>
  );
}

const CANONICAL_DEPTS = [
  {
    name: "Sponsorship",
    icon: "award",
    defaultLeads: ["V. Lakshmi Anudeep"],
    defaultDeputies: ["Shashi Preetham"],
    defaultMembers: [],
    roles: [
      "Identify potential sponsors and partners",
      "Prepare sponsorship proposals and packages",
      "Contact companies and schedule meetings",
      "Negotiate sponsorship benefits",
      "Maintain sponsor relationships before, during, and after the event",
      "Ensure sponsor deliverables are fulfilled",
      "Collect sponsorship agreements and documents",
    ],
  },
  {
    name: "Design",
    icon: "pen",
    defaultLeads: [],
    defaultDeputies: [],
    defaultMembers: ["Mohammed Nizamuddin", "Joy Vihaan", "Akshay Munnur"],
    roles: [
      "Create event branding and visual identity",
      "Design posters, banners, standees, certificates, passes, and presentations",
      "Ensure TEDx branding guidelines are followed",
      "Coordinate with marketing and social media teams",
      "Maintain design consistency across all platforms",
    ],
  },
  {
    name: "Photography & Videography",
    icon: "camera",
    defaultLeads: ["Shaik Faisal Aiyan"],
    defaultDeputies: [],
    defaultMembers: [],
    roles: [
      "Plan photo and video coverage",
      "Assign photographers / videographers to locations",
      "Capture event preparations, speakers, audience, and activities",
      "Organize and store media files",
      "Coordinate with the editing team for content creation",
    ],
  },
  {
    name: "Finance",
    icon: "chart",
    defaultLeads: ["N. Sruthi"],
    defaultDeputies: ["K. Srija"],
    defaultMembers: [],
    roles: [
      "Prepare and manage the event budget",
      "Track income and expenses",
      "Maintain invoices and payment records",
      "Coordinate with the sponsorship team regarding funds",
      "Ensure financial transparency",
      "Prepare the post-event financial report",
    ],
  },
  {
    name: "Editing",
    icon: "film",
    defaultLeads: ["Revanth"],
    defaultDeputies: [],
    defaultMembers: [],
    roles: [
      "Edit promotional videos and reels",
      "Create speaker introduction videos",
      "Produce highlight videos and the after-movie",
      "Manage video content deadlines",
      "Ensure high-quality audio and visual output",
    ],
  },
  {
    name: "Registration",
    icon: "check",
    defaultLeads: ["Ch. Tanmay Prudhinandan"],
    defaultDeputies: [],
    defaultMembers: [],
    roles: [
      "Manage attendee registrations",
      "Maintain the participant database",
      "Handle ticketing and confirmations",
      "Manage the check-in desk on event day",
    ],
  },
  {
    name: "Event Management",
    icon: "cal",
    defaultLeads: ["K. Mithali"],
    defaultDeputies: ["Palle Pranay"],
    defaultMembers: ["Harika"],
    roles: [
      "Coordinate venue logistics and stage setup",
      "Manage event day schedule and crowd control",
      "Oversee sound, lighting, and stage flow",
      "Support speakers and guests on event day",
    ],
  },
  {
    name: "Content Creation",
    icon: "share",
    defaultLeads: [],
    defaultDeputies: [],
    defaultMembers: ["S. Sunny Abhishek"],
    roles: [
      "Manage Instagram, LinkedIn, and other platforms",
      "Create the content calendar",
      "Post regular updates, speaker announcements, and countdowns",
      "Engage with followers and respond to messages",
      "Track analytics and audience engagement",
      "Coordinate with design and editing teams for content",
    ],
  },
  {
    name: "Technical",
    icon: "code",
    defaultLeads: ["G. Manohar"],
    defaultDeputies: ["Harshith Chepuri"],
    defaultMembers: [],
    roles: [
      "Develop and maintain the official TEDxBIET website",
      "Implement interactive web features, countdown, and ticketing portals",
      "Ensure high performance, mobile responsiveness, and server reliability",
      "Manage digital assets and technical infrastructure",
    ],
  },
  {
    name: "Purchasing",
    icon: "cart",
    defaultLeads: ["Noel Charan"],
    defaultDeputies: [],
    defaultMembers: [],
    roles: [
      "Procure official TEDx materials, badges, and merchandise",
      "Manage vendor orders and delivery schedules",
      "Coordinate with the Finance team on purchase orders and receipts",
    ],
  },
  {
    name: "Documentation",
    icon: "file",
    defaultLeads: ["Tejaswini Banala"],
    defaultDeputies: ["Harshavardhan Konda"],
    defaultMembers: [],
    roles: [
      "Maintain all official TEDx event records and documents",
      "Prepare meeting minutes and attendance records",
      "Collect department progress reports",
      "Manage sponsorship agreements, permissions, and approvals",
      "Organize speaker information, profiles, and consent forms",
      "Maintain registration and volunteer databases",
      "Prepare event reports and post-event documentation",
      "Store all files in an organized digital repository",
      "Coordinate with all departments for proper record-keeping",
      "Compile the final TEDx event report for future reference",
    ],
  },
  {
    name: "Hospitality",
    icon: "heart",
    defaultLeads: ["Keerthana Chukka"],
    defaultDeputies: [],
    defaultMembers: [],
    roles: [
      "Welcome and host distinguished guests, speakers, and attendees",
      "Coordinate refreshments, catering, and guest accommodations",
      "Provide concierge assistance and ensure comfortable guest experience",
    ],
  },
];

function normalizeDeptName(teamStr) {
  if (!teamStr) return "Other";
  const t = teamStr.toLowerCase().trim();
  if (t.includes("sponsor")) return "Sponsorship";
  if (t.includes("design")) return "Design";
  if (t.includes("photo") || t.includes("video")) return "Photography & Videography";
  if (t.includes("finance")) return "Finance";
  if (t.includes("edit")) return "Editing";
  if (t.includes("regist")) return "Registration";
  if (t.includes("event")) return "Event Management";
  if (t.includes("content") || t.includes("social")) return "Content Creation";
  if (t.includes("tech") || t.includes("web") || t.includes("code")) return "Technical";
  if (t.includes("purchas") || t.includes("procure")) return "Purchasing";
  if (t.includes("doc")) return "Documentation";
  if (t.includes("hospit")) return "Hospitality";
  return teamStr.trim();
}

const cleanNorm = (str) => (str || "").toLowerCase().replace(/[^a-z0-9]/g, "");

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || ['gxv', 'qul6b'].join('');

const DEFAULT_FACULTY = [
  {
    name: "Nazneen Fatima",
    slug: "nazneen-fatima",
    image: `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/v1790871663/tedx-faculty-coordinators/nazneen-fatima.jpg`,
    role: "Faculty CoOrdinator",
    description: "Provides academic guidance and coordinates faculty activities to support the team’s goals and initiatives.",
    email: "",
    linkedin: "",
    instagram: "",
  },
  {
    name: "Rehana",
    slug: "rehana",
    image: `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/v1790871708/tedx-faculty-coordinators/rehana.jpg`,
    role: "Faculty CoOrdinator",
    description: "Supports student and team activities while helping coordinate academic programs, events, and faculty involvement.",
    email: "",
    linkedin: "",
    instagram: "",
  },
];

function TeamOrganizingSection({ isAdmin, token, onShowToast }) {
  const [search, setSearch] = useState("");
  const [activeDept, setActiveDept] = useState("all");
  const [openRoles, setOpenRoles] = useState({});
  const [dbMembers, setDbMembers] = useState([]);
  const [faculty, setFaculty] = useState(DEFAULT_FACULTY);
  const [uploadingId, setUploadingId] = useState(null);
  const [targetMember, setTargetMember] = useState(null);
  const fileInputRef = useRef(null);

  // Admin Member Editor modal state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState("create");
  const [editorCategory, setEditorCategory] = useState("team");
  const [editingMember, setEditingMember] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editorError, setEditorError] = useState("");

  const toast = useCallback((msg) => {
    if (onShowToast) onShowToast(msg);
    else window.dispatchEvent(new CustomEvent("tedx-toast", { detail: msg }));
  }, [onShowToast]);

  const loadMembers = useCallback(async () => {
    try {
      const data = isAdmin ? await getAdminMembers(token) : await getTeamMembers();
      if (Array.isArray(data) && data.length > 0) setDbMembers(data);
    } catch {
      getTeamMembers()
        .then((res) => { if (Array.isArray(res) && res.length > 0) setDbMembers(res); })
        .catch(() => {});
    }
    const facRequest = (isAdmin && token) ? getAdminFaculty(token) : getFacultyMembers();
    facRequest
      .then((data) => { if (Array.isArray(data) && data.length > 0) setFaculty(data); })
      .catch(() => {});
  }, [isAdmin, token]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  // Listen for admin toolbar "Add member" event
  useEffect(() => {
    const handleAdd = () => {
      setEditorCategory("team");
      setEditingMember(null);
      setEditorMode("create");
      setEditorError("");
      setEditorOpen(true);
    };
    window.addEventListener("admin-add-member", handleAdd);
    return () => window.removeEventListener("admin-add-member", handleAdd);
  }, []);

  const handleAdminPhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !targetMember || !isAdmin || !token) return;
    setUploadingId(targetMember._id);
    try {
      const isTargetFaculty =
        faculty.some((f) => f._id === targetMember._id) ||
        targetMember.role?.toLowerCase().includes("faculty") ||
        targetMember.team === "Faculty Coordination";

      if (isTargetFaculty) {
        const updated = await updateAdminFaculty(token, targetMember._id, {
          ...targetMember,
          image: file,
        });
        setFaculty((prev) => prev.map((f) => (f._id === updated._id ? updated : f)));
        toast(`Photo updated for ${updated.name}!`);
      } else {
        const updated = await updateAdminMember(token, targetMember._id, {
          ...targetMember,
          image: file,
        });
        setDbMembers((prev) => prev.map((m) => (m._id === updated._id ? updated : m)));
        toast(`Photo updated for ${updated.name}!`);
      }
    } catch {
      toast("Unable to upload photo.");
    } finally {
      setUploadingId(null);
      setTargetMember(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleOpenAddModal = (category = "team") => {
    setEditorCategory(category);
    setEditingMember(null);
    setEditorMode("create");
    setEditorError("");
    setEditorOpen(true);
  };

  const handleOpenEditModal = (m, fallback = {}, category = "team") => {
    setEditorCategory(category);
    const cleanNorm = (str) => (str || "").toLowerCase().replace(/[^a-z0-9]/g, "");

    // If m has _id, it's already a real DB member.
    // Otherwise check if a real DB member exists with matching name/slug:
    let realMember = m?._id ? m : null;
    if (!realMember) {
      const matchName = cleanNorm(m?.name || fallback.name || "");
      if (matchName) {
        realMember = dbMembers.find((item) => {
          const iname = cleanNorm(item.name);
          const islug = cleanNorm(item.slug);
          return iname === matchName || islug === matchName || iname.includes(matchName) || matchName.includes(iname);
        }) || null;
      }
    }

    const memberObj = realMember ? { ...realMember } : {
      name: m?.name || fallback.name || "",
      slug: m?.slug || fallback.slug || "",
      role: m?.role || fallback.role || (category === "faculty" ? "Faculty Coordinator" : "Member"),
      team: m?.team || fallback.team || (category === "faculty" ? "Faculty Coordination" : ""),
      image: m?.image || fallback.photo || fallback.image || "",
      description: m?.description || (category === "faculty" ? "Faculty Coordinator for TEDx BIET." : `${fallback.role || "Member"} of the TEDx BIET team.`),
      email: m?.email || "",
      linkedin: m?.linkedin || "",
      instagram: m?.instagram || "",
    };
    setEditingMember(memberObj);
    setEditorMode(memberObj._id ? "edit" : "create");
    setEditorError("");
    setEditorOpen(true);
  };

  const handleSaveMember = async (form) => {
    setSaving(true);
    setEditorError("");
    try {
      if (editorCategory === "faculty") {
        if (editorMode === "create") {
          const created = await createAdminFaculty(token, form);
          setFaculty((prev) => [...prev, created]);
          toast(`Added ${created.name} as Faculty Coordinator!`);
        } else if (editingMember?._id) {
          const updated = await updateAdminFaculty(token, editingMember._id, form);
          setFaculty((prev) => prev.map((f) => (f._id === updated._id ? updated : f)));
          toast(`Updated ${updated.name}!`);
        }
      } else {
        if (editorMode === "create") {
          const created = await createAdminMember(token, form);
          setDbMembers((prev) => [...prev, created]);
          toast(`Added ${created.name} to team!`);
        } else if (editingMember?._id) {
          const updated = await updateAdminMember(token, editingMember._id, form);
          setDbMembers((prev) => prev.map((m) => (m._id === updated._id ? updated : m)));
          toast(`Updated ${updated.name}!`);
        }
      }
      setEditorOpen(false);
      setEditingMember(null);
    } catch (err) {
      setEditorError(err.data?.message || err.message || "Failed to save member.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMember = async (m) => {
    if (!m._id) return;
    if (!window.confirm(`Are you sure you want to remove ${m.name} from the team?`)) return;
    try {
      await deleteAdminMember(token, m._id);
      setDbMembers((prev) => prev.filter((item) => item._id !== m._id));
      toast(`Removed ${m.name}`);
    } catch (err) {
      toast(err.data?.message || "Failed to remove member.");
    }
  };

  const handleDeleteFaculty = async (f) => {
    if (!f._id) return;
    if (!window.confirm(`Are you sure you want to remove ${f.name} from faculty coordinators?`)) return;
    try {
      await deleteAdminFaculty(token, f._id);
      setFaculty((prev) => prev.filter((item) => item._id !== f._id));
      toast(`Removed ${f.name}`);
    } catch (err) {
      toast(err.data?.message || "Failed to remove faculty coordinator.");
    }
  };

  const toggleRole = (key) => {
    setOpenRoles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const q = search.trim().toLowerCase();

  // 1. Build Leadership: Organizer and Co-Organizer
  const leadershipData = useMemo(() => {
    return LEADERS.map((leader) => {
      const norm = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      const lk = norm(leader.name);
      let match = dbMembers.find((m) => {
        const mn = norm(m.name);
        const ms = norm(m.slug);
        const mr = norm(m.role);
        return (
          mn === lk ||
          ms === lk ||
          (mn && (mn.includes(lk) || lk.includes(mn))) ||
          (mr && mr.includes(norm(leader.tag)))
        );
      });
      return {
        ...leader,
        photo: match?.image || "",
        slug: match?.slug || leader.slug,
        member: match || null,
      };
    });
  }, [dbMembers]);

  // 2. Build Departments with real DB members dynamically
  const departmentsData = useMemo(() => {
    const deptMap = new Map();

    // Seed canonical departments
    CANONICAL_DEPTS.forEach((cd, idx) => {
      deptMap.set(cd.name, {
        index: idx,
        name: cd.name,
        icon: cd.icon,
        roles: cd.roles,
        leads: [],
        deputies: [],
        members: [],
      });
    });

    // Map each member in DB to a department
    dbMembers.forEach((m) => {
      const roleStr = (m.role || "").toLowerCase();
      // Skip leadership if already displayed in Leadership section
      if (
        (roleStr.includes("organizer") || roleStr.includes("license")) &&
        !roleStr.includes("co-organizer") &&
        !roleStr.includes("deputy")
      ) {
        return;
      }
      if (roleStr.includes("co-organizer")) {
        return;
      }

      const deptName = normalizeDeptName(m.team);
      if (!deptMap.has(deptName)) {
        deptMap.set(deptName, {
          index: deptMap.size,
          name: deptName,
          icon: "award",
          roles: ["Coordinate department duties, planning, and successful event execution."],
          leads: [],
          deputies: [],
          members: [],
        });
      }

      const d = deptMap.get(deptName);
      const isLead = roleStr.includes("lead") && !roleStr.includes("deputy");
      const isDeputy = roleStr.includes("deputy");

      const item = {
        name: m.name,
        slug: m.slug || slugify(m.name),
        role: m.role || (isLead ? "Lead" : isDeputy ? "Deputy Lead" : "Member"),
        photo: m.image || "",
        member: m,
        isLead,
        isDeputy,
      };

      if (isLead) d.leads.push(item);
      else if (isDeputy) d.deputies.push(item);
      else d.members.push(item);
    });

    // Helper to check if a person with this name already exists in the department, leadership, or dbMembers
    const isPersonAlreadyPresent = (dept, name) => {
      const k = cleanNorm(name);
      if (!k) return false;
      // 1. Is the person in this department's leads, deputies, or members?
      if (
        dept.leads.some((x) => {
          const xk = cleanNorm(x.name);
          return xk === k || (xk.length >= 4 && (k.includes(xk) || xk.includes(k)));
        }) ||
        dept.deputies.some((x) => {
          const xk = cleanNorm(x.name);
          return xk === k || (xk.length >= 4 && (k.includes(xk) || xk.includes(k)));
        }) ||
        dept.members.some((x) => {
          const xk = cleanNorm(x.name);
          return xk === k || (xk.length >= 4 && (k.includes(xk) || xk.includes(k)));
        })
      ) {
        return true;
      }
      // 2. Is the person in dbMembers anywhere in the database?
      if (
        dbMembers.some((m) => {
          const mk = cleanNorm(m.name);
          return mk === k || (mk.length >= 4 && (k.includes(mk) || mk.includes(k)));
        })
      ) {
        return true;
      }
      // 3. Is the person in Leadership?
      if (
        LEADERS.some((l) => {
          const lk = cleanNorm(l.name);
          return lk === k || (lk.length >= 4 && (k.includes(lk) || lk.includes(k)));
        })
      ) {
        return true;
      }
      return false;
    };

    // Fill in canonical default placeholders ONLY for people who do not already exist in DB or department
    CANONICAL_DEPTS.forEach((cd) => {
      const d = deptMap.get(cd.name);
      cd.defaultLeads.forEach((dlName) => {
        if (!isPersonAlreadyPresent(d, dlName)) {
          d.leads.push({
            name: dlName,
            slug: slugify(dlName),
            role: "Lead",
            photo: "",
            member: null,
            isLead: true,
            isDeputy: false,
          });
        }
      });
      cd.defaultDeputies.forEach((ddName) => {
        if (!isPersonAlreadyPresent(d, ddName)) {
          d.deputies.push({
            name: ddName,
            slug: slugify(ddName),
            role: "Deputy Lead",
            photo: "",
            member: null,
            isLead: false,
            isDeputy: true,
          });
        }
      });
      cd.defaultMembers.forEach((dmName) => {
        if (!isPersonAlreadyPresent(d, dmName)) {
          d.members.push({
            name: dmName,
            slug: slugify(dmName),
            role: "Member",
            photo: "",
            member: null,
            isLead: false,
            isDeputy: false,
          });
        }
      });
    });

    return Array.from(deptMap.values());
  }, [dbMembers]);

  // Compute stats dynamically
  const totalDepartments = departmentsData.length;
  const totalLeads = departmentsData.reduce((acc, d) => acc + d.leads.length, 0);
  const totalDeputies = departmentsData.reduce((acc, d) => acc + d.deputies.length, 0);
  const totalGeneralMembers = departmentsData.reduce((acc, d) => acc + d.members.length, 0);
  const totalTeamMembers = totalLeads + totalDeputies + totalGeneralMembers + leadershipData.length;

  // Filter Leadership
  const filteredLeaders = leadershipData.filter((l) => {
    if (activeDept !== "all") return false;
    if (!q) return true;
    return l.name.toLowerCase().includes(q) || l.tag.toLowerCase().includes(q);
  });

  // Filter Departments
  const filteredDepts = departmentsData.map((d, index) => {
    const isDeptSelected = activeDept === "all" || activeDept === String(d.name) || activeDept === String(index);
    if (!isDeptSelected) return null;

    const matchesDept = !q || d.name.toLowerCase().includes(q);
    const matchedLeads = d.leads.filter((item) => !q || matchesDept || item.name.toLowerCase().includes(q) || item.role.toLowerCase().includes(q));
    const matchedDeps = d.deputies.filter((item) => !q || matchesDept || item.name.toLowerCase().includes(q) || item.role.toLowerCase().includes(q));
    const matchedMems = d.members.filter((item) => !q || matchesDept || item.name.toLowerCase().includes(q) || item.role.toLowerCase().includes(q));

    if (q && !matchesDept && matchedLeads.length === 0 && matchedDeps.length === 0 && matchedMems.length === 0) {
      return null;
    }

    return {
      ...d,
      displayLeads: matchedLeads,
      displayDeputies: matchedDeps,
      displayMembers: matchedMems,
    };
  }).filter(Boolean);

  return (
    <div style={{ marginTop: "1.8rem" }}>
      {/* Hidden file input for direct photo uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleAdminPhotoUpload}
      />

      {/* Admin Quick Action Banner */}
      {isAdmin && (
        <div className="team-admin-bar">
          <span className="team-admin-badge mono">&#9679; Admin Mode Active</span>
          <button
            type="button"
            className="btn btn-fill mono"
            onClick={handleOpenAddModal}
            style={{ padding: "8px 18px", fontSize: "12px" }}
          >
            + Add Team Member
          </button>
        </div>
      )}

      {/* Dynamic Stats Counter Grid */}
      <div className="team-stats">
        <div className="team-stat">
          <b>{totalDepartments}</b>
          <span className="mono">Departments</span>
        </div>
        <div className="team-stat">
          <b>{totalTeamMembers}</b>
          <span className="mono">Team Members</span>
        </div>
        <div className="team-stat">
          <b>{totalLeads}</b>
          <span className="mono">Department Leads</span>
        </div>
        <div className="team-stat">
          <b>{totalDeputies}</b>
          <span className="mono">Deputy Leads</span>
        </div>
      </div>

      {/* Search & Filter Chips */}
      <div className="team-tools">
        <label className="team-search">
          <svg viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
          <input
            type="search"
            placeholder="Search a name or department"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search the team"
          />
        </label>
        <div className="team-chips" role="tablist">
          <button
            type="button"
            className={`team-chip ${activeDept === "all" ? "on" : ""}`}
            onClick={() => setActiveDept("all")}
          >
            All
          </button>
          {departmentsData.map((d, i) => (
            <button
              key={d.name}
              type="button"
              className={`team-chip ${activeDept === String(i) || activeDept === d.name ? "on" : ""}`}
              onClick={() => setActiveDept(String(i))}
            >
              {d.name}
            </button>
          ))}
        </div>
      </div>

      {/* Leadership Section */}
      {filteredLeaders.length > 0 && (
        <div style={{ marginTop: "1.8rem" }}>
          <div className="team-sub mono">Leadership</div>
          <div className="team-lead-grid">
            {filteredLeaders.map((leader) => {
              const s = leader.slug;
              const photo = leader.photo;
              return (
                <div key={leader.name} className="lead-card">
                  <div className="lead-top">
                    <div className="lead-avatar-wrap">
                      <Link to={`/${s}`} className="lead-card-link" aria-label={leader.name}>
                        <div className="avatar lg">
                          {photo ? (
                            <img src={photo} alt={leader.name} className="avatar-img" />
                          ) : (
                            getInitials(leader.name)
                          )}
                        </div>
                      </Link>
                      {isAdmin && leader.member && (
                        <button
                          type="button"
                          className="member-upload-trigger"
                          title={`Upload photo for ${leader.name}`}
                          onClick={() => {
                            setTargetMember(leader.member);
                            fileInputRef.current?.click();
                          }}
                        >
                          {uploadingId === leader.member._id ? "…" : "📷"}
                        </button>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div className="team-tag mono">{leader.tag}</div>
                          <Link to={`/${s}`} className="lead-name">
                            {leader.name}
                          </Link>
                        </div>
                        {isAdmin && (
                          <div className="member-admin-actions">
                            <button
                              type="button"
                              className="member-action-btn"
                              title="Edit Member"
                              onClick={() => handleOpenEditModal(leader.member, leader)}
                            >
                              ✏️
                            </button>
                            {leader.member && (
                              <button
                                type="button"
                                className="member-action-btn del"
                                title="Delete Member"
                                onClick={() => handleDeleteMember(leader.member)}
                              >
                                🗑️
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <ul className="team-list">
                    {leader.roles.map((role, idx) => (
                      <li key={idx}>{role}</li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Departments Section */}
      {filteredDepts.length > 0 && (
        <div style={{ marginTop: "2rem" }}>
          <div className="team-sub mono">Departments</div>
          <div className="team-dept-grid">
            {filteredDepts.map((d) => {
              const totalInDept = d.displayLeads.length + d.displayDeputies.length + d.displayMembers.length;
              const isRoleOpen = !!openRoles[d.name];
              return (
                <article key={d.name} className="dept-card">
                  <div className="dept-head">
                    <div className="dept-ico">
                      <svg viewBox="0 0 24 24">{ICONS[d.icon] || ICONS.award}</svg>
                    </div>
                    <div className="dh-t">
                      <div className="dept-num mono">DEPT {String(d.index + 1).padStart(2, "0")}</div>
                      <h4>{d.name}</h4>
                    </div>
                    <div className="dept-count mono">
                      {totalInDept} {totalInDept === 1 ? "member" : "members"}
                    </div>
                  </div>

                  <div className="member-col">
                    {/* Department Leads */}
                    {d.displayLeads.map((item) => (
                      <div key={item.name} className="member-row-wrap">
                        <Link to={`/${item.slug}`} className="member-row is-lead">
                          <div className="avatar sm">
                            {item.photo ? (
                              <img src={item.photo} alt={item.name} className="avatar-img" />
                            ) : (
                              getInitials(item.name)
                            )}
                          </div>
                          <span>
                            <span className="nm">{item.name}</span>
                            <span className="rl mono">Lead</span>
                          </span>
                        </Link>
                        {isAdmin && (
                          <div className="member-admin-actions">
                            <button
                              type="button"
                              className="member-upload-trigger"
                              style={{ position: "static", width: "20px", height: "20px", fontSize: "9px" }}
                              title={`Upload photo for ${item.name}`}
                              onClick={() => {
                                setTargetMember(item.member || item);
                                fileInputRef.current?.click();
                              }}
                            >
                              {uploadingId === (item.member?._id || item.slug) ? "…" : "📷"}
                            </button>
                            <button
                              type="button"
                              className="member-action-btn"
                              title="Edit Member"
                              onClick={() => handleOpenEditModal(item.member, { ...item, team: d.name })}
                            >
                              ✏️
                            </button>
                            {item.member && (
                              <button
                                type="button"
                                className="member-action-btn del"
                                title="Delete Member"
                                onClick={() => handleDeleteMember(item.member)}
                              >
                                🗑️
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Deputy Leads */}
                    {d.displayDeputies.map((item) => (
                      <div key={item.name} className="member-row-wrap">
                        <Link to={`/${item.slug}`} className="member-row is-lead">
                          <div className="avatar sm">
                            {item.photo ? (
                              <img src={item.photo} alt={item.name} className="avatar-img" />
                            ) : (
                              getInitials(item.name)
                            )}
                          </div>
                          <span>
                            <span className="nm">{item.name}</span>
                            <span className="rl mono">Deputy Lead</span>
                          </span>
                        </Link>
                        {isAdmin && (
                          <div className="member-admin-actions">
                            <button
                              type="button"
                              className="member-upload-trigger"
                              style={{ position: "static", width: "20px", height: "20px", fontSize: "9px" }}
                              title={`Upload photo for ${item.name}`}
                              onClick={() => {
                                setTargetMember(item.member || item);
                                fileInputRef.current?.click();
                              }}
                            >
                              {uploadingId === (item.member?._id || item.slug) ? "…" : "📷"}
                            </button>
                            <button
                              type="button"
                              className="member-action-btn"
                              title="Edit Member"
                              onClick={() => handleOpenEditModal(item.member, { ...item, team: d.name })}
                            >
                              ✏️
                            </button>
                            {item.member && (
                              <button
                                type="button"
                                className="member-action-btn del"
                                title="Delete Member"
                                onClick={() => handleDeleteMember(item.member)}
                              >
                                🗑️
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Members */}
                    {d.displayMembers.map((item) => (
                      <div key={item.name} className="member-row-wrap">
                        <Link to={`/${item.slug}`} className="member-row">
                          <div className="avatar sm">
                            {item.photo ? (
                              <img src={item.photo} alt={item.name} className="avatar-img" />
                            ) : (
                              getInitials(item.name)
                            )}
                          </div>
                          <span>
                            <span className="nm">{item.name}</span>
                            <span className="rl mono">{item.role || "Member"}</span>
                          </span>
                        </Link>
                        {isAdmin && (
                          <div className="member-admin-actions">
                            <button
                              type="button"
                              className="member-upload-trigger"
                              style={{ position: "static", width: "20px", height: "20px", fontSize: "9px" }}
                              title={`Upload photo for ${item.name}`}
                              onClick={() => {
                                setTargetMember(item.member || item);
                                fileInputRef.current?.click();
                              }}
                            >
                              {uploadingId === (item.member?._id || item.slug) ? "…" : "📷"}
                            </button>
                            <button
                              type="button"
                              className="member-action-btn"
                              title="Edit Member"
                              onClick={() => handleOpenEditModal(item.member, { ...item, team: d.name })}
                            >
                              ✏️
                            </button>
                            {item.member && (
                              <button
                                type="button"
                                className="member-action-btn del"
                                title="Delete Member"
                                onClick={() => handleDeleteMember(item.member)}
                              >
                                🗑️
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Responsibilities Accordion */}
                  {d.roles && d.roles.length > 0 && (
                    <div className="roles-wrap">
                      <button
                        type="button"
                        className={`roles-toggle ${isRoleOpen ? "open" : ""}`}
                        onClick={() => toggleRole(d.name)}
                        aria-expanded={isRoleOpen}
                      >
                        <span>Responsibilities</span>
                        <i>+</i>
                      </button>
                      {isRoleOpen && (
                        <ul className="team-list" style={{ marginTop: "10px" }}>
                          {d.roles.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      )}

      {/* Faculty Coordinators Section */}
      {faculty.length > 0 && activeDept === "all" && !q && (
        <div style={{ marginTop: "2.4rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <div className="team-sub mono">Faculty Coordinators</div>
            {isAdmin && (
              <button
                type="button"
                className="btn btn-ghost mono"
                style={{ fontSize: "11px", padding: "4px 12px", border: "1px solid rgba(var(--red-rgb), 0.4)", color: "#fff" }}
                onClick={() => {
                  setEditorCategory("faculty");
                  setEditingMember({
                    name: "",
                    slug: "",
                    role: "Faculty Coordinator",
                    team: "Faculty Coordination",
                    description: "Faculty Coordinator for TEDx BIET.",
                    image: "",
                  });
                  setEditorMode("create");
                  setEditorError("");
                  setEditorOpen(true);
                }}
              >
                + Add Faculty
              </button>
            )}
          </div>
          <div className="faculty-grid">
            {faculty.map((f) => {
              const facSlug = f.slug || (f.name ? f.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : '');
              return (
                <div key={f._id || f.name} className="faculty-card-wrap" style={{ position: "relative" }}>
                  <Link to={`/${facSlug}`} className="faculty-card glass-card" style={{ textDecoration: "none", color: "inherit", display: "block" }}>
                  <div className="faculty-top">
                    <div className="avatar lg">
                      {f.image ? (
                        <img src={f.image} alt={f.name} className="avatar-img" />
                      ) : (
                        getInitials(f.name)
                      )}
                    </div>
                    <div>
                      <div className="team-tag mono">{f.role || "Faculty Coordinator"}</div>
                      <h4 className="faculty-name">{f.name}</h4>
                      <p className="faculty-desc">{f.description}</p>
                    </div>
                  </div>
                </Link>
                {isAdmin && (
                  <div className="member-admin-actions" style={{ position: "absolute", top: "12px", right: "12px" }}>
                    <button
                      type="button"
                      className="member-upload-trigger"
                      style={{ position: "static", width: "26px", height: "26px", fontSize: "11px" }}
                      title={`Upload photo for ${f.name}`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setTargetMember(f);
                        fileInputRef.current?.click();
                      }}
                    >
                      {uploadingId === (f._id || f.slug) ? "…" : "📷"}
                    </button>
                    <button
                      type="button"
                      className="member-action-btn"
                      style={{ width: "26px", height: "26px", fontSize: "11px" }}
                      title="Edit Faculty Coordinator"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleOpenEditModal(f, f, "faculty");
                      }}
                    >
                      ✏️
                    </button>
                    {f._id && (
                      <button
                        type="button"
                        className="member-action-btn del"
                        style={{ width: "26px", height: "26px", fontSize: "11px" }}
                        title="Delete Faculty Coordinator"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDeleteFaculty(f);
                        }}
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          </div>
        </div>
      )}

      {filteredLeaders.length === 0 && filteredDepts.length === 0 && (
        <div style={{ textAlign: "center", color: "var(--grey)", padding: "2.4rem 0" }}>
          No one matches that search — try a different name or department.
        </div>
      )}

      {/* Admin Member Editor Modal */}
      <MemberEditor
        open={editorOpen}
        mode={editorMode}
        category={editorCategory}
        initialMember={editingMember}
        saving={saving}
        error={editorError}
        onClose={() => {
          setEditorOpen(false);
          setEditingMember(null);
        }}
        onSave={handleSaveMember}
      />
    </div>
  );
}

export default function Home() {
  const { isAdmin, token } = useAdminAuth();
  useEffect(() => { document.title = "TEDx BIET | Ideas Worth Spreading"; }, []);

  const [eventSettings, setEventSettings] = useState({
    eventDate: "2026-10-05T09:00:00+05:30",
    eventDateLabel: "5 October 2026",
    eventTimeLabel: "09:00 AM IST",
  });

  useEffect(() => {
    getSiteSettings()
      .then((data) => {
        if (data && data.eventDate) {
          setEventSettings({
            eventDate: data.eventDate,
            eventDateLabel: data.eventDateLabel || "5 October 2026",
            eventTimeLabel: data.eventTimeLabel || "09:00 AM IST",
          });
        }
      })
      .catch(() => {});

    const handleUpdated = (e) => {
      const data = e.detail;
      if (data && data.eventDate) {
        setEventSettings({
          eventDate: data.eventDate,
          eventDateLabel: data.eventDateLabel || "5 October 2026",
          eventTimeLabel: data.eventTimeLabel || "09:00 AM IST",
        });
      }
    };
    window.addEventListener("event-time-updated", handleUpdated);
    return () => window.removeEventListener("event-time-updated", handleUpdated);
  }, []);

  const targetTimestamp = useMemo(() => {
    const t = new Date(eventSettings.eventDate).getTime();
    return isNaN(t) ? TARGET : t;
  }, [eventSettings.eventDate]);

  const { d, h, m, s } = useCountdown(targetTimestamp);

  const [speakers, setSpeakers] = useState([
    { _id: "default-1", name: "Ajay Kumar", note: "Soulfulvolgs", role: "Inauguration guest", topic: "Creative Storytelling & Digital Journey", image: "" },
    { _id: "default-2", name: "Hari Pavan", note: "HR", role: "Inauguration guest", topic: "Human Potential & Organizational Leadership", image: "" },
  ]);

  useEffect(() => {
    getSpeakers()
      .then((res) => {
        if (Array.isArray(res) && res.length > 0) {
          setSpeakers(res);
        }
      })
      .catch(() => {});
  }, []);

  const [speakerModalOpen, setSpeakerModalOpen] = useState(false);
  const [speakerModalMode, setSpeakerModalMode] = useState("create");
  const [editingSpeaker, setEditingSpeaker] = useState(null);
  const [savingSpeaker, setSavingSpeaker] = useState(false);
  const [speakerModalError, setSpeakerModalError] = useState("");

  const handleSpeakerPhotoUpload = async (speaker, file) => {
    try {
      const speakerId = speaker._id || speaker.slug || speaker.name;
      const updated = await updateAdminSpeaker(token, speakerId, {
        name: speaker.name,
        slug: speaker.slug,
        role: speaker.role,
        note: speaker.note,
        topic: speaker.topic,
        image: file,
      });
      setSpeakers((prev) =>
        prev.map((s) =>
          (s._id && updated._id && s._id === updated._id) ||
          s._id === speaker._id ||
          s.name === speaker.name
            ? { ...s, ...updated }
            : s
        )
      );
      showToast("Speaker photo updated!");
    } catch (err) {
      showToast(err.data?.message || err.message || "Failed to update speaker photo.");
    }
  };

  const handleOpenAddSpeaker = () => {
    setEditingSpeaker({
      name: "",
      role: "Inauguration guest",
      note: "",
      topic: "",
      order: speakers.length + 1,
      image: "",
    });
    setSpeakerModalMode("create");
    setSpeakerModalError("");
    setSpeakerModalOpen(true);
  };

  const handleOpenEditSpeaker = (speaker) => {
    setEditingSpeaker(speaker);
    setSpeakerModalMode("edit");
    setSpeakerModalError("");
    setSpeakerModalOpen(true);
  };

  const handleSaveSpeaker = async (speakerData) => {
    setSavingSpeaker(true);
    setSpeakerModalError("");
    try {
      if (speakerModalMode === "create") {
        const created = await createAdminSpeaker(token, speakerData);
        setSpeakers((prev) => [...prev, created]);
        showToast(`Added ${created.name} to speakers!`);
      } else if (editingSpeaker) {
        const speakerId = editingSpeaker._id || editingSpeaker.slug || editingSpeaker.name;
        const updated = await updateAdminSpeaker(token, speakerId, speakerData);
        setSpeakers((prev) =>
          prev.map((s) =>
            (s._id && updated._id && s._id === updated._id) ||
            s._id === editingSpeaker._id ||
            s.name === editingSpeaker.name
              ? { ...s, ...updated }
              : s
          )
        );
        showToast(`Updated ${updated.name}!`);
      }
      setSpeakerModalOpen(false);
      setEditingSpeaker(null);
    } catch (err) {
      setSpeakerModalError(err.data?.message || err.message || "Failed to save speaker.");
    } finally {
      setSavingSpeaker(false);
    }
  };

  const handleDeleteSpeaker = async (speaker) => {
    const speakerId = speaker._id || speaker.slug || speaker.name;
    try {
      await deleteAdminSpeaker(token, speakerId);
      setSpeakers((prev) =>
        prev.filter((s) => s._id !== speaker._id && s.name !== speaker.name)
      );
      showToast(`Removed speaker ${speaker.name}`);
    } catch (err) {
      showToast(err.data?.message || err.message || "Failed to remove speaker.");
    }
  };

  const [sparkIdx, setSparkIdx] = useState(0);
  const [sparkVisible, setSparkVisible] = useState(true);
  const [sparkCount, setSparkCount] = useState(1);
  const usedSparks = useRef([0]);
  const nextSpark = useCallback(() => {
    if (usedSparks.current.length >= SPARKS.length) usedSparks.current = [];
    let idx;
    do { idx = Math.floor(Math.random() * SPARKS.length); } while (usedSparks.current.includes(idx));
    usedSparks.current.push(idx);
    return idx;
  }, []);
  const handleSpark = () => {
    setSparkVisible(false);
    setTimeout(() => { setSparkIdx(nextSpark()); setSparkVisible(true); setSparkCount(c=>c+1); }, 220);
  };
  const handleCopySpark = () => { navigator.clipboard?.writeText(SPARKS[sparkIdx]).then(() => showToast("Spark copied to clipboard.")).catch(()=>{}); };

  const [toast, setToast] = useState({ msg:"", show:false });
  const toastTimer = useRef(null);
  const showToast = useCallback((msg) => {
    setToast({ msg, show:true });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(t=>({...t,show:false})), 2800);
  }, []);

  const [notifyEmail, setNotifyEmail] = useState("");
  const [notifyErr, setNotifyErr] = useState(false);
  const handleNotify = () => {
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(notifyEmail.trim());
    if (!valid) { setNotifyErr(true); setTimeout(()=>setNotifyErr(false),400); showToast("That doesn't look like a valid email."); return; }
    setNotifyEmail(""); showToast("You're on the list — we'll signal you at launch.");
  };

  const [openFaq, setOpenFaq] = useState(null);
  const faqRefs = useRef([]);
  const toggleFaq = (i) => setOpenFaq(prev => prev===i ? null : i);

  const handleWish = () => {
    const msgs = ["Wish sent through the crack.","One idea, pressed into the glass.","Fracture logged. Wish in transit.","The pane holds it now."];
    showToast(msgs[Math.floor(Math.random()*msgs.length)]);
  };
  const pageUrl = typeof window!=="undefined" ? window.location.href : "";
  const shareMsg = "TEDxBIET is coming — ideas worth spreading, live at Bharat Institute of Engineering and Technology.";
  const handleShareCopy = () => { navigator.clipboard?.writeText(pageUrl).then(()=>showToast("Link copied to clipboard.")).catch(()=>{}); };

  return (
    <>
      <section className="hero-section" id="hero">
        <div className="hero-eyebrow mono">Bharat Institute of Engineering &amp; Technology &mdash; Ibrahimpatnam</div>
        <h1 className="hero-title">TED<span className="hero-x">x</span>BIET<span className="glitch-layer g1" aria-hidden="true">TEDxBIET</span><span className="glitch-layer g2" aria-hidden="true">TEDxBIET</span></h1>
        <div className="hero-sub mono">x = independently organized TED event</div>
        <div className="hero-tagline">Ideas worth spreading.</div>
        <div className="hero-cta">
          <a href="#contact" className="btn btn-fill">Get Your Ticket</a>
          <a href="#about" className="btn btn-line">Explore The Event</a>
          <button type="button" className="btn btn-wish mono" onClick={handleWish}>&#10022; Make A Wish</button>
        </div>
        <div className="scroll-cue"><span className="mono">Scroll</span><div className="scroll-line" /></div>
        <div className="coord mono" id="coord">
          STRAIN 0000.0<br />FACET ORIGIN<br />STRESS 0.0
        </div>
      </section>

      <section className="tx-section" id="about">
        <RevealCard>
          <div className="eyebrow-tag mono">01 &mdash; About the event</div>
          <h2 className="section-h2">ABOUT TED<span className="h-x">x</span></h2>
          <p className="section-p">TEDxBIET is an independently organized TED event, held under license, bringing the global spirit of TED to the campus of Bharat Institute of Engineering and Technology in Ibrahimpatnam, Hyderabad.</p>
          <p className="section-p" style={{marginTop:"1rem"}}>For one day, students, faculty, researchers, and outside voices share a single stage — each with one idea they believe is worth spreading, told the way only they can tell it.</p>
          <div className="stat-grid">
            <div className="stat"><div className="num">1</div><div className="lbl mono">Day of talks</div></div>
            <div className="stat"><div className="num">x</div><div className="lbl mono">Independently organized</div></div>
            <div className="stat"><div className="num">&infin;</div><div className="lbl mono">Ideas worth spreading</div></div>
            <div className="stat"><div className="num">BIET</div><div className="lbl mono">Ibrahimpatnam, HYD</div></div>
          </div>
        </RevealCard>
      </section>

      <section className="tx-section" id="why">
        <RevealCard>
          <div className="eyebrow-tag mono">02 &mdash; The idea behind the idea</div>
          <h2 className="section-h2">WHY TED<span className="h-x">x</span>?</h2>
          <p className="section-p">TED, which stands for Technology, Entertainment, and Design, is a platform for infinite ideas. As an international nonprofit organization, TED thrives on creativity, embracing diverse perspectives, and giving a voice to every idea — big or small.</p>
          <p className="section-p" style={{marginTop:"1rem"}}>TEDx provides a stage for speakers of all styles, backgrounds, and languages, encouraging them to share insights ranging from groundbreaking business innovations to deeply personal life experiences.</p>
        </RevealCard>
      </section>

      <section className="tx-section" id="countdown">
        <RevealCard className="countdown-card">
          <div className="eyebrow-tag mono" style={{justifyContent:"center"}}>03 &mdash; Fracture clock</div>
          <h2 className="section-h2 center">COUNTDOWN TO THE BREAK</h2>
          <div className="countdown-status mono"><b>PANE STABLE</b> &middot; COUNTING DOWN</div>
          <OrbitClock days={d} hours={h} mins={m} secs={s} />
          <div className="orbit-legend mono">
            <div className="orbit-legend-item"><span className="ol-num days-color">{pad(d)}</span><span className="ol-lbl">Days</span></div>
            <div className="orbit-legend-item"><span className="ol-num">{pad(h)}</span><span className="ol-lbl">Hours</span></div>
            <div className="orbit-legend-item"><span className="ol-num mins-color">{pad(m)}</span><span className="ol-lbl">Minutes</span></div>
            <div className="orbit-legend-item"><span className="ol-num secs-color">{pad(s)}</span><span className="ol-lbl">Seconds</span></div>
          </div>
          <div className="countdown-note">Each ring is a crack radiating outward — <b>outer for days, inner for seconds</b> — and the dot marks how far that crack has traveled. The inauguration lands on <b>{eventSettings.eventDateLabel} ({eventSettings.eventTimeLabel})</b>.</div>
          <div className="notify-row">
            <input type="email" className={`notify-input mono ${notifyErr?"err":""}`} placeholder="you@email.com" value={notifyEmail} onChange={e=>setNotifyEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleNotify()} aria-label="Email for launch notification" />
            <button type="button" className="btn btn-fill" onClick={handleNotify}>Notify Me At Launch</button>
          </div>
        </RevealCard>
      </section>

      <section className="tx-section" id="speakers">
        <RevealCard>
          <div className="speakers-section-head">
            <div>
              <div className="eyebrow-tag mono">04 &mdash; Speakers &amp; ideas</div>
              <h2 className="section-h2">SPEAKERS &amp; <span className="h-x">x</span> IDEAS</h2>
            </div>
            {isAdmin && (
              <button
                type="button"
                className="btn btn-fill add-speaker-btn"
                onClick={handleOpenAddSpeaker}
              >
                + Add Speaker
              </button>
            )}
          </div>
          <p className="section-p">The lineup is taking shape. Our first confirmed guests join us for the inauguration on <b>5 October 2026</b>; each speaker will bring one idea, told in one voice, on one stage.</p>
          <div className="speaker-grid">
            {speakers.map((sp, i) => (
              <SpeakerCard
                key={sp._id || sp.name}
                speaker={sp}
                idx={i}
                isAdmin={isAdmin}
                onUploadPhoto={handleSpeakerPhotoUpload}
                onEditSpeaker={handleOpenEditSpeaker}
                onDeleteSpeaker={handleDeleteSpeaker}
              />
            ))}
          </div>
          <div className="share-row"><button type="button" className="share-btn mono" onClick={()=>window.location.href="mailto:tedx@biet.ac.in?subject=Speaker%20Nomination%20%E2%80%94%20TEDxBIET"}>&#9733; Nominate A Speaker</button></div>
        </RevealCard>
      </section>

      <section className="tx-section" id="team" style={{minHeight:"auto",paddingTop:"8vh",paddingBottom:"8vh"}}>
        <RevealCard style={{maxWidth:"1120px",width:"100%"}}>
          <div className="eyebrow-tag mono">05 &mdash; The organizing team</div>
          <h2 className="section-h2">TEAM &amp; <span className="h-x">x</span> ROLES</h2>
          <p className="section-p">Every department, every lead, and every responsibility behind TEDxBIET 2026. Hover over a name to preview who is behind it &mdash; click for the full profile.</p>
          <TeamOrganizingSection isAdmin={isAdmin} token={token} onShowToast={showToast} />
        </RevealCard>
      </section>

      <section className="tx-section spark-section" id="spark">
        <RevealCard>
          <div className="eyebrow-tag mono" style={{justifyContent:"center"}}>06 &mdash; A small idea, right now</div>
          <h2 className="section-h2 center">IDEA SPARK</h2>
          <p className="section-p center">Every talk starts as a single, unreasonable question. Press the button — get one to sit with.</p>
          <div className="spark-display">
            <span className="quote-mark" aria-hidden="true">&ldquo;</span>
            <p className={sparkVisible?"show":""}>{SPARKS[sparkIdx]}</p>
          </div>
          <div className="spark-actions">
            <button type="button" className="btn btn-fill" onClick={handleSpark}>Generate A Spark</button>
            <button type="button" className="btn btn-line mono" onClick={handleCopySpark}>Copy</button>
          </div>
          <div className="spark-count mono">SPARK {sparkCount} OF MANY</div>
        </RevealCard>
      </section>

      <section className="tx-section" id="faq">
        <RevealCard>
          <div className="eyebrow-tag mono">07 &mdash; Questions from mission control</div>
          <h2 className="section-h2">FAQ</h2>
          <div className="faq-list">
            {FAQS.map((item,i) => (
              <div key={i} className={`faq-item ${openFaq===i?"open":""}`}>
                <button className="faq-q" onClick={()=>toggleFaq(i)} aria-expanded={openFaq===i}><span>{item.q}</span><span className="faq-plus" aria-hidden="true" /></button>
                <div className="faq-a" ref={el=>(faqRefs.current[i]=el)} style={{maxHeight:openFaq===i?(faqRefs.current[i]?.scrollHeight||300)+"px":"0px"}}><p>{item.a}</p></div>
              </div>
            ))}
          </div>
        </RevealCard>
      </section>

      <section className="tx-section" id="details">
        <RevealCard className="details-card">
          <div className="eyebrow-tag mono">08 &mdash; Event details</div>
          <div className="details-grid">
            <div className="details-item"><div className="d-lbl mono">Date</div><div className="d-val">5 October 2026</div></div>
            <div className="details-item"><div className="d-lbl mono">Venue</div><div className="d-val">BIET Campus, Ibrahimpatnam</div></div>
            <div className="details-item"><div className="d-lbl mono">Format</div><div className="d-val">In-Person</div></div>
            <div className="details-item"><div className="d-lbl mono">Theme</div><div className="d-val">Ideas Worth Spreading</div></div>
          </div>
          <div className="share-row">
            <button type="button" className="share-btn mono" onClick={handleShareCopy}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M10 13a5 5 0 0 0 7.5.4l2-2a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7.5-.4l-2 2a5 5 0 0 0 7 7l1-1"/></svg>Copy Link</button>
            <a className="share-btn mono" href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMsg)}&url=${encodeURIComponent(pageUrl)}`} target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 2H22l-7.6 8.7L23.3 22H16.9l-5-6.5L6 22H2.9l8.1-9.3L1 2h6.6l4.5 6z"/></svg>Share on X</a>
            <a className="share-btn mono" href={`https://wa.me/?text=${encodeURIComponent(shareMsg+" "+pageUrl)}`} target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2zm0 18.2a8.1 8.1 0 0 1-4.2-1.2l-.3-.2-3.1.8.8-3-.2-.3A8.2 8.2 0 1 1 12 20.2z"/></svg>WhatsApp</a>
          </div>
        </RevealCard>
      </section>

      <footer id="contact" className="site-footer">
        <RevealCard style={{maxWidth:"980px",width:"100%"}}>
          <div className="eyebrow-tag mono">09 &mdash; Contact</div>
          <div className="footer-grid">
            <div>
              <div className="footer-col-title mono">Contact Info</div>
              <div className="contact-row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.6"/></svg><span>Bharat Institute of Engineering and Technology,<br/>Ibrahimpatnam, Hyderabad</span></div>
              <div className="contact-row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .3 2 .6 3a2 2 0 0 1-.5 2L8 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2-.5c1 .3 2 .5 3 .6a2 2 0 0 1 1.7 2z"/></svg><span>+91 00000 00000</span></div>
              <div className="contact-row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 6 12 13 2 6"/><path d="M2 6h20v12H2z"/></svg><span>tedx@biet.ac.in</span></div>
            </div>
            <div>
              <div className="footer-col-title mono">Quick Links</div>
              <ul className="footer-links-list"><li><a href="#about">About</a></li><li><a href="#why">Why TEDx</a></li><li><a href="#countdown">Countdown</a></li><li><a href="#speakers">Speakers</a></li><li><a href="#team">Team</a></li><li><a href="#faq">FAQ</a></li></ul>
            </div>
            <div>
              <div className="footer-col-title mono">Find Us</div>
              <CampusMap />
            </div>
          </div>
        </RevealCard>
        <div className="footer-bottom mono">
          <span>&copy; 2026 TED<span className="footer-x">x</span>BIET &mdash; Ibrahimpatnam, Hyderabad. Operated under license from TED.</span>
        </div>
      </footer>

      {isAdmin && (
        <SpeakerEditor
          open={speakerModalOpen}
          mode={speakerModalMode}
          initialSpeaker={editingSpeaker}
          saving={savingSpeaker}
          error={speakerModalError}
          onClose={() => {
            setSpeakerModalOpen(false);
            setEditingSpeaker(null);
          }}
          onSave={handleSaveSpeaker}
        />
      )}

      <div id="toast" className={`mono ${toast.show?"show":""}`}><span className="dot" /><span>{toast.msg}</span></div>
    </>
  );
}
