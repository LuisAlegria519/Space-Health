import { useState } from 'react'
import { CalendarDays, Orbit, Satellite, UserRound } from 'lucide-react'
import data from './data/mockVitals.json'
import AstroAvatar from './components/AstroAvatar'
import MissionDashboard from './components/MissionDashboard'
import { STATUS } from './constants/status'

function HeaderStat({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-sky-400" />
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-200">{value}</span>
    </div>
  )
}

export default function App() {
  const [selectedRegion, setSelectedRegion] = useState(null)

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
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <HeaderStat icon={UserRound} label="Crew" value={data.astronautId} />
            <HeaderStat icon={CalendarDays} label="Mission day" value={data.missionDay} />
            <HeaderStat icon={Orbit} label="Env" value={data.environment} />
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <section className="flex flex-col items-center rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
          <h2 className="mb-2 self-start text-xs uppercase tracking-widest text-slate-500">Body map</h2>
          <AstroAvatar vitals={data.vitals} selectedRegion={selectedRegion} onSelectRegion={setSelectedRegion} />
          <ul className="mt-4 flex flex-wrap justify-center gap-4 text-xs text-slate-400">
            {Object.values(STATUS).map((s) => (
              <li key={s.label} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.hex }} />
                {s.label}
              </li>
            ))}
            <li className="text-slate-500">Outer field = radiation &amp; immune</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 sm:p-6">
          <MissionDashboard vitals={data.vitals} selectedRegion={selectedRegion} onSelectRegion={setSelectedRegion} />
        </section>
      </main>
    </div>
  )
}
