import { worstStatus } from './triage'

/**
 * Cognitive check-in: three short browser tasks modelled on standard paradigms
 * (psychomotor vigilance, digit-symbol substitution, visual working memory).
 * Status compares a result with the crew member's own pre-flight baseline.
 * These are performance screens, not a measure of intracranial pressure.
 */
export const TESTS = {
  reaction: {
    id: 'reaction',
    title: 'Reaction Time',
    blurb: 'Tap the moment the target appears. Measures alertness and vigilance.',
    name: 'Reaction Time (median)',
    unit: 'ms',
    worse: 'higher',
    yellowPct: 0.1,
    redPct: 0.2,
    simBaseline: 285,
    round: (v) => Math.round(v),
  },
  symbol: {
    id: 'symbol',
    title: 'Symbol Match',
    blurb: 'Match each symbol to its number as fast as you can. Measures processing speed.',
    name: 'Processing Speed',
    unit: 'matches/min',
    worse: 'lower',
    yellowPct: 0.1,
    redPct: 0.2,
    simBaseline: 42,
    round: (v) => Math.round(v * 10) / 10,
  },
  memory: {
    id: 'memory',
    title: 'Memory Grid',
    blurb: 'Remember which squares lit up, then tap them. Measures visual working memory.',
    name: 'Visual Working Memory',
    unit: 'cells',
    worse: 'lower',
    yellowPct: 0.1,
    redPct: 0.25,
    simBaseline: 6,
    round: (v) => Math.round(v),
  },
}

// Simulated history for Astro-01. Factors > 1 mean worse performance. Illustrative
// only: an early-flight dip ("space fog"), partial adaptation, then fatigue creep.
const SIM_SESSIONS = [
  { label: 'L-60', phase: 'pre', factor: 1.0 },
  { label: 'L-30', phase: 'pre', factor: 0.98 },
  { label: 'L-10', phase: 'pre', factor: 1.01 },
  { label: 'FD3', phase: 'flight', factor: 1.14 },
  { label: 'FD30', phase: 'flight', factor: 1.06 },
  { label: 'FD60', phase: 'flight', factor: 1.04 },
  { label: 'FD90', phase: 'flight', factor: 1.05 },
  { label: 'FD120', phase: 'flight', factor: 1.08 },
  { label: 'FD142', phase: 'flight', factor: 1.09 },
]

const simValue = (test, factor) => test.round(test.worse === 'higher' ? test.simBaseline * factor : test.simBaseline * (2 - factor))

export function baselineFor(test) {
  const pre = SIM_SESSIONS.filter((s) => s.phase === 'pre').map((s) => simValue(test, s.factor))
  return test.round(pre.reduce((a, b) => a + b, 0) / pre.length)
}

export function thresholdsFor(test) {
  const b = baselineFor(test)
  const at = (pct) => (test.worse === 'higher' ? b * (1 + pct) : b * (1 - pct))
  return { baseline: b, yellow: at(test.yellowPct), red: at(test.redPct) }
}

export function statusFor(test, value) {
  const b = baselineFor(test)
  const pct = test.worse === 'higher' ? (value - b) / b : (b - value) / b
  if (pct >= test.redPct) return 'red'
  if (pct >= test.yellowPct) return 'yellow'
  return 'green'
}

/** Simulated sessions followed by the user's own sessions for one test. */
export function historyFor(test, sessions) {
  const sim = SIM_SESSIONS.map((s) => ({ label: s.label, phase: s.phase, value: simValue(test, s.factor), you: false }))
  const mine = (sessions[test.id] ?? []).map((s, i) => ({ label: `You ${i + 1}`, phase: 'you', value: s.value, detail: s.detail, you: true }))
  return [...sim, ...mine]
}

export const latestFor = (test, sessions) => historyFor(test, sessions).at(-1)

/** Adds cognitive metrics to the head region and recomputes its overall status. */
export function withCognition(vitals, sessions) {
  const metrics = Object.values(TESTS).map((test) => {
    const latest = latestFor(test, sessions)
    const { baseline } = thresholdsFor(test)
    const sign = test.worse === 'higher' ? '+' : '−'
    return {
      id: `cog-${test.id}`,
      name: test.name,
      value: latest.value,
      unit: test.unit,
      status: statusFor(test, latest.value),
      description: latest.you ? 'From your latest Cognitive Lab session.' : `Simulated session ${latest.label}. Take the test in Cognitive Lab to use your own result.`,
      limitsText: `Baseline ${baseline} · caution ${sign}${test.yellowPct * 100}% · critical ${sign}${test.redPct * 100}%`,
    }
  })
  const head = vitals.head
  const all = [...head.metrics, ...metrics]
  return { ...vitals, head: { ...head, metrics: all, overallStatus: worstStatus(all.map((m) => m.status)) } }
}

const STORAGE_KEY = 'astro-twin.cognition.v1'

export function loadSessions() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {}
  } catch {
    return {}
  }
}

export function saveSessions(sessions) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
  } catch {
    // Storage unavailable (private mode etc.): sessions just won't persist.
  }
}
