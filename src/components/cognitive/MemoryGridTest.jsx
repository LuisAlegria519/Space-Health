import { useEffect, useRef, useState } from 'react'

const CELLS = 16
const START_LEVEL = 3
const MAX_LEVEL = 9
const MAX_STRIKES = 2

const sample = (n) => {
  const pool = [...Array(CELLS).keys()]
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return new Set(pool.slice(0, n))
}

/** Visual working-memory span: recall an increasing number of highlighted cells. Two misses end the test. */
export default function MemoryGridTest({ onComplete }) {
  const [phase, setPhase] = useState('ready') // ready | show | recall | feedback
  const [level, setLevel] = useState(START_LEVEL)
  const [target, setTarget] = useState(new Set())
  const [picked, setPicked] = useState(new Set())
  const [wrongCell, setWrongCell] = useState(null)
  const strikes = useRef(0)
  const best = useRef(START_LEVEL - 1)
  const timer = useRef()

  useEffect(() => () => clearTimeout(timer.current), [])

  const startRound = (n) => {
    setLevel(n)
    setTarget(sample(n))
    setPicked(new Set())
    setWrongCell(null)
    setPhase('show')
    timer.current = setTimeout(() => setPhase('recall'), 900 + n * 250)
  }

  const finish = () => onComplete({ value: best.current, detail: `Span ${best.current} cells · ${strikes.current} miss${strikes.current === 1 ? '' : 'es'}` })

  const pick = (i) => {
    if (phase !== 'recall' || picked.has(i)) return
    if (!target.has(i)) {
      strikes.current += 1
      setWrongCell(i)
      setPhase('feedback')
      timer.current = setTimeout(() => (strikes.current >= MAX_STRIKES ? finish() : startRound(level)), 1000)
      return
    }
    const next = new Set(picked).add(i)
    setPicked(next)
    if (next.size === level) {
      best.current = level
      setPhase('feedback')
      timer.current = setTimeout(() => (level >= MAX_LEVEL ? finish() : startRound(level + 1)), 700)
    }
  }

  const cellClass = (i) => {
    if (phase === 'show' && target.has(i)) return 'bg-violet-400 border-violet-300'
    if (phase === 'feedback' && i === wrongCell) return 'bg-red-500/70 border-red-400'
    if (phase === 'feedback' && target.has(i)) return picked.has(i) ? 'bg-green-500/60 border-green-400' : 'bg-violet-400/40 border-violet-400/60'
    if (picked.has(i)) return 'bg-green-500/60 border-green-400'
    return 'bg-slate-900 border-slate-700 hover:border-slate-500'
  }

  const status =
    phase === 'ready' ? 'Press start, then memorise the lit squares.' : phase === 'show' ? `Memorise ${level} squares…` : phase === 'recall' ? `Tap the ${level} squares (${picked.size}/${level})` : ' '

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm text-slate-400">
        <span aria-live="polite">{status}</span>
        <span>
          Level <span className="font-mono text-slate-100">{level}</span> · misses{' '}
          <span className="font-mono text-slate-100">
            {strikes.current}/{MAX_STRIKES}
          </span>
        </span>
      </div>
      <div className="relative mx-auto grid aspect-square w-full max-w-xs grid-cols-4 gap-2">
        {[...Array(CELLS).keys()].map((i) => (
          <button
            key={i}
            aria-label={`Square ${i + 1}`}
            disabled={phase !== 'recall'}
            onPointerDown={() => pick(i)}
            className={`rounded-lg border-2 transition-colors ${cellClass(i)}`}
          />
        ))}
        {phase === 'ready' && (
          <button
            onClick={() => startRound(START_LEVEL)}
            className="absolute inset-0 flex items-center justify-center rounded-xl bg-slate-950/80 text-lg font-semibold text-slate-300 hover:text-slate-100"
          >
            Press to start
          </button>
        )}
      </div>
    </div>
  )
}
