import React from 'react'

export const MetaIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={`text-[#0081FB] ${className}`}
    aria-label="Meta"
  >
    <path d="M16.994 3.003c-2.457 0-4.04 1.34-4.994 2.87-.954-1.53-2.537-2.87-4.994-2.87C3.125 3.003 0 6.136 0 10.015c0 4.965 4.39 9.38 10.665 10.91a4.267 4.267 0 0 0 2.67 0C19.61 19.395 24 14.98 24 10.015c0-3.879-3.125-7.012-7.006-7.012zm-9.988 2.5c1.88 0 3.228 1.157 3.864 2.766-.677 1.348-1.572 2.878-2.615 4.324-1.687-2.222-2.849-4.526-2.849-5.59 0-1.604 1.144-2.5 2.5-2.5zm9.988 0c1.356 0 2.5.896 2.5 2.5 0 1.064-1.162 3.368-2.85 5.59-1.042-1.446-1.937-2.976-2.614-4.324.636-1.609 1.984-2.766 3.864-2.766zm-5.994 9.42c1.03-1.396 1.92-2.872 2.607-4.254.34.697.747 1.455 1.218 2.247-1.47 1.832-3.172 2.84-3.825 2.007zm-2.006-2.007c-.653.833-2.355-.175-3.825-2.007.471-.792.878-1.55 1.218-2.247.687 1.382 1.577 2.858 2.607 4.254z" />
  </svg>
)

export const InstagramIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    aria-label="Instagram"
  >
    <defs>
      <radialGradient id="ig-grad" cx="20%" cy="105%" r="130%">
        <stop offset="0%" stopColor="#ffda55" />
        <stop offset="10%" stopColor="#fcd34d" />
        <stop offset="50%" stopColor="#ec4899" />
        <stop offset="100%" stopColor="#8b5cf6" />
      </radialGradient>
    </defs>
    <rect x="2" y="2" width="20" height="20" rx="5" fill="url(#ig-grad)" />
    <circle cx="12" cy="12" r="4.5" stroke="#ffffff" strokeWidth="2" fill="none" />
    <circle cx="17.5" cy="6.5" r="1.2" fill="#ffffff" />
  </svg>
)

export const GoogleAdsIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    aria-label="Google Ads"
  >
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
    />
  </svg>
)

interface PlatformBadgesProps {
  platforms: string[]
  className?: string
}

export const PlatformBadges: React.FC<PlatformBadgesProps> = ({
  platforms = ['meta'],
  className = '',
}) => {
  const normPlatforms = (platforms && platforms.length > 0 ? platforms : ['meta'])
    .map((p) => (p.toLowerCase() === 'instagram' ? 'meta' : p.toLowerCase()))
    .filter((v, i, a) => a.indexOf(v) === i)

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {normPlatforms.map((p) => {
        const key = p.toLowerCase()
        if (key === 'meta') {
          return (
            <div
              key="meta"
              title="Meta Ads"
              className="w-6 h-6 rounded flex items-center justify-center bg-blue-50/80 border border-blue-100 hover:scale-105 transition-transform shrink-0"
            >
              <MetaIcon className="w-3.5 h-3.5" />
            </div>
          )
        }
        if (key === 'google_ads' || key === 'google') {
          return (
            <div
              key="google"
              title="Google Ads"
              className="w-6 h-6 rounded flex items-center justify-center bg-slate-50 border border-slate-200/80 hover:scale-105 transition-transform shrink-0"
            >
              <GoogleAdsIcon className="w-3.5 h-3.5" />
            </div>
          )
        }
        return (
          <span
            key={p}
            className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium uppercase shrink-0"
          >
            {p}
          </span>
        )
      })}
    </div>
  )
}
