# Cloudflare Direct Route TDD Evidence

## Source plan

Derived from the request to move the production project directly to Cloudflare
and serve only `jshs.cc`, without R2 or a mirror deployment.

## User journey

As a visitor to `jshs.cc`, I receive the current application from the
production Worker so that the public homepage and the existing高中職指南 use one
verified deployment path.

## RED → GREEN evidence

| Guarantee | Test | RED evidence | GREEN evidence |
| --- | --- | --- | --- |
| The Worker takes over the active `jshs.cc` zone through a route, not a custom-domain DNS mutation. | `production Worker route takes over the existing jshs.cc zone without R2` | The new test failed because the configuration still declared `jshs.cc` and `www.jshs.cc` as custom domains. | The same test passed after the route became `jshs.cc/*` with the active zone ID. |
| The release configuration does not declare R2. | Same test | The contract was added before configuration was changed. | The passing JSON assertion confirms no `r2_buckets` declaration exists. |

## Validation

- `node --test tests/rendered-html.test.mjs` — 12/12 passed after the route change.
- `pnpm test` — content trust validation, typecheck, build, and 29/29 tests passed.
- `pnpm lint` — completed with 15 existing warnings and no errors.
- `node --test --experimental-test-coverage tests/rendered-html.test.mjs` — 100% for the executed configuration-contract test surface.
- `pnpm audit --prod` — no known vulnerabilities.
- Cloudflare deployment completed with `jshs.cc/*` attached to the production Worker.
- Public checks returned HTTP 200 for `/` and `/it_hs/it_hs.html?district=ct`; the guide resolved to `/it_hs/guide.htm` and the district metadata response included the current release header.

## Known gap

Browser-rendered responsive QA could not run because no browser surface was
available in this session. The public HTTP and content contracts were verified.
