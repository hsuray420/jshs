# 116 學年度升學工具核對與驗收摘要

本工具定位為「116 學年度升學準備參考工具」。目前計算依 115 學年度各區官方公開資料整理；116 學年度正式簡章、名額、志願規則與期限公布後，仍須以各區招生委員會公告為準。試算結果不等同正式分發結果。

## 15 區規則核對表

| 就學區 | 115 總分上限 | 官方來源 | 最後核對 | 狀態 |
|---|---:|---|---|---|
| 基北區 | 108 | [招生委員會公告](https://ttk.entry.edu.tw/NoExamImitate_TP/NoExamImitate/Apps/Page/Public/News.aspx?SEQNO=9) | 2026-08-27 | 待確認 |
| 桃連區 | 100 | [招生委員會簡章](https://tyc.entry.edu.tw/NoExamImitate_TL/NoExamImitate/Apps/Action/GetFile.ashx?FILE=115%E5%AD%B8%E5%B9%B4%E5%BA%A6%E6%A1%83%E9%80%A3%E5%8D%80%E9%AB%98%E7%B4%9A%E4%B8%AD%E7%AD%89%E5%AD%B8%E6%A0%A1%E5%85%8D%E8%A9%A6%E5%85%A5%E5%AD%B8%E7%B0%A1%E7%AB%A0.pdf&SEQNO=12) | 2026-08-27 | 待確認 |
| 竹苗區 | 100 | [招生委員會公告](https://hhm.entry.edu.tw/NoExamImitate_HM/NoExamImitate/Apps/Page/Public/News.aspx?SEQNO=11) | 2026-08-28 | 已核對／準備版 |
| 中投區 | 100 | [官方簡章](https://www.tdvs.ntct.edu.tw/mediafile/1040/news/30/2026-1/2026115105416_0.pdf) | 2026-08-27 | 待確認 |
| 彰化區 | 135 | [招生委員會簡章](https://chc.entry.edu.tw/NoExamImitate_CH/NoExamImitate/Apps/Action/GetFile.ashx?FILE=115%E7%B0%A1%E7%AB%A0%E5%AF%A9%E6%9F%A5%E9%80%9A%E9%81%8E%E7%89%88_08%E5%BD%B0%E5%8C%96%E5%8D%80_AU%E5%85%8D%E8%A9%A6%E5%85%A5%E5%AD%B8-20260210%7B649de72726331c2a%7D%7Ba63e93ac%7D.pdf&SEQNO=14) | 2026-08-27 | 待確認 |
| 雲林區 | 90 | [縣府公告](https://sges.ylc.edu.tw/News_Content.aspx?n=109698&s=373462) | 2026-08-28 | 待確認 |
| 嘉義區 | 82 | [招生委員會](https://cyc.entry.edu.tw) | 2026-08-28 | 已核對／準備版 |
| 臺南區 | 108 | [招生委員會](https://tn.entry.edu.tw) | 2026-08-28 | 已核對／準備版 |
| 高雄區 | 100 | [官方核定簡章](https://www.gsm.kh.edu.tw/upload/265/101_55531/115%E9%AB%98%E9%9B%84%E5%8D%80%E9%AB%98%E4%B8%AD%E8%81%B7%E5%85%8D%E8%A9%A6%E5%85%A5%E5%AD%B8%E7%B0%A1%E7%AB%A0%E6%A0%B8%E5%AE%9A%E7%89%88.pdf) | 2026-08-27 | 待確認 |
| 屏東區 | 79 | [招生委員會](https://ptc.entry.edu.tw) | 2026-08-28 | 已核對／準備版 |
| 宜蘭區 | 46 | [官方簡章](https://iln.entry.edu.tw/NoExamImitate_IL/NoExamImitate/Apps/Action/GetFile.ashx?FILE=115%E7%B0%A1%E7%AB%A0_03%E5%AE%9C%E8%98%AD%E5%8D%80_AU%E5%85%8D%E8%A9%A6%E5%85%A5%E5%AD%B8-20260105%7Bd97204078cec9102%7D%7Bcc6c218b%7D.pdf&SEQNO=3) | 2026-08-28 | 已核對／準備版 |
| 花蓮區 | 100 | [招生委員會](https://hlc.entry.edu.tw) | 2026-08-28 | 已核對／準備版 |
| 臺東區 | 100 | [招生委員會](https://ttt.entry.edu.tw) | 2026-08-28 | 已核對／準備版 |
| 澎湖區 | 80 | [招生委員會](https://ph.entry.edu.tw) | 2026-08-28 | 已核對／準備版 |
| 金門區 | 60 | [招生委員會](https://kmn.entry.edu.tw) | 2026-08-28 | 已核對／準備版 |

## 已完成的測試證據

- 15 區最高分與總分封頂測試。
- 會考、寫作、志願序分群與同校不同科連續填寫測試。
- 研究 JSON 必填欄位缺漏會回傳可讀的 `missingFields`，不把缺漏當成 0 分。
- 結果明細與實際計算使用同一份 `scoreBreakdown`，逐項顯示目前分數、上限、計算方式及是否列入總分。
- 目前完整套件測試：164 passed；型別檢查、lint 與 build 通過（lint 僅保留既有 warning）。
- 已加入 116 年會考 2027-05-15、2027-05-16 的已公告共通日程；免試入學日期仍維持 115 上年度參考或待公告狀態。
- 試算表單會顯示尚缺項目數並聚焦第一個錯誤欄位；範例資料可直接載入，試算草稿保存於瀏覽器本機並提供清除資料。

## 尚待 116 官方公告

116 正式簡章、招生名額、志願選填限制、採計截止日期、同分比序細節與特殊身分審查，均維持「待公告／待確認」狀態；來源資料標記為待確認的區域不得被解讀為 116 已定案。學校名額與科別資料也必須以當年度官方招生名額表再次核對。

## 使用流程更新

使用者先選就學區與服務年度，再依序輸入五科會考、寫作及本區必要項目；結果頁以逐項明細呈現總分、上限、來源與同分比序資料。所有區域均可進入準備版試算；「載入使用範例資料」可直接查看中投區完整示範結果。
