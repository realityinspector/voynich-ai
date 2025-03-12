import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 40, className = '' }) => {
  return (
    <svg 
      className={className}
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="50" cy="50" r="45" stroke="hsl(var(--primary))" strokeWidth="3" fill="none" />
      <path 
        d="M35,30 Q45,20 55,30 T75,30 Q85,40 75,50 T75,70 Q65,80 55,70 T35,70 Q25,60 35,50 T35,30" 
        stroke="hsl(var(--primary))" 
        strokeWidth="3.5" 
        fill="none" 
      />
      <circle cx="50" cy="50" r="8" fill="hsl(var(--primary))" />
    </svg>
  );
};

export default Logo;
