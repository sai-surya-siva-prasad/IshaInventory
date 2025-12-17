import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
  color?: string;
}

export const CubeLogo: React.FC<LogoProps> = ({ size = 24, className = '', color = 'currentColor' }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ transform: 'rotate(-5deg)' }} // Slight tilt to the left as requested
    >
      {/* Top Face */}
      <path 
        d="M12 2L3 7L12 12L21 7L12 2Z" 
        fill={color} 
      />
      {/* Left Face */}
      <path 
        d="M3 7V17L12 22V12L3 7Z" 
        fill={color} 
        fillOpacity="0.7"
      />
      {/* Right Face */}
      <path 
        d="M21 7V17L12 22V12L21 7Z" 
        fill={color} 
        fillOpacity="0.4"
      />
    </svg>
  );
};
