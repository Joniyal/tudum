import React from "react";

type IconProps = React.SVGProps<SVGSVGElement> & { title?: string };

export const ClockIcon = ({ title = "Clock", ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false" {...props}>
    {title ? <title>{title}</title> : null}
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

export const BellIcon = ({ title = "Bell", ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
    {title ? <title>{title}</title> : null}
    <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h11z" />
    <path d="M13.73 21a2 2 0 01-3.46 0" />
  </svg>
);

export const UsersIcon = ({ title = "Users", ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
    {title ? <title>{title}</title> : null}
    <path d="M17 21v-2a4 4 0 00-3-3.87" />
    <path d="M9 21v-2a4 4 0 013-3.87" />
    <circle cx="9" cy="7" r="4" />
    <circle cx="17" cy="7" r="4" />
  </svg>
);

export const BriefcaseIcon = ({ title = "Work", ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
    {title ? <title>{title}</title> : null}
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
  </svg>
);

export const DumbbellIcon = ({ title = "Health", ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
    {title ? <title>{title}</title> : null}
    <path d="M2 12h2v2H2zM20 12h2v2h-2z" />
    <path d="M7 13h10" />
    <path d="M5 11v4M19 11v4" />
    <rect x="3" y="9" width="4" height="6" rx="1" />
    <rect x="17" y="9" width="4" height="6" rx="1" />
  </svg>
);

export const LotusIcon = ({ title = "Personal", ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
    {title ? <title>{title}</title> : null}
    <path d="M12 20s4-4 8-6c0 0-2-4-8-6-6 2-8 6-8 6 4 2 8 6 8 6z" />
    <path d="M12 12s2-4 6-6M12 12s-2-4-6-6" />
  </svg>
);

export const PaletteIcon = ({ title = "Creative", ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
    {title ? <title>{title}</title> : null}
    <path d="M20.84 8.53A9 9 0 1111.47 3" />
    <path d="M7 10h.01M12 7h.01M17 10h.01M12 15h.01" />
  </svg>
);

export const BookIcon = ({ title = "Learning", ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
    {title ? <title>{title}</title> : null}
    <path d="M21 4H7a2 2 0 00-2 2v12" />
    <path d="M21 4v14a2 2 0 01-2 2H7" />
  </svg>
);

export const RefreshIcon = ({ title = "Refresh", ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
    {title ? <title>{title}</title> : null}
    <path d="M20 12a8 8 0 10-15.5 3.5L3 17" />
    <path d="M3 7v4h4" />
  </svg>
);

export const SparklesIcon = ({ title = "Sparkles", ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
    {title ? <title>{title}</title> : null}
    <path d="M12 3l1.5 3L17 8l-3.5 1.5L12 13l-1.5-3L7 8l3.5-1.5L12 3z" />
    <path d="M5 20l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z" />
  </svg>
);

export const FolderIcon = ({ title = "Folder", ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
    {title ? <title>{title}</title> : null}
    <path d="M3 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
  </svg>
);

export const CheckIcon = ({ title = "Check", ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
    {title ? <title>{title}</title> : null}
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

export const StarIcon = ({ title = "Star", ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
    {title ? <title>{title}</title> : null}
    <path d="M12 2l2.9 6.26L21 9.27l-5 3.64L17.8 21 12 17.77 6.2 21 8 12.91 3 9.27l6.1-1.01L12 2z" />
  </svg>
);

export const TargetIcon = ({ title = "Target", ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
    {title ? <title>{title}</title> : null}
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

export const BrainIcon = ({ title = "Brain", ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
    {title ? <title>{title}</title> : null}
    <path d="M12 2a4 4 0 00-4 4v1H6a2 2 0 00-2 2v2a4 4 0 004 4h1v1a4 4 0 004 4h0a4 4 0 004-4v-1h1a2 2 0 002-2v-2a4 4 0 00-4-4h-2V6a4 4 0 00-4-4z" />
  </svg>
);

export const HeartIcon = ({ title = "Heart", ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
    {title ? <title>{title}</title> : null}
    <path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z" />
  </svg>
);

export const FireIcon = ({ title = "Fire", ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
    {title ? <title>{title}</title> : null}
    <path d="M8.5 14.5C7 12 8 9.5 9 8c1-1.5 0-3 0-3s2 1 3 2c1 1 3 3 3 6s-2 6-6 6c0 0 1-2 0-3z" />
  </svg>
);

export const TrashIcon = ({ title = "Trash", ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
    {title ? <title>{title}</title> : null}
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
  </svg>
);

export default {};
