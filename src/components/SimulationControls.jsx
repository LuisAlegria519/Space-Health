import { useEffect } from 'react'
import { Pause, Play, Rocket } from 'lucide-react'
import { describeTimepoint } from '../lib/osdr'

const STEP_MS = 1800

/**
 * Crew picker + mission timeline playback for the OSDR Inspiration4 data.
 * The flight itself (3 days, no samples) is drawn as a marker between L-3 and R+1.
 */
export default function SimulationControls({ osdr, crewId, onCrewChange, tpIndex, onTpIndexChange, playing, onPlayingChange }) {
  const tps = osdr.timepoints
  const flightAfter = tps.findIndex((t) => t.startsWith('R')) - 1

  useEffect(() => {
    if (!playing) return
    if (tpIndex >= tps.length - 1) {
      onPlayingChange(false)
      return
    }
    const id = setTimeout(() => onTpIndexChange(tpIndex + 1), STEP_MS)
    return () => clearTimeout(id)
  }, [playing, tpIndex, tps.length, onTpIndexChange, onPlayingChange])

  const togglePlay = () => {
    if (!playing && tpIndex >= tps.length - 1) onTpIndexChange(0)
    onPlayingChange(!playing)
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
      <div className="flex flex-wrap items-center gap-4">
        <button
          onClick={togglePlay}
          aria-label={playing ? 'Pause timeline' : 'Play timeline'}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-500 text-slate-950 transition hover:bg-sky-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
        >
          {playing ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
        </button>

        <label className="flex items-center gap-2 text-sm text-slate-400">
          Crew
          <select
            value={crewId}
            onChange={(e) => onCrewChange(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-slate-100 focus-visible:outline-2 focus-visible:outline-sky-400"
          >
            {Object.entries(osdr.crew)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([id, m]) => (
                <option key={id} value={id}>
                  {id} ({m.sex})
                </option>
              ))}
          </select>
        </label>

        <div className="min-w-0 flex-1 text-right">
          <p className="font-mono text-lg font-semibold text-slate-50">{tps[tpIndex]}</p>
          <p className="text-xs text-slate-500">{describeTimepoint(tps[tpIndex])}</p>
        </div>
      </div>

      {/* Timeline */}
      <ol className="mt-4 flex items-center">
        {tps.map((tp, i) => (
          <li key={tp} className="flex flex-1 items-center last:flex-none">
            <button
              onClick={() => {
                onPlayingChange(false)
                onTpIndexChange(i)
              }}
              aria-current={i === tpIndex ? 'step' : undefined}
              title={describeTimepoint(tp)}
              className={`group flex flex-col items-center gap-1 rounded focus-visible:outline-2 focus-visible:outline-sky-400`}
            >
              <span
                className={`h-3.5 w-3.5 rounded-full border-2 transition ${
                  i === tpIndex ? 'scale-125 border-sky-300 bg-sky-400' : i < tpIndex ? 'border-sky-500 bg-sky-700' : 'border-slate-600 bg-slate-900 group-hover:border-slate-400'
                }`}
              />
              <span className={`font-mono text-[10px] sm:text-xs ${i === tpIndex ? 'text-sky-300' : 'text-slate-500'}`}>{tp}</span>
            </button>
            {i < tps.length - 1 && (
              <span className={`relative mx-1 mb-5 h-0.5 flex-1 ${i < tpIndex ? 'bg-sky-600' : 'bg-slate-700'}`}>
                {i === flightAfter && (
                  <span className="absolute -top-6 left-1/2 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] text-violet-300 ring-1 ring-violet-500/40">
                    <Rocket className="h-3 w-3" /> 3-day flight
                  </span>
                )}
              </span>
            )}
          </li>
        ))}
      </ol>
    </div>
  )
}
