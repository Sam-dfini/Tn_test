import React from 'react';

/**
 * TUNISIA INTEL v2.0 - COMPLETE SYSTEM BRANCH ICON SET (34 ICONS)
 * Standardized for 1.5px stroke, unified technical aesthetic.
 */

interface IntelIconSetProps extends React.SVGProps<SVGSVGElement> {
  name: string;
  color?: string;
  isActive?: boolean;
  size?: number;
}

const IntelIconSet: React.FC<IntelIconSetProps> = ({ name, color = "#606060", isActive = false, size = 22, ...props }) => {
  const strokeColor = isActive ? "#00D1FF" : color;
  const glow = isActive ? "drop-shadow(0 0 4px #00D1FF)" : "none";

  const icons: Record<string, React.ReactNode> = {
    // --- 1. COMMAND CENTER ---
    dashboard: <path d="M3 3h7v7H3z M14 3h7v7h-7z M14 14h7v7h-7z M3 14h7v7H3z" />,
    calendar: <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />,
    agent: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z M12 8v4M12 16h.01" />,
    methodology: <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />,

    // --- 2. ECONOMICAL ---
    investment: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M7 12h2l2-4 2 8 2-4h2" /></>,
    economy: <path d="M3 17l6-6 4 4 8-8 M21 13V7h-6" />,
    industry: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.2 2.2M16.9 16.9l2.2 2.2M4.9 19.1l2.2-2.2M16.9 7.1l2.2 2.2" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /><circle cx="5" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
    energy_strat: <><circle cx="12" cy="12" r="9" /><path d="M13 7l-4 6h4l-1 4 4-6h-4l1-4z" /></>,
    black_market: <path d="M4 4v16h16 M4 16l4-4 4 4 5-8 3 3" />,
    explorer: <path d="M12 22a10 10 0 100-20 10 10 0 000 20z M15 9l-6 6 M9 9l6 6" />,
    entrepreneur: <path d="M12 2l10 6.5V15.5L12 22l-10-6.5V8.5L12 2z M12 22V12 M12 12l10-6.5 M12 12L2 5.5" />,

    // --- 3. THREAT & SECURITY ---
    events: <path d="M3 12h3l3-9 4 18 3-9h5" />,
    security: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z M12 11a1 1 0 100-2 1 1 0 000 2z" />,
    clusters: <><path d="M12 3l8 14H4L12 3z" /><circle cx="12" cy="9" r="2" /><circle cx="8" cy="15" r="2" /><circle cx="16" cy="15" r="2" /></>,
    actor: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="10" r="3" /><path d="M7 18c0-3 2-5 5-5s5 2 5 5" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2" /></>,
    radicalisation: <><circle cx="12" cy="12" r="9" /><path d="M12 3v18M3 12h18" /><circle cx="12" cy="12" r="3" /></>,
    radicalisation_alt: <path d="M12 22V12M12 12l-6-6M12 12l6-6" />,
    cognitive: <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0 M9 12h6l-3-3 3 3-3 3" />,

    // --- 4. SOCIO-POLITICAL ---
    political: <path d="M7 2a2 2 0 012 2v1h6V4a2 2 0 114 0v1h1a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h1V4a2 2 0 011-2z M3 10h18" />,
    social: <><circle cx="12" cy="7" r="4" /><path d="M5 21v-2a7 7 0 0114 0v2z" /><circle cx="12" cy="12" r="9" /></>,
    geopolitical: <><circle cx="12" cy="12" r="9" /><path d="M3.6 9h16.8M3.6 15h16.8M12 3a15.3 15.3 0 010 18M12 3a15.3 15.3 0 000 18" /></>,
    narrative: <path d="M9 21c0-5 3-9 7-9s7 4 7 9 M3 11a5 5 0 0110 0c0 4-5 9-5 9s-5-5-5-9z" />,

    // --- 5. ENVIRONMENT ---
    env_base: <><path d="M12 22V12M12 12l-4-4M12 12l4-4" /><rect x="3" y="3" width="18" height="18" rx="2" /></>,
    agriculture: <path d="M12 22V10M12 10l-4-4M12 10l4-4M8 22V14M16 22V14" />,
    feed_intel: <path d="M21 12h-4l-3 8-4-16-3 8H3" />,
    poultry: <path d="M12 5V2M15 8l3-3M9 8L6 5 M12 22c-4 0-7-3-7-7 0-4 10-12 10-12s10 8 10 12c0 4-3 7-7 7z" />,
    livestock: <path d="M3 11c0-5 4-9 9-9s9 4 9 9v6c0 2-1 4-3 4H6c-2 0-3-2-3-4v-6z M8 11h.01M16 11h.01M12 15h.01" />,
    dairy: <path d="M8 2h8l2 4v14a2 2 0 01-2 2H8a2 2 0 01-2-2V6l2-4z M6 6h12M12 11v6M10 14h4" />,
    energy: <path d="M3 21h18l-2-6h-3l-2-10-2 10H6l-2 6z M9 21v-4M15 21v-4" />,
    fire_intel: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M12 18c0 0-4-4-4-7a4 4 0 018 0c0 3-4 7-4 7z" /></>,

    // --- 6. ADVANCED MODELING ---
    strategic: <><path d="M8 4H4v16h4M16 4h4v16h-4" /><path d="M10 12h4 M12 10v4" /></>,
    simulation: <><circle cx="12" cy="12" r="3" /><circle cx="5" cy="5" r="2" /><circle cx="19" cy="5" r="2" /><circle cx="5" cy="19" r="2" /><circle cx="19" cy="19" r="2" /><path d="M7 7l3.5 3.5 M17 7l-3.5 3.5 M7 17l3.5-3.5 M17 17l-3.5-3.5" /></>,
    civilizational: <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />,
    performance: <><path d="M3 12a9 9 0 0118 0" /><path d="M12 12L16 8" /><circle cx="12" cy="12" r="2" /></>,
    ne: <><circle cx="12" cy="12" r="10" strokeDasharray="2 2" /><path d="M9 10h6l-3 4z" /></>
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={strokeColor}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ filter: glow, transition: 'all 0.2s ease' }}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {icons[name] || <circle cx="12" cy="12" r="10" strokeDasharray="4 4" />}
    </svg>
  );
};

export default IntelIconSet;
