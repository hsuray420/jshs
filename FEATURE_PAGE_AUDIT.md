# Feature Page Visual Audit

Audit sources: App Router routes, desktop/mobile header groups, home links, feature links and compatibility redirects. `COMPLETE` means theme, Hero, illustration and direct workspace are all present; redirects intentionally inherit their destination.

| Route | Page name | Parent feature | Type | Hero | Illustration | Theme | Workspace | Status |
|---|---|---|---|---|---|---|---|---|
| `/schools` | 找學校 | 找學校 | FUNCTION_PAGE | FeatureHero | school-search | BLUE | school explorer | COMPLETE |
| `/schools/history` | 歷年錄取 | 找學校 | FUNCTION_PAGE | FeatureHero | admissions-history | BLUE | history filters/results | COMPLETE |
| `/schools/map` | 學校地圖 | 找學校 | FUNCTION_PAGE | FeatureHero | school-map | BLUE | map workspace | COMPLETE |
| `/schools/compare` | 學校比較 | 找學校 | FUNCTION_PAGE | FeatureHero | school-compare | BLUE | selector/comparison | COMPLETE |
| `/schools/commute` | 通勤比較 | 找學校 | FUNCTION_PAGE | FeatureHero | commute | BLUE | route comparison | COMPLETE |
| `/schools/cost` | 費用試算 | 找學校 | FUNCTION_PAGE | FeatureHero | cost-calculator | BLUE | calculator/result | COMPLETE |
| `/schools/alumni` | 學長姐分享 | 找學校 | FUNCTION_PAGE | FeatureHero | alumni | BLUE | community explorer | COMPLETE |
| `/schools/open-days` | 校園開放日 | 找學校 | FUNCTION_PAGE | FeatureHero | open-day | BLUE | calendar workspace | COMPLETE |
| `/schools/groups` | 群科介紹 | 找學校 | CONTENT_PAGE | CompactFeatureHero | career-groups | BLUE | reading navigation | COMPLETE |
| `/schools/[district]`, `/schools/[district]/[code]` | 學校／校科頁 | 找學校 | CONTENT_PAGE | legacy | none | BLUE | detail content | PARTIAL |
| `/tools` | 算成績 | 算成績 | FUNCTION_PAGE | FeatureHero | score-calculator | GREEN | step calculator | COMPLETE |
| `/tools/rules` | 積分規則 | 算成績 | FUNCTION_PAGE | FeatureHero | score-rules | GREEN | rule table | COMPLETE |
| `/tools/placement` | 模擬考落點 | 算成績 | FUNCTION_PAGE | FeatureHero | placement | GREEN | guarded placement workspace | COMPLETE |
| `/tools/summary` | 個人積分摘要 | 算成績 | FUNCTION_PAGE | FeatureHero | score-summary | GREEN | saved score summary | COMPLETE |
| `/tools/history` | 成績歷史 | 算成績 | FUNCTION_PAGE | FeatureHero | score-history | GREEN | saved score history | COMPLETE |
| `/planner`, `/planner/custom`, `/planner/recommend` | 我的志願 | 我的志願 | FUNCTION_PAGE | FeatureHero | planner / planner-recommendation | AMBER | planner board | COMPLETE |
| `/planner/versions`, `/planner/export`, `/planner/official-platform` | 版本／匯出／官方選填 | 我的志願 | FUNCTION_PAGE | legacy | partial | AMBER | versions/export/links | PARTIAL |
| `/schedule`, `/schedule/timeline`, `/schedule/now`, `/schedule/tasks` | 升學日程 | 升學日程 | FUNCTION_PAGE | FeatureHero | schedule / timeline / schedule-now / todo | PURPLE | schedule workspace | COMPLETE |
| `/schedule/compare`, `/schedule/countdown`, `/schedule/export`, `/schedule/open-days` | compatibility routes | 升學日程 | FUNCTION_PAGE | redirect | destination | destination | redirect | COMPLETE |
| `/admission-guides` | 官方簡章與規則 | 官方資訊 | FUNCTION_PAGE | FeatureHero | official-document | BLUE | guide library | COMPLETE |
| `/admission-guides/schedule`, `/news`, `/news/*` | 公告／文章 | 官方資訊 | CONTENT_PAGE | legacy | none | BLUE | information/article | PARTIAL |
| `/knowledge` | 升學指南 | 升學指南 | CONTENT_PAGE | FeatureHero | guide | PURPLE | guide navigation | COMPLETE |
| `/knowledge/[topic]`, `/knowledge/updates` | 指南主題／動態 | 升學指南 | CONTENT_PAGE | CompactFeatureHero / legacy | topic illustration / none | PURPLE | reading content | PARTIAL |
| `/eligibility`, `/eligibility/[topic]` | 特殊入學與資格 | 升學指南 | FUNCTION_PAGE | FeatureHero / legacy | eligibility / none | PURPLE | path finder/content | PARTIAL |
| `/trust`, `/trust/[slug]` | 資料與信任 | 資料與信任 | FUNCTION_PAGE / CONTENT_PAGE | legacy | none | SLATE | source/status/capability | MISSING |
| `/ai`, `/districts`, `/search`, `/support`, `/account`, `/notifications` | 其他功能 | 其他 | FUNCTION_PAGE | legacy / app shell | partial | SLATE | individual tools | PARTIAL |

## Coverage gate

Header and mobile menu destination routes were checked against theme + hero + illustration + workspace. Compatibility redirects are complete through their canonical destination. The rows marked `PARTIAL` or `MISSING` are deliberately not presented as rollout complete and remain the Phase C follow-up list.

## Presentation scan rules

- Do not expose calculation identifiers, function names, schema keys, raw enums, JSON, `undefined`, `null`, `NaN`, or `[object Object]` in customer UI.
- Use a display-only mapping for calculation explanations; it must never affect score semantics.
- A complete result must never be accompanied by an “尚未計算” summary; raw / placeholder tie-breaker labels must disclose their actual data status.
- Preserve visible official/JSHS/community and VERIFIED/PARTIAL/previous-year status cues.
