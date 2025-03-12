import React from 'react';

interface VoynichPageSVGProps {
  className?: string;
  width?: number;
  height?: number;
}

export function VoynichPageSVG({ className, width = 400, height = 600 }: VoynichPageSVGProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 400 600"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background */}
      <rect width="400" height="600" fill="#f8f3e6" />
      
      {/* Page border with aging effect */}
      <rect x="5" y="5" width="390" height="590" fill="none" stroke="#d3c7a6" strokeWidth="1" />
      
      {/* Ornate initial letter */}
      <g transform="translate(30, 60)">
        <path
          d="M20,0 Q40,-10 60,0 T100,0 Q120,10 100,30 T100,60 Q80,80 60,60 T20,60 Q0,40 20,20 Z"
          fill="#8b3e2f"
          opacity="0.9"
        />
        <path
          d="M40,10 Q50,0 60,10 T80,10 Q90,20 80,30 T80,50 Q70,60 60,50 T40,50 Q30,40 40,30 Z"
          fill="#f8f3e6"
        />
      </g>
      
      {/* Text-like lines */}
      <g transform="translate(30, 120)" fill="none" stroke="#534741">
        {Array.from({ length: 20 }).map((_, i) => (
          <path
            key={`line-${i}`}
            d={`M0,${i * 15} C${10 + i * 3},${i * 15 - 5} ${30 + i * 5},${i * 15 + 5} ${50 + i * 2},${i * 15} S${100 + i * 3},${i * 15 - 3} ${150 + i},${i * 15} S${250 - i * 2},${i * 15 + 4} ${300 - i * 4},${i * 15}`}
            strokeWidth="1.5"
          />
        ))}
      </g>
      
      {/* Plant-like drawing */}
      <g transform="translate(200, 450)">
        {/* Stem */}
        <path
          d="M0,0 C-5,-30 -10,-60 -5,-90 C0,-120 10,-150 5,-180"
          stroke="#35654d"
          strokeWidth="2"
          fill="none"
        />
        
        {/* Leaves */}
        {Array.from({ length: 6 }).map((_, i) => (
          <g key={`leaf-${i}`} transform={`rotate(${i * 60})`}>
            <path
              d={`M0,0 C${10 + i * 3},-${20 + i * 5} ${20 + i * 2},-${40 + i * 3} ${10 + i},-${60 + i * 2} C${5 + i * 2},-${70 + i * 2} -${5 + i * 2},-${70 + i * 2} -${10 + i},-${60 + i * 2} C-${20 + i * 2},-${40 + i * 3} -${10 + i * 3},-${20 + i * 5} 0,0`}
              fill="#7fa27f"
              opacity="0.8"
              stroke="#35654d"
              strokeWidth="0.5"
            />
          </g>
        ))}
        
        {/* Flower */}
        <circle cx="0" cy="0" r="15" fill="#d16666" />
        <circle cx="0" cy="0" r="8" fill="#efd47f" />
      </g>
      
      {/* Circular diagram */}
      <g transform="translate(100, 350)">
        <circle cx="0" cy="0" r="40" fill="none" stroke="#534741" strokeWidth="1" />
        <circle cx="0" cy="0" r="30" fill="none" stroke="#534741" strokeWidth="1" />
        <circle cx="0" cy="0" r="20" fill="none" stroke="#534741" strokeWidth="1" />
        
        {/* Radial lines */}
        {Array.from({ length: 12 }).map((_, i) => (
          <line
            key={`radial-${i}`}
            x1="0"
            y1="0"
            x2={40 * Math.cos((i * Math.PI) / 6)}
            y2={40 * Math.sin((i * Math.PI) / 6)}
            stroke="#534741"
            strokeWidth="0.5"
          />
        ))}
        
        {/* Small symbols around */}
        {Array.from({ length: 8 }).map((_, i) => (
          <text
            key={`symbol-${i}`}
            x={48 * Math.cos((i * Math.PI) / 4)}
            y={48 * Math.sin((i * Math.PI) / 4)}
            fontSize="10"
            fill="#534741"
            textAnchor="middle"
            dominantBaseline="middle"
            fontFamily="serif"
          >
            ※
          </text>
        ))}
      </g>
      
      {/* Marginal notes */}
      <g transform="translate(320, 150)">
        {Array.from({ length: 5 }).map((_, i) => (
          <path
            key={`note-${i}`}
            d={`M0,${i * 10} C5,${i * 10 - 2} 10,${i * 10 + 2} 15,${i * 10} S25,${i * 10 - 1} 35,${i * 10} S45,${i * 10 + 2} 50,${i * 10}`}
            stroke="#534741"
            strokeWidth="0.7"
            fill="none"
          />
        ))}
      </g>
      
      {/* Page number */}
      <text
        x="200"
        y="580"
        fontSize="16"
        fill="#534741"
        textAnchor="middle"
        fontFamily="serif"
      >
        ※ 86r ※
      </text>
    </svg>
  );
}