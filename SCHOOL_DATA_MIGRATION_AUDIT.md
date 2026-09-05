# School Data Migration Audit

## Completed migration

| Previous surface | Previous source | Replacement | Result |
|---|---|---|---|
| `lib/school-directory.ts` | 15 regional school CSV imports | `lib/school-repository.ts` | Removed. |
| `public/it_hs/school-directory.json` | Derived regional directory | `content/schools/generated/schools.json` | Removed. |
| `/schools`, detail, map, compare, commute | `SchoolDirectoryRecord` | `School` / `SchoolSummary`, keyed by `學校代碼` | Migrated. |
| `/api/schools.csv` | Per-district CSV asset selected by query | Canonical `schools_master.csv` | Migrated. |
| Sitemap and Search V2 | District/code identity | School-code identity | Migrated. |

## Retained files that are outside national school discovery

The `public/it_hs/*/schools*.csv` files remain only as historical inputs for
district-specific admission tools and maintenance scripts. They are not
imported by the national repository, `/schools`, school detail pages, map,
comparison, commute, Search V2, sitemap, or the compatibility download API.

`admission-history.csv` remains separate historical reference material. It is
not merged into the 115 school entity or presented as an official current
admission score. `data/school-life/` remains a research ledger and does not
overwrite any field from either canonical CSV.

## Legacy score and rank audit

The national school surfaces do not render `排名`, `排序分數`, historical
admission scores, or estimated admission scores. The master-file ranking field
is preserved as raw source data only. Community alumni submissions may retain a
person's own historical experience, clearly labelled non-official and isolated
from the school entity.
