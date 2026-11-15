import { useState } from 'react'
import { getStatus } from '../../constants/status'

const W = 520
const H = 190
const M = { top: 16, right: 64, bottom: 28, left: 44 }
const LINE = '#38bdf8' // sky-400: the single series
const SURFACE = '#0b1220'

/**
 * One metric over the mission: simulated sessions, then the user's own ("You n").
 * Baseline and caution limit are labelled reference lines; in-flight sessions sit
 * on a shaded band. Hover any column for the exact value and status.
 */
export default function TrendChart({ test, points, thresholds, statusOf }) {
  const [hover, setHover] = useState(null)
  const values = [...points.map((p) => p.value), thresholds.baseline, thresholds.yellow]
  let lo = Math.min(...values)
  let hi = Math.max(...values)
  const pad = (hi - lo) * 0.15 || 1
  lo -= pad
  hi += pad

  const iw = W - M.left - M.right
  const ih = H - M.top - M.bottom
  const x = (i) => M.left + (points.length === 1 ? iw / 2 : (i / (points.length - 1)) * iw)
  const y = (v) => M.top + ih - ((v - lo) / (hi - lo)) * ih
  const step = points.length > 1 ? iw / (points.length - 1) : iw

  const flightIdx = points.map((p, i) => (p.phase === 'flight' ? i : -1)).filter((i) => i >= 0)
  // Rounding can collapse ticks for integer metrics (e.g. memory span), so dedupe.
  const ticks = [...new Set([lo + pad, (lo + hi) / 2, hi - pad].map((v) => test.round(v)))]
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.value)}`).join(' ')
  const hp = hover != null ? points[hover] : null

  // Keep the two reference-line labels from overlapping when the scale is stretched.
  const yBase = y(thresholds.baseline)
  let yCaution = y(thresholds.yellow)
  if (Math.abs(yCaution - yBase) < 12) yCaution = yBase + (yCaution <= yBase ? -12 : 12)

  return (
    <figure className="relative">
      <figcaption className="mb-1 flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-slate-200">{test.name}</span>
        <span className="text-xs text-slate-500">
          {test.unit} · {test.worse === 'higher' ? 'lower is better' : 'higher is better'}
        </span>
      </figcaption>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[420px]" role="img" aria-label={`${test.name} trend`} onMouseLeave={() => setHover(null)}>
          {/* In-flight band */}
          {flightIdx.length > 0 && (
            <g>
              <rect x={x(flightIdx[0]) - step / 2} y={M.top} width={x(flightIdx.at(-1)) - x(flightIdx[0]) + step} height={ih} fill="#8b5cf6" fillOpacity="0.08" />
              <text x={x(flightIdx[0]) - step / 2 + 6} y={M.top + 12} fontSize="10" fill="#a78bfa">
                In flight
              </text>
            </g>
          )}

          {/* Recessive y grid + ticks */}
          {ticks.map((t) => (
            <g key={t}>
              <line x1={M.left} x2={W - M.right} y1={y(t)} y2={y(t)} stroke="#1e293b" />
              <text x={M.left - 8} y={y(t) + 3} fontSize="10" fill="#64748b" textAnchor="end">
                {t}
              </text>
            </g>
          ))}

          {/* Reference lines, labelled at the right edge */}
          <line x1={M.left} x2={W - M.right} y1={y(thresholds.baseline)} y2={y(thresholds.baseline)} stroke="#94a3b8" strokeDasharray="4 4" />
          <text x={W - M.right + 6} y={yBase + 3} fontSize="10" fill="#94a3b8">
            Baseline
          </text>
          <line x1={M.left} x2={W - M.right} y1={y(thresholds.yellow)} y2={y(thresholds.yellow)} stroke="#eab308" strokeOpacity="0.7" strokeDasharray="2 4" />
          <text x={W - M.right + 6} y={yCaution + 3} fontSize="10" fill="#eab308">
            Caution
          </text>

          {/* Hover crosshair */}
          {hp && <line x1={x(hover)} x2={x(hover)} y1={M.top} y2={M.top + ih} stroke="#475569" />}

          {/* Series */}
          <path d={path} fill="none" stroke={LINE} strokeWidth="2" strokeLinejoin="round" />
          {points.map((p, i) =>
            p.you ? (
              <g key={i}>
                <circle cx={x(i)} cy={y(p.value)} r="5.5" fill={SURFACE} stroke="#f8fafc" strokeWidth="2.5" />
                {i === points.length - 1 && (
                  <text x={x(i)} y={y(p.value) - 10} fontSize="10" fill="#f8fafc" textAnchor="middle">
                    You
                  </text>
                )}
              </g>
            ) : (
              <circle key={i} cx={x(i)} cy={y(p.value)} r={hover === i ? 5.5 : 4} fill={LINE} stroke={SURFACE} strokeWidth="2" />
            ),
          )}

          {/* X labels (thinned when crowded) */}
          {points.map((p, i) =>
            points.length <= 12 || i % 2 === 0 || i === points.length - 1 ? (
              <text key={i} x={x(i)} y={H - 8} fontSize="9.5" fill={hover === i ? '#e2e8f0' : '#64748b'} textAnchor="middle">
                {p.label}
              </text>
            ) : null,
          )}

          {/* Hit targets: full-height columns */}
          {points.map((_, i) => (
            <rect key={i} x={x(i) - step / 2} y={M.top} width={step} height={ih} fill="transparent" onMouseEnter={() => setHover(i)} />
          ))}
        </svg>
      </div>

      {hp && (
        <div
          className="pointer-events-none absolute top-6 z-10 rounded-lg border border-slate-700 bg-slate-900/95 px-3 py-2 text-xs shadow-lg"
          style={{ left: `${(x(hover) / W) * 100}%`, transform: `translateX(${hover > points.length / 2 ? '-105%' : '5%'})` }}
        >
          <p className="font-mono text-slate-400">
            {hp.label} · {hp.you ? 'your session' : 'simulated'}
          </p>
          <p className="font-mono text-base text-slate-50">
            {hp.value} <span className="text-slate-400">{test.unit}</span>
          </p>
          <p className={getStatus(statusOf(hp.value)).text}>{getStatus(statusOf(hp.value)).label}</p>
          {hp.detail && <p className="text-slate-500">{hp.detail}</p>}
        </div>
      )}
    </figure>
  )
}
