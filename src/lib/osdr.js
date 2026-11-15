import { worstStatus } from './triage'

/**
 * Maps real Inspiration4 lab analytes (NASA OSDR/ALSDA) onto the avatar's body regions.
 * Bloodwork has no neuro-ocular markers, so the head region has no data in this mode.
 */
const REGION_MAP = {
  head: {
    label: 'Brain & Vision',
    emptyNote: 'Inspiration4 clinical bloodwork contains no neuro-ocular (SANS) markers.',
    analytes: [],
  },
  heart: {
    label: 'Blood & Cardiovascular',
    analytes: [
      ['HEMOGLOBIN', 'Hemoglobin', 'Oxygen-carrying capacity; spaceflight is linked to red-cell destruction ("space anemia").'],
      ['HEMATOCRIT', 'Hematocrit', 'Share of blood volume that is red cells; shifts with plasma volume loss in flight.'],
      ['RED BLOOD CELL COUNT', 'Red Blood Cells', 'Tracks post-flight anemia and recovery.'],
      ['PLATELET COUNT', 'Platelets', 'Clotting capacity.'],
    ],
  },
  musculoskeletal: {
    label: 'Musculoskeletal',
    analytes: [
      ['CALCIUM', 'Serum Calcium', 'Bone resorption in weightlessness releases calcium into the blood.'],
      ['ALKALINE PHOSPHATASE', 'Alkaline Phosphatase', 'Enzyme marker of bone formation / turnover.'],
      ['CREATININE', 'Creatinine', 'Muscle metabolism by-product (also reflects kidney function).'],
    ],
  },
  fullbody: {
    label: 'Immune',
    iconKey: 'immune',
    emptyNote: 'Radiation dose is not part of this dataset.',
    analytes: [
      ['WHITE BLOOD CELL COUNT', 'White Blood Cells', 'Overall immune cell count.'],
      ['ABSOLUTE LYMPHOCYTES', 'Lymphocytes', 'Adaptive immunity; sensitive to radiation and flight stress.'],
      ['ABSOLUTE NEUTROPHILS', 'Neutrophils', 'First-line immunity; often rises with stress around launch and landing.'],
    ],
  },
}

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b)
  return s[Math.floor(s.length / 2)]
}

/**
 * green = inside the lab reference range; yellow = outside by <=10% of the limit;
 * red = further out; none = no value; check = likely data-entry error (>5x off
 * this crew member's own median for the analyte).
 */
function labStatus(point, series) {
  if (!point || point.value == null) return { status: 'none', suspect: false }
  const all = Object.values(series.values).map((p) => p.value).filter((v) => v != null)
  const m = median(all)
  if (point.value > m * 5 || point.value < m / 5) return { status: 'check', suspect: true }
  const { value, min, max } = point
  if (value >= min && value <= max) return { status: 'green', suspect: false }
  const limit = value < min ? min : max
  return { status: Math.abs(value - limit) / limit <= 0.1 ? 'yellow' : 'red', suspect: false }
}

const fmt = (n) => (Number.isInteger(n) ? String(n) : String(+n.toFixed(2)))

/** Builds the same `vitals` shape AstroAvatar/MissionDashboard use, for one crew member at one timepoint. */
export function buildOsdrVitals(osdr, crewId, timepoint) {
  const member = osdr.crew[crewId]
  const baselineTp = osdr.timepoints[0]
  return Object.fromEntries(
    Object.entries(REGION_MAP).map(([key, region]) => {
      const metrics = region.analytes
        .filter(([id]) => member.analytes[id])
        .map(([id, name, description]) => {
          const series = member.analytes[id]
          const point = series.values[timepoint]
          const base = series.values[baselineTp]?.value
          const { status, suspect } = labStatus(point, series)
          const parts = []
          if (point?.min != null) parts.push(`Ref range ${fmt(point.min)}–${fmt(point.max)}`)
          if (base != null && timepoint !== baselineTp && point?.value != null && !suspect) {
            const d = point.value - base
            parts.push(`${d >= 0 ? '+' : '−'}${fmt(Math.abs(d))} vs ${baselineTp} baseline`)
          }
          return {
            id,
            name,
            value: point?.value ?? '—',
            unit: series.unit,
            status,
            description: suspect ? `${description} ⚠ Value is far outside this crew member's other readings; likely a data-entry error in the source file.` : description,
            limitsText: parts.join(' · '),
          }
        })
      return [key, { label: region.label, iconKey: region.iconKey, metrics, emptyNote: region.emptyNote, overallStatus: worstStatus(metrics.map((m) => m.status)) }]
    }),
  )
}

export function describeTimepoint(tp) {
  const m = /^([LR])([+-])(\d+)$/.exec(tp)
  if (!m) return tp
  const days = Number(m[3])
  return m[1] === 'L'
    ? `${days} day${days === 1 ? '' : 's'} before launch`
    : `${days} day${days === 1 ? '' : 's'} after return`
}
