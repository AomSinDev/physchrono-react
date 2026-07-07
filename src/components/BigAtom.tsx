export default function BigAtom() {
  return (
    <svg className="big-atom" viewBox="0 0 120 120" fill="none">
      <defs>
        <radialGradient id="coreG" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#00d4ff" stopOpacity="1" />
          <stop offset="100%" stopColor="#2196f3" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="orbG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#00d4ff" />
          <stop offset="100%" stopColor="#2196f3" stopOpacity="0.2" />
        </linearGradient>
      </defs>

      {/* Core glow */}
      <circle cx="60" cy="60" r="20" fill="url(#coreG)" opacity="0.4">
        <animate attributeName="r" values="18;22;18" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="60" cy="60" r="6" fill="#00d4ff">
        <animate attributeName="opacity" values="1;0.5;1" dur="1.5s" repeatCount="indefinite" />
      </circle>

      {/* Clock face */}
      <circle cx="60" cy="60" r="3" fill="white" />
      <line x1="60" y1="60" x2="60" y2="48" stroke="white" strokeWidth="1.5" strokeLinecap="round">
        <animateTransform attributeName="transform" type="rotate" from="0 60 60" to="360 60 60" dur="60s" repeatCount="indefinite" />
      </line>
      <line x1="60" y1="60" x2="68" y2="60" stroke="white" strokeWidth="1.5" strokeLinecap="round">
        <animateTransform attributeName="transform" type="rotate" from="0 60 60" to="360 60 60" dur="3600s" repeatCount="indefinite" />
      </line>

      {/* Orbits */}
      <g>
        <ellipse cx="60" cy="60" rx="48" ry="20" stroke="url(#orbG)" strokeWidth="1.5" fill="none">
          <animateTransform attributeName="transform" type="rotate" from="0 60 60" to="360 60 60" dur="8s" repeatCount="indefinite" />
        </ellipse>
      </g>
      <g transform="rotate(60 60 60)">
        <ellipse cx="60" cy="60" rx="48" ry="20" stroke="url(#orbG)" strokeWidth="1.5" fill="none">
          <animateTransform attributeName="transform" type="rotate" from="60 60 60" to="420 60 60" dur="6s" repeatCount="indefinite" />
        </ellipse>
      </g>
      <g transform="rotate(-60 60 60)">
        <ellipse cx="60" cy="60" rx="48" ry="20" stroke="url(#orbG)" strokeWidth="1.5" fill="none">
          <animateTransform attributeName="transform" type="rotate" from="-60 60 60" to="300 60 60" dur="7s" repeatCount="indefinite" />
        </ellipse>
      </g>
    </svg>
  )
}
