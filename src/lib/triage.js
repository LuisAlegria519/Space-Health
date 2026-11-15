import { getStatus } from '../constants/status'

/**
 * Status for one metric in an environment. Numeric metrics with a threshold
 * entry are evaluated live; anything else falls back to its static `status`.
 */
export function evaluate(metric, env) {
  const t = env.thresholds[metric.id]
  if (!t || typeof metric.value !== 'number') return metric.status ?? 'green'
  const past = (limit) => (t.worse === 'higher' ? metric.value >= limit : metric.value <= limit)
  if (past(t.red)) return 'red'
  if (past(t.yellow)) return 'yellow'
  return 'green'
}

const worst = (statuses) =>
  statuses.reduce((a, b) => (getStatus(b).rank > getStatus(a).rank ? b : a), 'green')

/** Returns vitals with each metric's `status`/`threshold` and each region's `overallStatus` derived for `env`. */
export function applyThresholds(vitals, env) {
  return Object.fromEntries(
    Object.entries(vitals).map(([key, region]) => {
      const metrics = region.metrics.map((m) => ({
        ...m,
        status: evaluate(m, env),
        threshold: typeof m.value === 'number' ? env.thresholds[m.id] : undefined,
      }))
      return [key, { ...region, metrics, overallStatus: worst(metrics.map((m) => m.status)) }]
    }),
  )
}
