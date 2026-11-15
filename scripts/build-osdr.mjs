// Converts NASA OSDR / ALSDA Inspiration4 lab CSVs into src/data/osdrTimeline.json.
//
// Usage: node scripts/build-osdr.mjs data-raw/osdr/OSD-569_LSDS-7_CBC.csv data-raw/osdr/OSD-575_LSDS-8_CMP.csv
//
// CSV columns: ANALYTE,VALUE,RANGE_MIN,RANGE_MAX,UNITS,TEST_TYPE,SUBJECT_ID,SEX,<timepoint>
import { readFileSync, writeFileSync } from 'node:fs'

const TIMEPOINT_ORDER = ['L-92', 'L-44', 'L-3', 'R+1', 'R+45', 'R+82', 'R+194']

const num = (s) => (s === '' || s === 'NA' ? null : Number(s))

const files = process.argv.slice(2)
if (!files.length) {
  console.error('Pass one or more OSDR CSV paths.')
  process.exit(1)
}

const crew = {}
for (const file of files) {
  const [, ...rows] = readFileSync(file, 'utf8').split(/\r?\n/).filter((l) => l.trim())
  for (const row of rows) {
    const [analyteRaw, value, min, max, units, testType, subject, sex, tp] = row.split(',').map((c) => c.trim())
    if (!TIMEPOINT_ORDER.includes(tp)) throw new Error(`Unknown timepoint "${tp}" in ${file}`)
    // Female-specific reference rows ("HEMOGLOBIN (FEMALE)") describe the same analyte.
    const analyte = analyteRaw.replace(/\s*\(FEMALE\)$/, '')
    const member = (crew[subject] ??= { sex, analytes: {} })
    const series = (member.analytes[analyte] ??= { unit: units, test: testType, values: {} })
    series.values[tp] = { value: num(value), min: num(min), max: num(max) }
  }
}

const out = {
  source: {
    title: 'SpaceX Inspiration4 crew clinical labs (CBC + CMP)',
    repository: 'NASA Open Science Data Repository (OSDR) / Ames Life Sciences Data Archive',
    studies: ['OSD-569 (LSDS-7, Complete Blood Count)', 'OSD-575 (LSDS-8, Comprehensive Metabolic Panel)'],
    url: 'https://osdr.nasa.gov/bio/repo/data/studies/OSD-575',
    mission: 'Inspiration4, 3-day free-flyer orbital mission (Sept 2021)',
    note: 'L-n = days before launch, R+n = days after return. No in-flight samples.',
  },
  timepoints: TIMEPOINT_ORDER,
  crew,
}

writeFileSync(new URL('../src/data/osdrTimeline.json', import.meta.url), JSON.stringify(out, null, 1) + '\n')
console.log(`Wrote ${Object.keys(crew).length} crew x ${TIMEPOINT_ORDER.length} timepoints`)
