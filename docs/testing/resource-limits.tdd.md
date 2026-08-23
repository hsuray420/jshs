# Worker resource-limit optimization

## User journey

As a visitor, I want the school search page to load without making the Worker serialize the entire national directory, so that repeated visits do not trigger Cloudflare Error 1102.

As a site owner, I want anonymous public HTML to be edge-cacheable while authenticated, API, RSC, and share routes remain dynamic, so that traffic spikes do not repeatedly consume Worker CPU.

## Evidence

| Guarantee | Test | Result |
| --- | --- | --- |
| The school explorer dataset contains all 604 records but only the fields needed by the browser list. | `tests/resource-limits.test.mjs` | PASS |
| `/schools` no longer imports or passes `schoolDirectory` as an SSR prop. | `tests/resource-limits.test.mjs` | PASS |
| Public document responses use `s-maxage=60` and `stale-while-revalidate=300`, while cookie/RSC requests are excluded. | `tests/resource-limits.test.mjs` | PASS |
| Existing school-center, navigation, trust, and Cloudflare-native contracts remain valid. | `node --test tests/*.test.mjs` | PASS, 72/72 |
| The production bundle builds and Wrangler accepts the generated deployment. | `pnpm run build`; `pnpm exec wrangler deploy --dry-run --outdir /tmp/jshs-wrangler-out` | PASS |

## TDD checkpoints

- RED: the new resource-limit tests failed because the compact asset and cache policy were absent.
- GREEN: after the asset generator, client-side loading, and Worker cache policy were added, the same tests passed.
- Refactor/verification: typecheck passed; lint passed with 15 pre-existing warnings in `public/` scripts; production build and local Wrangler requests passed.

## Known gaps

The local `vinext start` command cannot boot this Cloudflare build directly because Node's default loader does not understand the `cloudflare:` scheme. `wrangler dev --local` was used instead. Production Workers Logs should still be checked after release for `exceededCpu` versus `exceededMemory` and for the new `x-jshs-cache-policy` response behavior.
