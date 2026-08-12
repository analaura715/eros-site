export function NexaLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="nblue" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0056FF" />
          <stop offset="100%" stopColor="#0095FF" />
        </linearGradient>
        <linearGradient id="ngreen" x1="100%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#00E676" />
          <stop offset="100%" stopColor="#00B050" />
        </linearGradient>
      </defs>
      
      {/* Right thick green curve (Back) */}
      <path d="M 90 45 V 75 C 90 95, 60 95, 30 65" stroke="url(#ngreen)" strokeWidth="22" strokeLinecap="round" />
      {/* Left thick blue curve (Front) */}
      <path d="M 30 75 V 45 C 30 25, 60 25, 90 55" stroke="url(#nblue)" strokeWidth="22" strokeLinecap="round" />
      
      
      {/* Bottom left blue dot */}
      <circle cx="30" cy="100" r="12" fill="url(#nblue)" />
      {/* Top right green dot */}
      <circle cx="90" cy="20" r="12" fill="url(#ngreen)" />
    </svg>
  );
}
