import { useCallback, useEffect, useRef, useState } from 'react'

const TRIALS = 8
const LAPSE_MS = 500

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

/** Psychomotor-vigilance-style task: respond as fast as possible to a target after a random delay. */
export default function ReactionTest({ onComplete }) {
  const [phase, setPhase] = useState('ready') // ready | waiting | go
  const [rts, setRts] = useState([])
  const [falseStarts, setFalseStarts] = useState(0)
  const [feedback, setFeedback] = useState(null)
  const shownAt = useRef(0)
  const timer = useRef()

  useEffect(() => () => clearTimeout(timer.current), [])

  const schedule = useCallback(() => {
    setPhase('waiting')
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      shownAt.current = performance.now()
      setPhase('go')
    }, 1500 + Math.random() * 2500)
  }, [])

  const respond = useCallback(() => {
    if (phase === 'ready') return schedule()
    if (phase === 'waiting') {
      setFalseStarts((f) => f + 1)
      setFeedback('Too early. Wait for the target.')
      return schedule()
    }
    const rt = Math.round(performance.now() - shownAt.current)
    const next = [...rts, rt]
    setRts(next)
    setFeedback(`${rt} ms`)
    if (next.length < TRIALS) return schedule()
    const lapses = next.filter((r) => r >= LAPSE_MS).length
    onComplete({
      value: Math.round(median(next)),
      detail: `${TRIALS} trials · ${lapses} lapse${lapses === 1 ? '' : 's'} · ${falseStarts} false start${falseStarts === 1 ? '' : 's'}`,
    })
  }, [phase, rts, falseStarts, schedule, onComplete])

  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Space') {
        e.preventDefault()
        respond()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [respond])

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-400">
        Trial {Math.min(rts.length + 1, TRIALS)} of {TRIALS}. Click, tap or press <kbd className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-xs">Space</kbd>.
      </p>
      <button
        onPointerDown={respond}
        onKeyDown={(e) => e.preventDefault()}
        className={`flex h-64 w-full select-none items-center justify-center rounded-2xl border text-lg font-semibold transition-colors ${
          phase === 'go'
            ? 'border-sky-400 bg-sky-500/20 text-sky-100'
            : 'border-slate-800 bg-slate-950/60 text-slate-500'
        }`}
      >
        {phase === 'ready' && 'Press to start'}
        {phase === 'waiting' && 'Wait…'}
        {phase === 'go' && <span className="h-20 w-20 rounded-full bg-sky-400 shadow-[0_0_40px] shadow-sky-400/60" aria-label="Target" />}
      </button>
      <p className="h-5 text-center font-mono text-sm text-slate-400" aria-live="polite">{feedback}</p>
    </div>
  )
}
