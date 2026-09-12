# Generated School Data

DO NOT EDIT files in this directory by hand.

GENERATED FROM CSV.

These artifacts are regenerated from the regional CSV files marked
`schoolDataStatus: "available"` in `content/schools/region-registry.json` by
running `scripts/generate-schools.mjs`.
The production build runs that generation through `pnpm run schools:prepare`
before bundling the site.

`school-search-index.json` is the lightweight runtime search artifact.
Full school detail records are generated for static per-school lazy loading and
must not be rebuilt inside production search requests.

Source direction is one-way:

`content/schools/region-registry.json` -> available regional CSV -> generate -> `content/schools/generated/*`

If a school value needs to change, edit the relevant enabled regional CSV.
