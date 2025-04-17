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
          d="M50 0 L57.2 34.5 L93.3 19.1 L72.2 50 L93.3 80.9 L57.2 65.5 L50 100 L42.8 65.5 L6.7 80.9 L27.8 50 L6.7 19.1 L42.8 34.5 Z"
          fill={fillColor}
          stroke={borderColor}
          strokeWidth="2"
        />
      </svg>
      <span className="absolute z-10 font-bold text-lg text-[#1E3A8A]">{day}</span>
    </div>
  );
}
