# Generated Public Data

DO NOT EDIT files in this directory by hand.

`schools.json` and `schools.csv` are public generated artifacts derived from the
enabled regional CSV files under `content/schools/regions/`. They are refreshed
by `pnpm run schools:prepare`, which is part of `pnpm run build`.

Source direction is one-way:

`content/schools/regions/*/*.csv` -> generate -> `public/data/schools.*`
