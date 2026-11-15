import { useCallback, useMemo, useState } from 'react'
import { Brain, CalendarDays, Database, FlaskConical, Satellite, UserRound } from 'lucide-react'
import data from './data/mockVitals.json'
import environments from './data/environments.json'
import osdr from './data/osdrTimeline.json'
import AstroAvatar from './components/AstroAvatar'
import MissionDashboard from './components/MissionDashboard'
import EnvironmentToggle from './components/EnvironmentToggle'
import SimulationControls from './components/SimulationControls'
import { STATUS } from './constants/status'
import { applyThresholds } from './lib/triage'
import { buildOsdrVitals } from './lib/osdr'
import { loadSessions, saveSessions, withCognition } from './lib/cognition'
import CognitiveLab from './components/cognitive/CognitiveLab'

const MODES = [
  { key: 'scenario', label: 'Scenario', icon: FlaskConical },
  { key: 'osdr', label: 'NASA Data · Inspiration4', icon: Database },
  { key: 'cognitive', label: 'Cognitive Lab', icon: Brain },
]

function HeaderStat({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-sky-400" />
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-200">{value}</span>
    </div>
  )
}

// Deep-link support, e.g. ?mode=osdr&crew=C002&tp=2&region=heart
const params = new URLSearchParams(window.location.search)

export default function App() {
  const [mode, setMode] = useState(MODES.some((m) => m.key === params.get('mode')) ? params.get('mode') : 'scenario')
  const [sessions, setSessions] = useState(loadSessions)

  const recordSession = useCallback((testId, r) => {
    setSessions((prev) => {
      const next = { ...prev, [testId]: [...(prev[testId] ?? []), { value: r.value, detail: r.detail, at: new Date().toISOString() }] }
      saveSessions(next)
      return next
    })
  }, [])
  const resetSessions = useCallback(() => {
    saveSessions({})
    setSessions({})
  }, [])
  const [selectedRegion, setSelectedRegion] = useState(params.get('region'))
  const [envKey, setEnvKey] = useState('iss')
  const [crewId, setCrewId] = useState(osdr.crew[params.get('crew')] ? params.get('crew') : 'C001')
  const [tpIndex, setTpIndex] = useState(Math.min(Math.max(Number(params.get('tp')) || 0, 0), osdr.timepoints.length - 1))
  const [playing, setPlaying] = useState(false)

  const isOsdr = mode === 'osdr'
  const env = environments[envKey]
  const timepoint = osdr.timepoints[tpIndex]

  const vitals = useMemo(
    () => (isOsdr ? buildOsdrVitals(osdr, crewId, timepoint) : withCognition(applyThresholds(data.vitals, env), sessions)),
    [isOsdr, crewId, timepoint, env, sessions],
  )
  const isCognitive = mode === 'cognitive'

  return (
    <div className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_at_top,_#0c1a33,_transparent_60%)] text-slate-100">
      <header className="border-b border-slate-800 px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Satellite className="h-7 w-7 text-sky-400" />
            <div>
              <h1 className="text-xl font-bold tracking-tight">Astro-Twin</h1>
              <p className="text-xs text-slate-500">Spaceflight health triage · NASA HRP data</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <HeaderStat icon={UserRound} label="Crew" value={isOsdr ? crewId : data.astronautId} />
            <HeaderStat icon={CalendarDays} label={isOsdr ? 'Timepoint' : 'Mission day'} value={isOsdr ? timepoint : data.missionDay} />
          </div>
        </div>

        <div className="mx-auto mt-4 flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3">
          <div role="radiogroup" aria-label="Data source" className="inline-flex rounded-xl border border-slate-800 bg-slate-900/70 p-1">
            {MODES.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                role="radio"
                aria-checked={mode === key}
                onClick={() => {
                  setMode(key)
                  setPlaying(false)
                }}
                className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-sky-400 ${
                  mode === key ? 'bg-violet-500/20 text-violet-200 ring-1 ring-violet-500/40' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
          {mode === 'scenario' && <EnvironmentToggle environments={environments} value={envKey} onChange={setEnvKey} />}
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-8">
        {isOsdr && (
          <SimulationControls
            osdr={osdr}
            crewId={crewId}
            onCrewChange={setCrewId}
            tpIndex={tpIndex}
            onTpIndexChange={setTpIndex}
            playing={playing}
            onPlayingChange={setPlaying}
          />
        )}

        {isCognitive && <CognitiveLab sessions={sessions} onRecord={recordSession} onReset={resetSessions} />}

        <div className={`grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] ${isCognitive ? 'hidden' : ''}`}>
          <section className="flex flex-col items-center rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
            <h2 className="mb-2 self-start text-xs uppercase tracking-widest text-slate-500">
              Body map · {isOsdr ? `${crewId} @ ${timepoint}` : env.label}
            </h2>
            <AstroAvatar vitals={vitals} selectedRegion={selectedRegion} onSelectRegion={setSelectedRegion} />
            <ul className="mt-4 flex flex-wrap justify-center gap-4 text-xs text-slate-400">
              {Object.values(STATUS).map((s) => (
                <li key={s.label} className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.hex }} />
                  {s.label}
                </li>
              ))}
              {isOsdr && (
                <li className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-600" />
                  No data
                </li>
              )}
              <li className="text-slate-500">Outer field = {isOsdr ? 'immune' : 'radiation & immune'}</li>
            </ul>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 sm:p-6">
            <MissionDashboard
              vitals={vitals}
              env={isOsdr ? null : env}
              selectedRegion={selectedRegion}
              onSelectRegion={setSelectedRegion}
              onOpenCognitive={isOsdr ? undefined : () => setMode('cognitive')}
            />
          </section>
        </div>
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-6 text-xs text-slate-600 sm:px-8">
        {isCognitive ? (
          'Cognitive Lab: original browser tasks modelled on standard paradigms (psychomotor vigilance, digit-symbol substitution, spatial working memory). Mission history is simulated; your sessions are stored only in this browser.'
        ) : isOsdr ? (
          <>
            Data: {osdr.source.title}. {osdr.source.repository}, {osdr.source.studies.join('; ')}. {osdr.source.note} Status:
            green = within lab reference range, yellow = outside by ≤10%, red = further outside.
          </>
        ) : (
          'Scenario mode uses mock values; thresholds are demo placeholders pending NASA-STD-3001 / HRP sourcing.'
        )}
      </footer>
    </div>
  )
}
