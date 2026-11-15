import { useCallback, useEffect, useRef, useState } from 'react'
import { Heart, Hexagon, Moon, Star, Sun, Triangle } from 'lucide-react'

const DURATION_S = 45
const SYMBOLS = [Star, Moon, Sun, Triangle, Hexagon, Heart]

const shuffle = (xs) => {
  const a = [...xs]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Digit-symbol-substitution-style task: match symbols to digits using a key, against the clock. */
export default function SymbolMatchTest({ onComplete }) {
  const [key] = useState(() => shuffle([1, 2, 3, 4, 5, 6])) // key[symbolIndex] = digit
  const [started, setStarted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(DURATION_S)
  const [current, setCurrent] = useState(() => Math.floor(Math.random() * SYMBOLS.length))
  const [correct, setCorrect] = useState(0)
  const [wrong, setWrong] = useState(0)
  const [flash, setFlash] = useState(null)
  const endAt = useRef(0)
  const done = useRef(false)

  useEffect(() => {
    if (!started) return
    const id = setInterval(() => setTimeLeft(Math.max(0, Math.ceil((endAt.current - performance.now()) / 1000))), 200)
    return () => clearInterval(id)
  }, [started])

  useEffect(() => {
    if (started && timeLeft === 0 && !done.current) {
      done.current = true
      onComplete({
        value: Math.round(((correct * 60) / DURATION_S) * 10) / 10,
        detail: `${correct} correct · ${wrong} wrong in ${DURATION_S}s`,
      })
    }
  }, [started, timeLeft, correct, wrong, onComplete])

  const start = () => {
    endAt.current = performance.now() + DURATION_S * 1000
    setStarted(true)
  }

  const answer = useCallback(
    (digit) => {
      if (!started || timeLeft === 0) return
      const ok = key[current] === digit
      ok ? setCorrect((c) => c + 1) : setWrong((w) => w + 1)
      setFlash(ok ? 'ok' : 'bad')
      setCurrent((c) => {
        let n = c
        while (n === c) n = Math.floor(Math.random() * SYMBOLS.length)
        return n
      })
    },
    [started, timeLeft, key, current],
  )

  useEffect(() => {
    const onKey = (e) => {
      const d = Number(e.key)
      if (d >= 1 && d <= 6) answer(d)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [answer])

  const Current = SYMBOLS[current]

  return (
    <div className="space-y-4">
      {/* Key */}
      <div className="grid grid-cols-6 gap-2 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
        {SYMBOLS.map((Icon, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <Icon className="h-6 w-6 text-violet-300" />
            <span className="font-mono text-sm text-slate-300">{key[i]}</span>
          </div>
        ))}
      </div>

      {!started ? (
        <button
          onClick={start}
          className="flex h-48 w-full items-center justify-center rounded-2xl border border-slate-800 bg-slate-950/60 text-lg font-semibold text-slate-400 hover:text-slate-200"
        >
          Press to start ({DURATION_S}s)
        </button>
      ) : (
        <>
          <div className="flex items-center justify-between text-sm text-slate-400">
            <span>
              Correct <span className="font-mono text-slate-100">{correct}</span>
            </span>
            <span className="font-mono text-slate-100">{timeLeft}s</span>
          </div>
          <div
            className={`flex h-36 items-center justify-center rounded-2xl border bg-slate-950/60 transition-colors ${
              flash === 'bad' ? 'border-red-500/50' : flash === 'ok' ? 'border-green-500/40' : 'border-slate-800'
            }`}
          >
            <Current className="h-20 w-20 text-violet-300" aria-label="Current symbol" />
          </div>
          <div className="grid grid-cols-6 gap-2">
            {[1, 2, 3, 4, 5, 6].map((d) => (
              <button
                key={d}
                onPointerDown={() => answer(d)}
                className="rounded-xl border border-slate-700 bg-slate-900 py-3 font-mono text-lg text-slate-100 hover:border-slate-500 active:bg-slate-800"
              >
                {d}
              </button>
            ))}
          </div>
          <p className="text-center text-xs text-slate-500">Tap a number or press keys 1–6.</p>
        </>
      )}
    </div>
  )
}
