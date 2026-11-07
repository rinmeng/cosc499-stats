# COSC 499 grade data

One file per session (`2023W` = winter 2023–24, `2023S` = summer 2023), holding the
COSC 499 rows only: professor(s), class size, average, high/low and the grade spread.
Newer sessions also have median and percentiles; older ones have standard deviation.

## Source

- **Origin:** UBC PAIR [Grade Distribution Report](https://reports.im.it.ubc.ca/t/Learner/views/GradeDistributionReport/GradeDistributionReport)
  (public, published by UBC).
- **Dataset:** [DonneyF/ubc-pair-grade-data](https://github.com/DonneyF/ubc-pair-grade-data)
  by Donney Fan, which collects the report as CSVs.
- **Fetched from:** the [UBCGrades API](https://ubcgrades.com/api-reference), which
  serves that dataset (`v3` for 2021S onward, `v2` for older sessions).

Each file's `source` field records the API version and fetch date.

## Notes

- PAIR hides any grade range with fewer than 6 students, so some counts may be filled
  in or missing.
- Older sessions (up to 2021) may list TAs alongside professors.
- 2024S and 2024W have no professor listed in PAIR.
- The dataset is updated about once a year. Run `pnpm sync:grades` to fetch new
  sessions; `--force` re-fetches all of them.
