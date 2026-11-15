import { Bone, Brain, HeartPulse, Radiation, ShieldPlus } from 'lucide-react'

// Triage palette (hex values used for SVG fills; Tailwind classes for UI chrome).
export const STATUS = {
  green: { hex: '#22c55e', label: 'Nominal', rank: 0, text: 'text-green-400', bg: 'bg-green-500/10', ring: 'ring-green-500/40' },
  yellow: { hex: '#eab308', label: 'Caution', rank: 1, text: 'text-yellow-400', bg: 'bg-yellow-500/10', ring: 'ring-yellow-500/40' },
  red: { hex: '#ef4444', label: 'Critical', rank: 2, text: 'text-red-400', bg: 'bg-red-500/10', ring: 'ring-red-500/40' },
}

// "No data / data check": not part of the triage legend.
export const NO_DATA = { hex: '#475569', label: 'No data', rank: -1, text: 'text-slate-400', bg: 'bg-slate-500/10', ring: 'ring-slate-500/40' }

export const DATA_CHECK = { ...NO_DATA, label: 'Data check' }

export const getStatus = (status) => STATUS[status] ?? (status === 'check' ? DATA_CHECK : NO_DATA)

export const REGION_ICONS = {
  head: Brain,
  heart: HeartPulse,
  musculoskeletal: Bone,
  fullbody: Radiation,
  immune: ShieldPlus,
}

/** Icon for a region; a region object may override its key via `iconKey`. */
export const regionIcon = (key, region) => REGION_ICONS[region?.iconKey ?? key]
