import { Activity, ChevronRight, MousePointerClick, RadioTower } from 'lucide-react'
import { getStatus, regionIcon } from '../constants/status'

function StatusBadge({ status }) {
  const s = getStatus(status)
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${s.text} ${s.bg} ${s.ring}`}>
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.hex }} />
      {s.label}
    </span>
  )
}

function MetricCard({ metric, env }) {
  const s = getStatus(metric.status)
  return (
    <li className="rounded-xl border border-slate-800 bg-slate-900/70 p-4" style={{ borderLeft: `4px solid ${s.hex}` }}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-medium text-slate-300">{metric.name}</h3>
        <StatusBadge status={metric.status} />
      </div>
      <p className="mt-2 font-mono text-3xl font-semibold text-slate-50">
        {metric.display ?? metric.value}
        {metric.unit && <span className="ml-1.5 text-base font-normal text-slate-400">{metric.unit}</span>}
      </p>
      <p className="mt-2 text-sm text-slate-400">{metric.description}</p>
      {metric.limitsText && <p className="mt-3 font-mono text-xs text-slate-500">{metric.limitsText}</p>}
      {metric.status === 'red' && env?.commDelayMin >= 5 && (
        <p className="mt-3 flex items-start gap-2 rounded-lg bg-red-500/10 p-2 text-xs text-red-300 ring-1 ring-red-500/30">
          <RadioTower className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          ~{env.commDelayMin} min one-way delay to Earth. Crew-autonomous response required.
        </p>
      )}
    </li>
  )
}

/** Overview shown before any region is selected: every region, most severe first. */
function Overview({ vitals, onSelectRegion }) {
  const regions = Object.entries(vitals).sort(
    ([, a], [, b]) => getStatus(b.overallStatus).rank - getStatus(a.overallStatus).rank,
  )
  return (
    <div>
      <div className="mb-5 flex items-center gap-2 text-slate-400">
        <MousePointerClick className="h-4 w-4" />
        <p className="text-sm">Select a body region on the avatar, or pick one below.</p>
      </div>
      <ul className="space-y-3">
        {regions.map(([key, region]) => {
          const Icon = regionIcon(key, region) ?? Activity
          return (
            <li key={key}>
              <button
                onClick={() => onSelectRegion(key)}
                className="flex w-full items-center gap-4 rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-left transition hover:border-slate-600 hover:bg-slate-800/70 focus-visible:outline-2 focus-visible:outline-sky-400"
              >
                <Icon className="h-6 w-6 shrink-0" style={{ color: getStatus(region.overallStatus).hex }} />
                <span className="flex-1 font-medium text-slate-100">{region.label}</span>
                <StatusBadge status={region.overallStatus} />
                <ChevronRight className="h-4 w-4 text-slate-500" />
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default function MissionDashboard({ vitals, env, selectedRegion, onSelectRegion }) {
  const region = selectedRegion ? vitals[selectedRegion] : null

  if (!region) return <Overview vitals={vitals} onSelectRegion={onSelectRegion} />

  const Icon = regionIcon(selectedRegion, region) ?? Activity
  const s = getStatus(region.overallStatus)

  return (
    <div>
      <button
        onClick={() => onSelectRegion(null)}
        className="mb-4 text-sm text-sky-400 hover:text-sky-300 focus-visible:outline-2 focus-visible:outline-sky-400"
      >
        ← All systems
      </button>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className={`rounded-xl p-2.5 ring-1 ${s.bg} ${s.ring}`}>
          <Icon className="h-7 w-7" style={{ color: s.hex }} />
        </div>
        <div className="flex-1">
          <p className="text-xs uppercase tracking-widest text-slate-500">System</p>
          <h2 className="text-2xl font-semibold text-slate-50">{region.label}</h2>
        </div>
        <StatusBadge status={region.overallStatus} />
      </div>
      {region.metrics.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2">
          {region.metrics.map((m) => (
            <MetricCard key={m.id} metric={m} env={env} />
          ))}
        </ul>
      )}
      {region.emptyNote && (
        <p className="mt-4 rounded-xl border border-dashed border-slate-700 p-4 text-sm text-slate-400">{region.emptyNote}</p>
      )}
    </div>
  )
}
