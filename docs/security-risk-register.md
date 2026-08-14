# Security risk register

Last reviewed: 2026-08-14

## SR-001 — `image-size@2.0.2` parser denial of service

- Severity: High (two GitHub-reviewed advisories)
- Advisories: [GHSA-w3rx-r6r6-pgpr](https://github.com/advisories/GHSA-w3rx-r6r6-pgpr), [GHSA-5p2g-fcmc-qvqq](https://github.com/advisories/GHSA-5p2g-fcmc-qvqq)
- Dependency path: `vinext@0.0.50 > image-size@2.0.2`
- Upstream status: no patched npm release exists as of 2026-08-14; `vinext@1.0.0-beta.5` also pins `image-size@2.0.2`.
- Exposure: Vinext calls `image-size` while building repository-controlled static images and metadata. The deployed Worker image-optimization path does not use this parser, and admin uploads are stored in R2 without being passed to it.
- Temporary control: never pass user-controlled image bytes or paths into Vinext build/metadata inputs. Keep production builds limited to reviewed repository assets.
- Exit condition: upgrade as soon as a fixed `image-size` release and compatible Vinext version are available, then remove this entry after `pnpm audit --audit-level high` passes.
- Next review: 2026-08-21

This is a time-bounded risk acceptance, not a claim that the advisory is resolved.
