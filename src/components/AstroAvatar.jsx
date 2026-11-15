import { getStatus } from '../constants/status'

const BODY_STROKE = '#0f172a'
const SELECTED_STROKE = '#f8fafc'

/**
 * Interactive human figure. Each body region is filled with the color of its
 * overallStatus. Clicking the space around the figure selects the full-body
 * (radiation & immune) region.
 */
export default function AstroAvatar({ vitals, selectedRegion, onSelectRegion }) {
  const regionProps = (key) => {
    const selected = selectedRegion === key
    return {
      role: 'button',
      tabIndex: 0,
      'aria-label': `${vitals[key].label}: ${getStatus(vitals[key].overallStatus).label}`,
      'aria-pressed': selected,
      onClick: () => onSelectRegion(key),
      onKeyDown: (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelectRegion(key)
        }
      },
      className: 'cursor-pointer outline-none transition-opacity hover:opacity-80 focus-visible:opacity-80',
      stroke: selected ? SELECTED_STROKE : BODY_STROKE,
      strokeWidth: selected ? 4 : 2,
    }
  }

  const fill = (key) => getStatus(vitals[key].overallStatus).hex
  const fullbodySelected = selectedRegion === 'fullbody'

  return (
    <svg viewBox="0 0 240 420" className="h-full max-h-[70vh] w-full" aria-label="Astronaut body map">
      <defs>
        <radialGradient id="aura" cx="50%" cy="48%" r="55%">
          <stop offset="0%" stopColor={fill('fullbody')} stopOpacity="0.35" />
          <stop offset="100%" stopColor={fill('fullbody')} stopOpacity="0.04" />
        </radialGradient>
      </defs>

      {/* Full body / radiation field: the background behind the figure */}
      <rect
        x="4"
        y="4"
        width="232"
        height="412"
        rx="28"
        fill="url(#aura)"
        {...regionProps('fullbody')}
        stroke={fullbodySelected ? SELECTED_STROKE : fill('fullbody')}
        strokeOpacity={fullbodySelected ? 1 : 0.5}
        strokeWidth={fullbodySelected ? 3 : 1.5}
        strokeDasharray={fullbodySelected ? undefined : '6 6'}
      />

      {/* Neck (decorative) */}
      <rect x="108" y="78" width="24" height="20" rx="6" fill="#334155" pointerEvents="none" />

      {/* Limbs: musculoskeletal */}
      <g {...regionProps('musculoskeletal')} fill={fill('musculoskeletal')}>
        <rect x="52" y="104" width="24" height="136" rx="12" transform="rotate(10 64 104)" />
        <rect x="164" y="104" width="24" height="136" rx="12" transform="rotate(-10 176 104)" />
        <rect x="84" y="228" width="30" height="168" rx="14" />
        <rect x="126" y="228" width="30" height="168" rx="14" />
      </g>

      {/* Torso: cardiovascular */}
      <g {...regionProps('heart')}>
        <path d="M80 98 h80 a14 14 0 0 1 14 14 v110 a16 16 0 0 1 -16 16 h-76 a16 16 0 0 1 -16 -16 v-110 a14 14 0 0 1 14 -14 z" fill={fill('heart')} />
        {/* Heart glyph */}
        <path
          d="M134 140 c-4 -8 -18 -8 -18 4 c0 10 18 20 18 20 s18 -10 18 -20 c0 -12 -14 -12 -18 -4 z"
          transform="translate(-14 0)"
          fill="#0f172a"
          fillOpacity="0.35"
          stroke="none"
          pointerEvents="none"
        />
      </g>

      {/* Head: brain & vision */}
      <circle cx="120" cy="52" r="32" fill={fill('head')} {...regionProps('head')} />
      {/* Visor */}
      <rect x="100" y="42" width="40" height="16" rx="8" fill="#0f172a" fillOpacity="0.35" pointerEvents="none" />
    </svg>
  )
}
