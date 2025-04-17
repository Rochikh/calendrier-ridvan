import { useState } from 'react';

interface StarProps {
  day: number;
  fillColor: string;
  borderColor: string;
}

export default function Star({ day, fillColor, borderColor }: StarProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div 
      className="relative flex items-center justify-center w-full h-0 pb-[100%]"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 100 100"
        className={`absolute w-full h-full transition-transform duration-300 ${hovered ? 'scale-110' : 'scale-100'}`}
      >
        <path 
          d="M50 0 L61.1 31.9 L94.7 29.1 L72.5 56.5 L85.5 88.9 L50 77.2 L14.5 88.9 L27.5 56.5 L5.3 29.1 L38.9 31.9 Z"
          fill={fillColor}
          stroke={borderColor}
          strokeWidth="2"
        />
      </svg>
      <span className="absolute z-10 font-bold text-lg text-[#1E3A8A]">{day}</span>
    </div>
  );
}
