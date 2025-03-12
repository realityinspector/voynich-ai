import React from 'react';

interface SymbolProps {
  width?: number;
  height?: number;
  className?: string;
}

export function BotanicalSymbol({ width = 80, height = 80, className }: SymbolProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="50" cy="50" r="48" fill="#f8f3e6" stroke="#534741" strokeWidth="1" />
      
      {/* Stem */}
      <path
        d="M50,85 C50,70 45,55 50,40 C55,25 50,15 50,10"
        stroke="#35654d"
        strokeWidth="2"
        fill="none"
      />
      
      {/* Leaves */}
      <path
        d="M50,55 C60,45 75,45 85,50 C75,60 60,60 50,55"
        fill="#7fa27f"
        stroke="#35654d"
        strokeWidth="1"
      />
      <path
        d="M50,55 C40,45 25,45 15,50 C25,60 40,60 50,55"
        fill="#7fa27f"
        stroke="#35654d"
        strokeWidth="1"
      />
      <path
        d="M50,40 C60,30 75,30 85,35 C75,45 60,45 50,40"
        fill="#7fa27f"
        stroke="#35654d"
        strokeWidth="1"
      />
      <path
        d="M50,40 C40,30 25,30 15,35 C25,45 40,45 50,40"
        fill="#7fa27f"
        stroke="#35654d"
        strokeWidth="1"
      />
      
      {/* Flower */}
      <circle cx="50" cy="25" r="10" fill="#d16666" />
      <circle cx="50" cy="25" r="6" fill="#efd47f" />
    </svg>
  );
}

export function AstronomicalSymbol({ width = 80, height = 80, className }: SymbolProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="50" cy="50" r="48" fill="#f8f3e6" stroke="#534741" strokeWidth="1" />
      
      {/* Concentric circles */}
      <circle cx="50" cy="50" r="35" stroke="#534741" strokeWidth="1.5" fill="none" />
      <circle cx="50" cy="50" r="25" stroke="#534741" strokeWidth="1" fill="none" />
      <circle cx="50" cy="50" r="15" stroke="#534741" strokeWidth="0.75" fill="none" />
      
      {/* Radial lines */}
      {Array.from({ length: 12 }).map((_, i) => (
        <line
          key={`line-${i}`}
          x1="50"
          y1="50"
          x2={50 + 35 * Math.cos((i * Math.PI) / 6)}
          y2={50 + 35 * Math.sin((i * Math.PI) / 6)}
          stroke="#534741"
          strokeWidth="0.5"
        />
      ))}
      
      {/* Star symbols */}
      <circle cx="35" cy="35" r="3" fill="#efd47f" />
      <circle cx="65" cy="35" r="4" fill="#efd47f" />
      <circle cx="50" cy="20" r="3.5" fill="#efd47f" />
      <circle cx="75" cy="50" r="3" fill="#efd47f" />
      <circle cx="25" cy="50" r="3" fill="#efd47f" />
      <circle cx="35" cy="65" r="3" fill="#efd47f" />
      <circle cx="65" cy="65" r="3" fill="#efd47f" />
      <circle cx="50" cy="75" r="3" fill="#efd47f" />
      
      {/* Central celestial symbol */}
      <circle cx="50" cy="50" r="8" fill="#2a4f6e" />
      <path
        d="M50,58 L53,50 L58,47 L50,44 L47,36 L44,44 L36,47 L44,50 L47,58 Z"
        fill="#efd47f"
      />
    </svg>
  );
}

export function CosmologicalSymbol({ width = 80, height = 80, className }: SymbolProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="50" cy="50" r="48" fill="#f8f3e6" stroke="#534741" strokeWidth="1" />
      
      {/* Main diagram */}
      <polygon
        points="50,15 85,50 50,85 15,50"
        fill="none"
        stroke="#534741"
        strokeWidth="1.5"
      />
      <polygon
        points="50,25 75,50 50,75 25,50"
        fill="none"
        stroke="#534741"
        strokeWidth="1"
      />
      
      {/* Connecting lines */}
      <line x1="15" y1="50" x2="25" y2="50" stroke="#534741" strokeWidth="1" />
      <line x1="75" y1="50" x2="85" y2="50" stroke="#534741" strokeWidth="1" />
      <line x1="50" y1="15" x2="50" y2="25" stroke="#534741" strokeWidth="1" />
      <line x1="50" y1="75" x2="50" y2="85" stroke="#534741" strokeWidth="1" />
      
      {/* Central element */}
      <circle cx="50" cy="50" r="15" fill="#2a4f6e" opacity="0.2" />
      <circle cx="50" cy="50" r="10" fill="#2a4f6e" opacity="0.4" />
      <circle cx="50" cy="50" r="5" fill="#2a4f6e" />
      
      {/* Celestial symbols */}
      <circle cx="15" cy="50" r="3" fill="#efd47f" />
      <circle cx="85" cy="50" r="3" fill="#efd47f" />
      <circle cx="50" cy="15" r="3" fill="#efd47f" />
      <circle cx="50" cy="85" r="3" fill="#efd47f" />
      
      {/* Decorative elements */}
      <path
        d="M25,30 Q35,25 45,30 Q50,35 55,30 Q65,25 75,30"
        stroke="#534741"
        strokeWidth="0.75"
        fill="none"
      />
      <path
        d="M25,70 Q35,75 45,70 Q50,65 55,70 Q65,75 75,70"
        stroke="#534741"
        strokeWidth="0.75"
        fill="none"
      />
    </svg>
  );
}

export function PharmaceuticalSymbol({ width = 80, height = 80, className }: SymbolProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="50" cy="50" r="48" fill="#f8f3e6" stroke="#534741" strokeWidth="1" />
      
      {/* Vessel */}
      <path
        d="M40,80 C30,80 30,70 30,65 L30,35 C30,30 35,25 40,25 L60,25 C65,25 70,30 70,35 L70,65 C70,70 70,80 60,80 Z"
        fill="none"
        stroke="#534741"
        strokeWidth="1.5"
      />
      
      {/* Liquid */}
      <path
        d="M35,65 L65,65 C65,70 65,75 60,75 L40,75 C35,75 35,70 35,65 Z"
        fill="#7fa27f"
        opacity="0.7"
      />
      
      {/* Bubbles */}
      <circle cx="45" cy="60" r="3" fill="#f8f3e6" />
      <circle cx="55" cy="55" r="2" fill="#f8f3e6" />
      <circle cx="50" cy="62" r="1.5" fill="#f8f3e6" />
      
      {/* Vessel neck */}
      <rect x="45" y="20" width="10" height="5" fill="none" stroke="#534741" strokeWidth="1.5" />
      
      {/* Decorative elements */}
      <path
        d="M40,45 C45,40 55,40 60,45"
        stroke="#534741"
        strokeWidth="0.75"
        fill="none"
      />
      <path
        d="M35,55 C45,50 55,50 65,55"
        stroke="#534741"
        strokeWidth="0.75"
        fill="none"
      />
      
      {/* Plant elements */}
      <path
        d="M50,25 C50,20 55,15 60,15 C55,10 45,10 40,15 C45,15 50,20 50,25"
        fill="#7fa27f"
        stroke="#35654d"
        strokeWidth="0.75"
      />
    </svg>
  );
}