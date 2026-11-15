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

/** Most severe status in the list; 'none' if every entry is 'none' or the list is empty. */
export const worstStatus = (statuses) =>
  statuses.reduce((a, b) => (getStatus(b).rank > getStatus(a).rank ? b : a), 'none')

/** Returns vitals with each metric's `status`/`threshold` and each region's `overallStatus` derived for `env`. */
export function applyThresholds(vitals, env) {
  return Object.fromEntries(
    Object.entries(vitals).map(([key, region]) => {
      const metrics = region.metrics.map((m) => {
        const t = typeof m.value === 'number' ? env.thresholds[m.id] : undefined
        const op = t?.worse === 'higher' ? '≥' : '≤'
        return {
          ...m,
          status: evaluate(m, env),
          limitsText: t ? `${env.label} limits: caution ${op} ${t.yellow} · critical ${op} ${t.red}` : '',
        }
      })
      return [key, { ...region, metrics, overallStatus: worstStatus(metrics.map((m) => m.status)) }]
    }),
  )
}
