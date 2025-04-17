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
          d="M50 5 
             L55.8 31.3 
             L77.8 14.5 
             L70.6 40.3 
             L96.6 35.3 
             L77.1 54.4 
             L95 75.2 
             L68.7 69.4 
             L70.6 96.6 
             L50 80 
             L29.4 96.6 
             L31.3 69.4 
             L5 75.2 
             L22.9 54.4 
             L3.4 35.3 
             L29.4 40.3 
             L22.2 14.5 
             L44.2 31.3 Z"
          fill={fillColor}
          stroke={borderColor}
          strokeWidth="2"
        />
      </svg>
      <span className="absolute z-10 font-bold text-lg text-[#1E3A8A]">{day}</span>
    </div>
  );
}
