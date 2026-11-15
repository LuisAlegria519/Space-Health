import { useCallback, useState } from 'react'
import { ArrowLeft, Brain, Grid3x3, Shapes, Timer, Trash2 } from 'lucide-react'
import { TESTS, historyFor, latestFor, statusFor, thresholdsFor } from '../../lib/cognition'
import { getStatus } from '../../constants/status'
import ReactionTest from './ReactionTest'
import SymbolMatchTest from './SymbolMatchTest'
import MemoryGridTest from './MemoryGridTest'
import TrendChart from './TrendChart'

const RUNNERS = { reaction: ReactionTest, symbol: SymbolMatchTest, memory: MemoryGridTest }
const ICONS = { reaction: Timer, symbol: Shapes, memory: Grid3x3 }

function Badge({ status }) {
  const s = getStatus(status)
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${s.text} ${s.bg} ${s.ring}`}>
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.hex }} />
      {s.label}
    </span>
  )
}

export default function CognitiveLab({ sessions, onRecord, onReset }) {
  const [active, setActive] = useState(null) // test id being played
  const [result, setResult] = useState(null) // { testId, value, detail }
  const [runKey, setRunKey] = useState(0)

  const complete = useCallback(
    (r) => {
      onRecord(active, r)
      setResult({ testId: active, ...r })
      setActive(null)
    },
    [active, onRecord],
  )

  const start = (id) => {
    setResult(null)
    setActive(id)
    setRunKey((k) => k + 1)
  }

  const hasSessions = Object.values(sessions).some((s) => s?.length)

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      {/* Play area */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
        {active ? (
          (() => {
            const Runner = RUNNERS[active]
            return (
              <div>
                <button onClick={() => setActive(null)} className="mb-3 flex items-center gap-1 text-sm text-sky-400 hover:text-sky-300">
                  <ArrowLeft className="h-4 w-4" /> Cancel
                </button>
                <h2 className="mb-3 text-lg font-semibold text-slate-50">{TESTS[active].title}</h2>
                <Runner key={runKey} onComplete={complete} />
              </div>
            )
          })()
        ) : (
          <div>
            <div className="mb-4 flex items-center gap-2">
              <Brain className="h-5 w-5 text-violet-300" />
              <h2 className="text-lg font-semibold text-slate-50">Cognitive check-in</h2>
            </div>

            {result && (
              <div className="mb-4 rounded-xl border border-slate-700 bg-slate-950/60 p-4">
                <p className="text-xs uppercase tracking-widest text-slate-500">Result · {TESTS[result.testId].title}</p>
                <div className="mt-1 flex items-center justify-between gap-3">
                  <p className="font-mono text-3xl font-semibold text-slate-50">
                    {result.value} <span className="text-base font-normal text-slate-400">{TESTS[result.testId].unit}</span>
                  </p>
                  <Badge status={statusFor(TESTS[result.testId], result.value)} />
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {result.detail} · baseline {thresholdsFor(TESTS[result.testId]).baseline}
                </p>
              </div>
            )}

            <ul className="space-y-3">
              {Object.values(TESTS).map((test) => {
                const Icon = ICONS[test.id]
                const latest = latestFor(test, sessions)
                return (
                  <li key={test.id} className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                    <div className="flex items-start gap-3">
                      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-violet-300" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="font-medium text-slate-100">{test.title}</h3>
                          <Badge status={statusFor(test, latest.value)} />
                        </div>
                        <p className="mt-1 text-sm text-slate-400">{test.blurb}</p>
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <p className="font-mono text-xs text-slate-500">
                            Latest {latest.value} {test.unit} ({latest.you ? 'you' : `sim ${latest.label}`})
                          </p>
                          <button
                            onClick={() => start(test.id)}
                            className="rounded-lg bg-violet-500/20 px-3 py-1.5 text-sm font-medium text-violet-200 ring-1 ring-violet-500/40 hover:bg-violet-500/30"
                          >
                            Start
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>

            {hasSessions && (
              <button onClick={onReset} className="mt-4 flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300">
                <Trash2 className="h-3.5 w-3.5" /> Clear my sessions
              </button>
            )}
          </div>
        )}
      </section>

      {/* Trends */}
      <section className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
        <div>
          <h2 className="text-xs uppercase tracking-widest text-slate-500">Mission trend · Astro-01</h2>
          <p className="mt-1 text-xs text-slate-500">
            Blue = simulated sessions (illustrative pattern: early-flight dip, adaptation, fatigue creep). White rings = your sessions.
            Status compares with the pre-flight baseline. A performance screen, not a measure of intracranial pressure.
          </p>
        </div>
        {Object.values(TESTS).map((test) => (
          <TrendChart
            key={test.id}
            test={test}
            points={historyFor(test, sessions)}
            thresholds={thresholdsFor(test)}
            statusOf={(v) => statusFor(test, v)}
          />
        ))}
      </section>
    </div>
  )
}
