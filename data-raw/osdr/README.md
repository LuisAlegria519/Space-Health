# NASA OSDR / ALSDA source data

Unmodified CSVs downloaded from the NASA Open Science Data Repository (OSDR), which hosts the
Ames Life Sciences Data Archive (ALSDA). They hold SpaceX Inspiration4 crew clinical labs.

| File | Study | Content |
|---|---|---|
| `OSD-569_LSDS-7_CBC.csv` | [OSD-569](https://osdr.nasa.gov/bio/repo/data/studies/OSD-569) | Complete Blood Count |
| `OSD-575_LSDS-8_CMP.csv` | [OSD-575](https://osdr.nasa.gov/bio/repo/data/studies/OSD-575) | Comprehensive Metabolic Panel |

- Crew are anonymised as C001–C004. Timepoints are L-92, L-44, L-3 (days before launch) and R+1, R+45, R+82, R+194 (days after return).
- Inspiration4 was a 3-day mission and **no samples were taken in flight**.
- C003 at L-92 has implausible platelet (12.9) and absolute-neutrophil (10.1) values. The app flags these as "Data check".

Regenerate the app's data with `npm run data:osdr`. That writes `src/data/osdrTimeline.json`.

Citation: use the dataset citation button on each OSDR study page. Repository paper:
*NASA Open Science Data Repository*, Nucleic Acids Research 53 (2025) D1697–D1710, doi:10.1093/nar/gkae1116.
