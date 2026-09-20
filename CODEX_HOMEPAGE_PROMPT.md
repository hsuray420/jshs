# Codex — JSHS.CC Homepage Final Pixel Pass

Read `AGENTS.md`, `HOMEPAGE_PIXEL_SPEC.md`, `HOMEPAGE_ASSET_MANIFEST.json`, and inspect every file in `docs/design-reference/homepage/` before editing.

Rebuild `/` to match `homepage-master-reference.jpg`. This is a canonical layout specification, not a style reference. Do not reinterpret it.

Use `hero-students-production.png` as the hero asset. School-card crops are reference-only; real school cards must use admin-approved imagery/fallback.

Match all controllable geometry and styling. At the same time, audit actual routes/data and remove every unsupported statistic, fake product capability, placeholder feature, or unverified claim. Visual fidelity never permits factual fabrication.

Do not modify unrelated `/schools`, school-detail, data-pipeline, comparison or API behavior.

After implementation, use production-like preview and perform desktop + mobile visual comparison. Keep correcting controllable differences until you can truthfully report `Controllable visual differences: NONE`.

Then run typecheck, lint, relevant tests, build, runtime-console check and `git diff --check`. Run data validation if affected.

Do not commit, push or deploy. Final report must list remaining visual differences, accepted content-dependent differences, unsupported claims removed, files changed and all check results.
