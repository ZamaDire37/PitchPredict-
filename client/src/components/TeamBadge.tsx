import React, { useState } from 'react';

interface TeamBadgeProps {
  name: string;
  shortName?: string;
  crest?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

// Generate deterministic pleasing gradient based on team name
function getTeamGradient(name: string): string {
  const gradients = [
    'from-red-600 to-rose-900 border-red-500/40 text-red-100',
    'from-blue-600 to-indigo-900 border-blue-500/40 text-blue-100',
    'from-amber-600 to-orange-900 border-amber-500/40 text-amber-100',
    'from-emerald-600 to-teal-900 border-emerald-500/40 text-emerald-100',
    'from-purple-600 to-violet-900 border-purple-500/40 text-purple-100',
    'from-cyan-600 to-blue-900 border-cyan-500/40 text-cyan-100',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  return gradients[Math.abs(hash) % gradients.length];
}

function getInitials(name: string, shortName?: string): string {
  const target = (shortName || name).trim();
  if (target.length <= 3) return target.toUpperCase();
  const parts = target.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return target.slice(0, 3).toUpperCase();
}

export const TeamBadge: React.FC<TeamBadgeProps> = ({
  name,
  shortName,
  crest,
  size = 'md',
  className = '',
}) => {
  const [hasError, setHasError] = useState(false);

  const sizeClasses = {
    xs: 'w-5 h-5 text-[9px]',
    sm: 'w-7 h-7 text-[10px]',
    md: 'w-10 h-10 text-xs sm:w-12 sm:h-12 sm:text-sm',
    lg: 'w-14 h-14 text-sm sm:w-16 sm:h-16 sm:text-base',
  }[size];

  const imgSizeClasses = {
    xs: 'w-4 h-4',
    sm: 'w-5 h-5',
    md: 'w-7 h-7 sm:w-8 sm:h-8',
    lg: 'w-10 h-10 sm:w-12 sm:h-12',
  }[size];

  const initials = getInitials(name, shortName);
  const gradient = getTeamGradient(name);

  if (crest && !hasError) {
    return (
      <div
        className={`flex items-center justify-center shrink-0 ${sizeClasses} ${className}`}
        title={name}
      >
        <img
          src={crest}
          alt={name}
          className={`${imgSizeClasses} object-contain drop-shadow transition-transform hover:scale-105`}
          onError={() => setHasError(true)}
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div
      className={`rounded-full shrink-0 flex items-center justify-center font-black tracking-wider uppercase bg-gradient-to-br border shadow-inner ${gradient} ${sizeClasses} ${className}`}
      title={name}
    >
      {initials}
    </div>
  );
};
