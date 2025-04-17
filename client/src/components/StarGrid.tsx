import Star from './Star';

interface StarGridProps {
  totalDays: number;
  starColor: string;
  starBorderColor: string;
  onStarClick: (day: number) => void;
}

export default function StarGrid({ 
  totalDays, 
  starColor, 
  starBorderColor,
  onStarClick 
}: StarGridProps) {
  // Generate array of days
  const days = Array.from({ length: totalDays }, (_, i) => i + 1);

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4 md:gap-6 lg:gap-8 max-w-6xl mx-auto">
      {days.map(day => (
        <div key={day} className="star-container cursor-pointer" onClick={() => onStarClick(day)}>
          <Star day={day} fillColor={starColor} borderColor={starBorderColor} />
        </div>
      ))}
    </div>
  );
}
