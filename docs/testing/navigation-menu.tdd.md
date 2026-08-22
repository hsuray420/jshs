# 全站選單導覽 TDD 驗證紀錄

本次導覽實作以 `docs/升學平台競品分析與產品規劃報告.md` 的網站地圖為規格來源，保留「升學指南、找校科、試算工具、我的規劃」四個主任務中心，並將「就學區、查詢與百科、關於與信任」收納在「更多」，讓完整功能可被找到，同時維持主要導覽的方向感。

## RED

先新增 `tests/navigation-menu.test.mjs`，要求 `content/site-map.json` 提供五組完整選單、遞迴包含網站地圖中的必要項目，並要求 Header/Footer 使用同一份選單模型。初次執行：

```text
pnpm exec node --test tests/navigation-menu.test.mjs
結果：失敗（menuGroups 尚未存在）
```

## GREEN

完成 `menuGroups` 資料模型、桌機 mega menu、手機 `<details>` 副選單、不可用功能的「功能準備中」狀態，以及 Footer 導覽後，目標測試通過：

```text
pnpm exec node --test tests/navigation-menu.test.mjs tests/information-architecture.test.mjs tests/functional-navigation.test.mjs
結果：15/15 通過
```

## 回歸驗證

```text
pnpm run test:unit       57/57 通過
pnpm run typecheck       通過
pnpm run validate:content 通過（15 個就學區）
pnpm run lint            通過（0 errors；15 個既有 warnings）
pnpm run build           通過
git diff --check         通過
```

目前測試以資料模型、元件原始碼與既有導覽契約為主；實際校科搜尋、積分計算、規劃儲存等功能仍依產品報告的後續階段逐步開放，選單已先提供完整且可理解的入口狀態。
