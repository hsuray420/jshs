# Content Architecture Audit

## Scope

Scanned app, components, lib, data for .ts, .tsx, .js and .jsx source files. Generated snapshots and content files are excluded from candidate detection.

## Migrated this round

- Markdown: 6 news articles under content/news/.
- JSON: 7 domain content registries (content/faq/knowledge.json, content/guide/eligibility-topics.json, content/guide/navigation.json, content/guide/workspaces.json, content/features/eligibility-finder.json, content/features/route-pages.json, content/schedule/tasks.json).
- Eligibility workflow configuration: content/guide/eligibility-topics.json.

## Classification summary

| Classification | Count | Meaning |
| --- | ---: | --- |
| Editorial Content | 4 | Content Layer source or renderer-backed editorial content |
| Structured Product Content | 1 | Configurable workflow data, cards, options and steps |
| UI Copy | 42 | Short labels, controls, placeholders and local interaction states |
| Runtime / Business Logic Copy | 20 | Dynamic domain results, validation and API state |
| Unclassified | 0 | Every detected candidate has an explicit classification |

## Candidate review

| File | Classification | Action | Reason |
| --- | --- | --- | --- |
| app/account/[feature]/page.tsx | UI Copy | Retained | 短操作文案、欄位標籤、狀態或互動提示，與 UI／流程緊密耦合。 |
| app/admin/content/page.tsx | UI Copy | Retained | 短操作文案、欄位標籤、狀態或互動提示，與 UI／流程緊密耦合。 |
| app/admin/login/page.tsx | UI Copy | Retained | 短操作文案、欄位標籤、狀態或互動提示，與 UI／流程緊密耦合。 |
| app/admin/page.tsx | UI Copy | Retained | 短操作文案、欄位標籤、狀態或互動提示，與 UI／流程緊密耦合。 |
| app/admission-guides/schedule/page.tsx | UI Copy | Retained | 短操作文案、欄位標籤、狀態或互動提示，與 UI／流程緊密耦合。 |
| app/api/admin/content/route.ts | Runtime / Business Logic Copy | Retained | 由規則、驗證、API 狀態或資料結果即時產生，不是獨立 editorial 內容。 |
| app/api/admin/line/callback/route.ts | Runtime / Business Logic Copy | Retained | 由規則、驗證、API 狀態或資料結果即時產生，不是獨立 editorial 內容。 |
| app/api/assistant/route.ts | Runtime / Business Logic Copy | Retained | 由規則、驗證、API 狀態或資料結果即時產生，不是獨立 editorial 內容。 |
| app/api/school-geocode/route.ts | Runtime / Business Logic Copy | Retained | 由規則、驗證、API 狀態或資料結果即時產生，不是獨立 editorial 內容。 |
| app/districts/page.tsx | UI Copy | Retained | 短操作文案、欄位標籤、狀態或互動提示，與 UI／流程緊密耦合。 |
| app/layout.tsx | UI Copy | Retained | 短操作文案、欄位標籤、狀態或互動提示，與 UI／流程緊密耦合。 |
| app/news/[slug]/page.tsx | Editorial Content | Content Layer | 頁面已由 Content Layer 或既有內容來源提供，source code 僅負責呈現。 |
| app/page.tsx | UI Copy | Retained | 短操作文案、欄位標籤、狀態或互動提示，與 UI／流程緊密耦合。 |
| app/schools/[district]/[code]/page.tsx | UI Copy | Retained | 短操作文案、欄位標籤、狀態或互動提示，與 UI／流程緊密耦合。 |
| app/search/page.tsx | UI Copy | Retained | 短操作文案、欄位標籤、狀態或互動提示，與 UI／流程緊密耦合。 |
| app/trust/[slug]/page.tsx | UI Copy | Retained | 短操作文案、欄位標籤、狀態或互動提示，與 UI／流程緊密耦合。 |
| app/trust/page.tsx | UI Copy | Retained | 短操作文案、欄位標籤、狀態或互動提示，與 UI／流程緊密耦合。 |
| components/account-center.tsx | UI Copy | Retained | 短操作文案、欄位標籤、狀態或互動提示，與 UI／流程緊密耦合。 |
| components/admission-calculator.tsx | UI Copy | Retained | 短操作文案、欄位標籤、狀態或互動提示，與 UI／流程緊密耦合。 |
| components/admission-history-explorer.tsx | UI Copy | Retained | 短操作文案、欄位標籤、狀態或互動提示，與 UI／流程緊密耦合。 |
| components/admission-path-finder.tsx | Editorial Content | Content Layer | 頁面已由 Content Layer 或既有內容來源提供，source code 僅負責呈現。 |
| components/ai-assistant.tsx | UI Copy | Retained | 短操作文案、欄位標籤、狀態或互動提示，與 UI／流程緊密耦合。 |
| components/ai-chat-markdown.tsx | UI Copy | Retained | 短操作文案、欄位標籤、狀態或互動提示，與 UI／流程緊密耦合。 |
| components/alumni-sharing.tsx | UI Copy | Retained | 短操作文案、欄位標籤、狀態或互動提示，與 UI／流程緊密耦合。 |
| components/commute-comparison.tsx | UI Copy | Retained | 短操作文案、欄位標籤、狀態或互動提示，與 UI／流程緊密耦合。 |
| components/district-gate.tsx | UI Copy | Retained | 短操作文案、欄位標籤、狀態或互動提示，與 UI／流程緊密耦合。 |
| components/eligibility-checker.tsx | UI Copy | Retained | 短操作文案、欄位標籤、狀態或互動提示，與 UI／流程緊密耦合。 |
| components/feature-illustrations.tsx | UI Copy | Retained | 短操作文案、欄位標籤、狀態或互動提示，與 UI／流程緊密耦合。 |
| components/home-next-step.tsx | UI Copy | Retained | 短操作文案、欄位標籤、狀態或互動提示，與 UI／流程緊密耦合。 |
| components/home-progress.tsx | UI Copy | Retained | 短操作文案、欄位標籤、狀態或互動提示，與 UI／流程緊密耦合。 |
| components/interactive-rule-table.tsx | UI Copy | Retained | 短操作文案、欄位標籤、狀態或互動提示，與 UI／流程緊密耦合。 |
| components/knowledge-topic-workspace.tsx | Editorial Content | Content Layer | 頁面已由 Content Layer 或既有內容來源提供，source code 僅負責呈現。 |
| components/notification-center.tsx | UI Copy | Retained | 短操作文案、欄位標籤、狀態或互動提示，與 UI／流程緊密耦合。 |
| components/official-information-explorer.tsx | UI Copy | Retained | 短操作文案、欄位標籤、狀態或互動提示，與 UI／流程緊密耦合。 |
| components/planner-export-workspace.tsx | UI Copy | Retained | 短操作文案、欄位標籤、狀態或互動提示，與 UI／流程緊密耦合。 |
| components/planner-hub.tsx | UI Copy | Retained | 短操作文案、欄位標籤、狀態或互動提示，與 UI／流程緊密耦合。 |
| components/planner-mode-workspace.tsx | Structured Product Content | Review / migrated | 流程設定、步驟或選項屬可維護的產品資料；已抽離者由 domain JSON 提供，其餘為動態流程資料。 |
| components/planner-versions.tsx | UI Copy | Retained | 短操作文案、欄位標籤、狀態或互動提示，與 UI／流程緊密耦合。 |
| components/schedule-workspace.tsx | Editorial Content | Content Layer | 頁面已由 Content Layer 或既有內容來源提供，source code 僅負責呈現。 |
| components/school-alumni-explorer.tsx | UI Copy | Retained | 短操作文案、欄位標籤、狀態或互動提示，與 UI／流程緊密耦合。 |
| components/school-comparison-explorer.tsx | UI Copy | Retained | 短操作文案、欄位標籤、狀態或互動提示，與 UI／流程緊密耦合。 |
| components/school-cost-planner.tsx | UI Copy | Retained | 短操作文案、欄位標籤、狀態或互動提示，與 UI／流程緊密耦合。 |
| components/school-decision-actions.tsx | UI Copy | Retained | 短操作文案、欄位標籤、狀態或互動提示，與 UI／流程緊密耦合。 |
| components/school-explorer.tsx | UI Copy | Retained | 短操作文案、欄位標籤、狀態或互動提示，與 UI／流程緊密耦合。 |
| components/school-map-explorer.tsx | UI Copy | Retained | 短操作文案、欄位標籤、狀態或互動提示，與 UI／流程緊密耦合。 |
| components/score-workspaces.tsx | UI Copy | Retained | 短操作文案、欄位標籤、狀態或互動提示，與 UI／流程緊密耦合。 |
| components/site-footer.tsx | UI Copy | Retained | 短操作文案、欄位標籤、狀態或互動提示，與 UI／流程緊密耦合。 |
| components/site-header.tsx | UI Copy | Retained | 短操作文案、欄位標籤、狀態或互動提示，與 UI／流程緊密耦合。 |
| components/site-intro-modal.tsx | UI Copy | Retained | 短操作文案、欄位標籤、狀態或互動提示，與 UI／流程緊密耦合。 |
| components/special-qualification-workspace.tsx | UI Copy | Retained | 短操作文案、欄位標籤、狀態或互動提示，與 UI／流程緊密耦合。 |
| components/ui/layout.tsx | UI Copy | Retained | 短操作文案、欄位標籤、狀態或互動提示，與 UI／流程緊密耦合。 |
| lib/admission-path-engine.ts | Runtime / Business Logic Copy | Retained | 由規則、驗證、API 狀態或資料結果即時產生，不是獨立 editorial 內容。 |
| lib/admission-schedules.ts | Runtime / Business Logic Copy | Retained | 由規則、驗證、API 狀態或資料結果即時產生，不是獨立 editorial 內容。 |
| lib/admission-score.ts | Runtime / Business Logic Copy | Retained | 由規則、驗證、API 狀態或資料結果即時產生，不是獨立 editorial 內容。 |
| lib/assistant-knowledge.ts | Runtime / Business Logic Copy | Retained | 由規則、驗證、API 狀態或資料結果即時產生，不是獨立 editorial 內容。 |
| lib/assistant-policy.ts | Runtime / Business Logic Copy | Retained | 由規則、驗證、API 狀態或資料結果即時產生，不是獨立 editorial 內容。 |
| lib/assistant-quota.ts | Runtime / Business Logic Copy | Retained | 由規則、驗證、API 狀態或資料結果即時產生，不是獨立 editorial 內容。 |
| lib/content/markdown.ts | Runtime / Business Logic Copy | Retained | 由規則、驗證、API 狀態或資料結果即時產生，不是獨立 editorial 內容。 |
| lib/content/schema.ts | Runtime / Business Logic Copy | Retained | 由規則、驗證、API 狀態或資料結果即時產生，不是獨立 editorial 內容。 |
| lib/github-sync.ts | Runtime / Business Logic Copy | Retained | 由規則、驗證、API 狀態或資料結果即時產生，不是獨立 editorial 內容。 |
| lib/line.ts | Runtime / Business Logic Copy | Retained | 由規則、驗證、API 狀態或資料結果即時產生，不是獨立 editorial 內容。 |
| lib/official-information.ts | Runtime / Business Logic Copy | Retained | 由規則、驗證、API 狀態或資料結果即時產生，不是獨立 editorial 內容。 |
| lib/planner-health.ts | Runtime / Business Logic Copy | Retained | 由規則、驗證、API 狀態或資料結果即時產生，不是獨立 editorial 內容。 |
| lib/rule-display.ts | Runtime / Business Logic Copy | Retained | 由規則、驗證、API 狀態或資料結果即時產生，不是獨立 editorial 內容。 |
| lib/school-directory.ts | Runtime / Business Logic Copy | Retained | 由規則、驗證、API 狀態或資料結果即時產生，不是獨立 editorial 內容。 |
| lib/search-index.ts | Runtime / Business Logic Copy | Retained | 由規則、驗證、API 狀態或資料結果即時產生，不是獨立 editorial 內容。 |
| lib/trust-registry.ts | Runtime / Business Logic Copy | Retained | 由規則、驗證、API 狀態或資料結果即時產生，不是獨立 editorial 內容。 |

## Retained Hardcoded Content Policy

### Allowed in source

- Button, tab, field and action labels.
- Input placeholders and accessibility labels.
- Loading, empty, error and short validation messages.
- Modal and dialog actions.
- Runtime status and domain-result copy that depends on user input, calculated values, validation state or API state.
- Developer-only text, SQL, regex, generated files and source registries.

### Must use Content Layer

- Articles, news, guides, FAQs and multi-paragraph explanations.
- Maintainable instructional content, policy/year-sensitive editorial text and source-backed explanations.
- Reusable checklists, onboarding steps, concept cards, tool help collections and other structured product content.

## Guard behavior

Run pnpm run audit:content to regenerate this report. It is a review aid, not a build failure gate; candidates require human classification.
