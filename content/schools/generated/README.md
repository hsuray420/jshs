# Generated School Data

DO NOT EDIT files in this directory by hand.

These artifacts are regenerated from the enabled regional CSV files declared in
`lib/school-data/regional-loader.mjs` by running `scripts/generate-schools.mjs`.
The production build runs that generation through `pnpm run schools:prepare`
before bundling the site.

Source direction is one-way:

`content/schools/regions/*/*.csv` -> generate -> `content/schools/generated/*`

If a school value needs to change, edit the relevant enabled regional CSV.
