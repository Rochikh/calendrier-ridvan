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
        viewBox="0 0 120 120"
        className={`absolute w-full h-full transition-transform duration-300 ${hovered ? 'scale-110' : 'scale-100'}`}
      >
        <path 
          d="M60 10 L66.1 35.2 L89.5 17.8 L83.4 42.2 L110 42.2 L87.3 60 L99.4 84.8 L73.5 71 L60 95 L46.5 71 L20.6 84.8 L32.7 60 L10 42.2 L36.6 42.2 L30.5 17.8 L54 35.2 Z"
          fill={fillColor}
          stroke={borderColor}
          strokeWidth="2"
        />
      </svg>
      <span className="absolute z-10 font-bold text-lg text-[#1E3A8A]">{day}</span>
    </div>
  );
}
