import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
}

/**
 * SafeAccess Logo Mark:
 * Three broken arcs (navy, green, amber) forming a ring around a small solid center dot.
 * Represents role, ward, and duty scoping converging on one protected record.
 */
export const SafeAccessLogo: React.FC<LogoProps> = ({ size = 28, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="SafeAccess Logo"
    >
      {/* Arc 1: Ink Navy - Role */}
      <circle
        cx="60"
        cy="60"
        r="42"
        fill="none"
        stroke="#14213D"
        strokeWidth="11"
        strokeDasharray="60 203"
        strokeDashoffset="0"
        strokeLinecap="round"
      />
      {/* Arc 2: Ward Green - Ward */}
      <circle
        cx="60"
        cy="60"
        r="42"
        fill="none"
        stroke="#2F6F4E"
        strokeWidth="11"
        strokeDasharray="60 203"
        strokeDashoffset="-87.8"
        strokeLinecap="round"
      />
      {/* Arc 3: Signal Amber - Duty */}
      <circle
        cx="60"
        cy="60"
        r="42"
        fill="none"
        stroke="#D98E2A"
        strokeWidth="11"
        strokeDasharray="60 203"
        strokeDashoffset="-175.6"
        strokeLinecap="round"
      />
      {/* Center Dot - The Protected Record */}
      <circle cx="60" cy="60" r="7.5" fill="#14213D" />
    </svg>
  );
};
