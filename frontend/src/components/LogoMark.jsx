function LogoMark({ className = '' }) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="logo-gradient" x1="9" y1="8" x2="54" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#06b6d4" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="56" height="56" rx="18" fill="url(#logo-gradient)" />
      <path
        d="M19 46V18H27.5V38.8H35.6V18H44V46H35.6V28.2H27.5V46H19Z"
        fill="white"
        fillOpacity="0.94"
      />
      <path
        d="M24 20.5H28.2V46H24V20.5ZM33.8 18H39.7V46H33.8V18Z"
        fill="rgba(255,255,255,0.8)"
      />
    </svg>
  )
}

export default LogoMark
