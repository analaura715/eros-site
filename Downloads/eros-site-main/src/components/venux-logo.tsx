export function VenuxLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="vblue_light" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00E5FF" />
          <stop offset="100%" stopColor="#0056FF" />
        </linearGradient>
        <linearGradient id="vblue_dark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#003B99" />
          <stop offset="100%" stopColor="#000F2E" />
        </linearGradient>
        <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.3"/>
        </filter>
      </defs>
      
      {/* Right arm of V (Back - Darker Blue) */}
      <path 
        d="M 95 25 L 60 95" 
        stroke="url(#vblue_dark)" 
        strokeWidth="24" 
        strokeLinecap="round" 
        filter="url(#shadow)"
      />
      
      {/* Left arm of V (Front - Lighter Blue Cyan) */}
      <path 
        d="M 25 25 L 60 95" 
        stroke="url(#vblue_light)" 
        strokeWidth="24" 
        strokeLinecap="round"
        filter="url(#shadow)" 
      />
    </svg>
  );
}
