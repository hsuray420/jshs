// Compatibility command only: the national repository is generated from the two canonical CSVs.
// Never recreate public/it_hs/school-directory.json or read regional school CSVs here.
await import('./generate-schools.mjs');
