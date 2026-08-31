# Feature Depth Batch 2 — TDD evidence

Source: Batch 2 remediation brief supplied on 2026-08-31.

| Guarantee | Test | RED | GREEN |
| --- | --- | --- | --- |
| Chinese PDF contract contains a Traditional-Chinese PDF font and page support | `tests/feature-depth-batch2.test.mjs` | 7/7 failed before implementation | 7/7 passed |
| Tasks and personal open-day records have the requested lifecycle and local persistence | Unit + `tests/feature-depth-batch2.browser.mjs` | Missing controls | Browser lifecycle passed |
| Map metadata, account/channel states, and AI safety modes are explicit | Unit test | Missing contracts | Passed |

Final validation: `pnpm test` and the Batch 2 Chromium script. Browser scenarios passed for tasks, open days, PDF download bytes, account/notifications, and map coordinate states. Live LINE OAuth, Workers AI, map-provider availability, and multi-reader PDF rendering remain documented backlog items.
