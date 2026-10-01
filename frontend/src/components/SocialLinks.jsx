import './SocialLinks.css';

function LinkedInIcon() {
  return (
    <svg className="social-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22 0H2C.9 0 0 .9 0 2v20c0 1.1.9 2 2 2h20c1.1 0 2-.9 2-2V2c0-1.1-.9-2-2-2z"
      />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg className="social-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.64.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92-.06-1.27-.07-1.64-.07-4.85s.01-3.58.07-4.85C2.38 3.92 3.9 2.38 7.15 2.23 8.42 2.17 8.8 2.16 12 2.16zM12 0C8.74 0 8.33.01 7.05.07 2.7.27.27 2.69.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.2 4.36 2.62 6.78 6.98 6.98C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c4.35-.2 6.78-2.62 6.98-6.98.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95C23.73 2.7 21.31.27 16.95.07 15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.41-11.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88z"
      />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg className="social-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M23.5 6.2a3 3 0 0 0-2.12-2.12C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.58A3 3 0 0 0 .5 6.2 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.8 3 3 0 0 0 2.12 2.12C4.5 20.5 12 20.5 12 20.5s7.5 0 9.38-.58a3 3 0 0 0 2.12-2.12A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-5.8zM9.75 15.02V8.98L15.5 12l-5.75 3.02z"
      />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg className="social-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5L4 8V6l8 5 8-5v2z"
      />
    </svg>
  );
}

const ICONS = {
  linkedin: LinkedInIcon,
  instagram: InstagramIcon,
  youtube: YouTubeIcon,
  email: EmailIcon,
};

function isValidHttpUrl(value) {
  if (!value || typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  try {
    const url = new URL(trimmed);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Renders social platform rows with icon + label.
 * When href is missing/invalid, shows non-clickable text (no placeholder links).
 * Optional onEdit(item) shows an Edit control beside each row (admin footer use).
 */
function SocialLinks({
  items = [],
  className = '',
  emptyMessage = '',
  variant = 'default',
  onEdit,
}) {
  const visible = items.filter((item) => item && item.label);

  if (!visible.length) {
    return emptyMessage ? (
      <p className={`social-links-empty ${className}`.trim()}>{emptyMessage}</p>
    ) : null;
  }

  return (
    <ul className={`social-links social-links-${variant} ${className}`.trim()}>
      {visible.map((item) => {
        const Icon = ICONS[item.icon] || null;
        const content = (
          <>
            {Icon ? <Icon /> : null}
            <span>{item.label}</span>
          </>
        );

        const clickable =
          item.type === 'email'
            ? Boolean(item.href)
            : isValidHttpUrl(item.href);

        return (
          <li key={item.key || item.label} className="social-links-row">
            {clickable ? (
              <a
                href={item.type === 'email' ? `mailto:${item.href}` : item.href.trim()}
                className="social-link"
                target={item.type === 'email' ? undefined : '_blank'}
                rel={item.type === 'email' ? undefined : 'noopener noreferrer'}
              >
                {content}
              </a>
            ) : (
              <span className="social-link is-static">{content}</span>
            )}
            {typeof onEdit === 'function' && (
              <button
                type="button"
                className="social-link-edit"
                onClick={() => onEdit(item)}
                aria-label={`Edit ${item.label} link`}
              >
                Edit
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function memberSocialItems(member = {}) {
  return [
    member.linkedin
      ? { label: 'LinkedIn', icon: 'linkedin', href: member.linkedin }
      : null,
    member.instagram
      ? { label: 'Instagram', icon: 'instagram', href: member.instagram }
      : null,
    member.email
      ? { label: 'Email', icon: 'email', href: member.email, type: 'email' }
      : null,
  ].filter(Boolean);
}

export function footerSocialItems(footer = {}) {
  return [
    { key: 'instagram', label: 'Instagram', icon: 'instagram', href: footer.instagram || '' },
    { key: 'linkedin', label: 'LinkedIn', icon: 'linkedin', href: footer.linkedin || '' },
    { key: 'youtube', label: 'YouTube', icon: 'youtube', href: footer.youtube || '' },
  ];
}

export default SocialLinks;
