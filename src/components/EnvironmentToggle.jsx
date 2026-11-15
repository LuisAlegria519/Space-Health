import { Globe2, Moon, Orbit } from 'lucide-react'

const ICONS = { iss: Orbit, moon: Moon, mars: Globe2 }

/** Segmented control for choosing the mission environment whose thresholds apply. */
export default function EnvironmentToggle({ environments, value, onChange }) {
  const current = environments[value]
  const entries = Object.entries(environments).filter(([key]) => !key.startsWith('_'))

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
      <div role="radiogroup" aria-label="Mission environment" className="inline-flex rounded-xl border border-slate-800 bg-slate-900/70 p-1">
        {entries.map(([key, env]) => {
          const Icon = ICONS[key] ?? Orbit
          const active = key === value
          return (
            <button
              key={key}
              role="radio"
              aria-checked={active}
              onClick={() => onChange(key)}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-sky-400 ${
                active ? 'bg-sky-500/20 text-sky-200 ring-1 ring-sky-500/40' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              {env.label}
            </button>
          )
        })}
      </div>
      <p className="text-xs text-slate-500">
        {current.description} · gravity {current.gravity} g · comm delay{' '}
        {current.commDelayMin < 1 ? `${Math.round(current.commDelayMin * 60)} s` : `~${current.commDelayMin} min`}
      </p>
    </div>
  )
}
