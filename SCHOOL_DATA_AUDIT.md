# School Data Audit

資料年度：115；來源更新日：2026-09-08。

本次 runtime source of truth 為 7 個 enabled 招生區 CSV。generated JSON 與 public CSV 皆由這 7 份 CSV 自動產生；不再需要人工維護 national master CSV。

| Region | CSV | Rows | Columns | Status |
|---|---|---:|---:|---|
| 中投區 | content/schools/regions/中投區_ct/JSHS_中投區_96校_最終版_2026-09-07.csv | 96 | 30 | PASS |
| 竹苗區 | content/schools/regions/竹苗區_hsinchu-miaoli/JSHS_竹苗區_39校_最終完成版_2026-09-08.csv | 39 | 30 | PASS |
| 桃連區 | content/schools/regions/桃連區_taoyuan-lienchiang/JSHS_桃連區_50校_最終完成版_2026-09-08.csv | 50 | 30 | PASS |
| 高雄區 | content/schools/regions/高雄區_kaohsiung/JSHS_高雄區_53校_最終完成版_2026-09-07.csv | 53 | 30 | normalized duplicate headers: 住宿資訊 |
| 基北區 | content/schools/regions/基北區_tp/JSHS_基北區_135校_完成版_無排序分數_2026-09-07.csv | 135 | 30 | PASS |
| 彰化區 | content/schools/regions/彰化區_changhua/JSHS_彰化區_49校_最終完成版_2026-09-08.csv | 49 | 30 | PASS |
| 臺南區 | content/schools/regions/臺南區_tainan/JSHS_臺南區_73校_最終完成版_2026-09-08.csv | 73 | 30 | PASS |

## 欄位

前台主要欄位：排名、學校代碼、學校名稱、公私立、招生區、學制分類、男女校、縣市、區、地址、官網、電話、科系與名額、簡章招生名額、招生名額、資優班/特色班、課程方向、實習／專題、校車／專車資訊、通勤資訊、住宿資訊、Google地圖

來源 metadata 欄位：課程資料來源、實習專題資料來源、校車／專車資料來源、通勤資料來源、住宿資料來源、地址資料來源、生活資料來源、資料更新日期

## 統計

學校筆數：448

| REGIONS | 7/7 |
| SOURCE_ROWS | 495 |
| UNIQUE_SCHOOL_ENTITIES | 448 |
| RUNTIME_ADMISSION_RECORDS | 495 |
| ROW_CONSERVATION | PASS |
| SCHOOL_LEVEL_CONFLICTS | 0 |
| REGION_SPECIFIC_RECORDS | PASS |
| CSV_PARSE | PASS |
| SCHOOL_CODE_DUPLICATES | 0 |
| SCHEMA | PASS |
| CSV_RUNTIME_MATCH | PASS |
| BUILD_AUTO_GENERATE | PASS |
| STALE_GENERATED_DATA_POSSIBLE | NO |

## 欄位分類

School-level fields：學校代碼、公私立、縣市、區

Admission/region-level fields：排名、學校名稱、招生區、學制分類、男女校、地址、官網、電話、科系與名額、簡章招生名額、招生名額、資優班/特色班、課程方向、實習／專題、校車／專車資訊、通勤資訊、住宿資訊、Google地圖

Source metadata：課程資料來源、實習專題資料來源、校車／專車資料來源、通勤資料來源、住宿資料來源、地址資料來源、生活資料來源、資料更新日期

## Duplicate School Audit

duplicate school codes：47

number of affected schools：47

number of extra rows：47

| schoolCode | schoolName | regions | rowCount |
|---|---|---|---:|
| 011310 | 財團法人恆毅高中 | 桃連區、基北區 | 2 |
| 011317 | 私立醒吾高中 | 桃連區、基北區 | 2 |
| 011330 | 新北市林口康橋國際高中 | 桃連區、基北區 | 2 |
| 011405 | 私立樹人家商 | 桃連區、基北區 | 2 |
| 013303 | 市立泰山高中 | 桃連區、基北區 | 2 |
| 013337 | 市立新莊高中 | 桃連區、基北區 | 2 |
| 013339 | 市立林口高中 | 桃連區、基北區 | 2 |
| 014322 | 市立樹林高中 | 桃連區、基北區 | 2 |
| 014353 | 市立丹鳳高中 | 桃連區、基北區 | 2 |
| 014439 | 市立鶯歌工商 | 桃連區、基北區 | 2 |
| 031317 | 私立光啟高中 | 桃連區、基北區 | 2 |
| 031414 | 桃園市世紀綠能工商 | 桃連區、基北區 | 2 |
| 034306 | 市立南崁高中 | 桃連區、基北區 | 2 |
| 034314 | 市立壽山高中 | 桃連區、基北區 | 2 |
| 034347 | 市立永豐高中 | 桃連區、基北區 | 2 |
| 040304 | 國立關西高中 | 竹苗區、桃連區 | 2 |
| 041307 | 私立仰德高中 | 竹苗區、桃連區 | 2 |
| 041401 | 私立內思高工 | 竹苗區、桃連區 | 2 |
| 044320 | 新竹縣立湖口高中 | 竹苗區、桃連區 | 2 |
| 050314 | 國立卓蘭高級中等學校 | 中投區、竹苗區 | 2 |
| 050315 | 國立苑裡高級中學 | 中投區、竹苗區 | 2 |
| 050401 | 國立大湖高級農工職業學校 | 中投區、竹苗區 | 2 |
| 051307 | 全人學校財團法人苗栗縣全人實驗高級中等學校 | 中投區、竹苗區 | 2 |
| 051413 | 苗栗縣私立龍德家事商業職業學校 | 中投區、竹苗區 | 2 |
| 054308 | 苗栗縣立三義高級中學 | 中投區、竹苗區 | 2 |
| 054309 | 苗栗縣立苑裡高級中學 | 中投區、竹苗區 | 2 |
| 061306 | 臺中市私立明台高級中學 | 中投區、彰化區 | 2 |
| 063408 | 臺中市立霧峰農業工業高級中等學校 | 中投區、彰化區 | 2 |
| 063C08 | 臺中市立霧峰農業工業高級中等學校進修部 | 中投區、彰化區 | 2 |
| 071414 | 彰化縣私立達德高級商工職業學校 | 中投區、彰化區 | 2 |
| 080302 | 國立南投高級中學 | 中投區、彰化區 | 2 |
| 080305 | 國立中興高級中學 | 中投區、彰化區 | 2 |
| 080307 | 國立竹山高級中學 | 中投區、彰化區 | 2 |
| 080404 | 國立南投高級商業職業學校 | 中投區、彰化區 | 2 |
| 080406 | 國立草屯高級商工職業學校 | 中投區、彰化區 | 2 |
| 080C06 | 國立草屯高級商工職業學校進修部 | 中投區、彰化區 | 2 |
| 081311 | 南投縣私立五育高級中學 | 中投區、彰化區 | 2 |
| 081313 | 南投縣私立弘明實驗高級中等學校 | 中投區、彰化區 | 2 |
| 081409 | 同德學校財團法人南投縣同德高級中等學校 | 中投區、彰化區 | 2 |
| 084309 | 南投縣立旭光高級中學 | 中投區、彰化區 | 2 |
| 091318 | 義峰學校財團法人雲林縣義峰高級中學 | 中投區、彰化區 | 2 |
| 120304 | 國立岡山高級中學 | 高雄區、臺南區 | 2 |
| 120311 | 國立旗美高級中學 | 高雄區、臺南區 | 2 |
| 120401 | 國立旗山高級農工職業學校 | 高雄區、臺南區 | 2 |
| 120402 | 國立岡山高級農工職業學校 | 高雄區、臺南區 | 2 |
| 121415 | 華德學校財團法人高雄市華德高級工業家事職業學校 | 高雄區、臺南區 | 2 |
| 124322 | 高雄市立路竹高級中學 | 高雄區、臺南區 | 2 |

IDENTICAL_FIELDS：排名、學校代碼、學校名稱、公私立、學制分類、男女校、縣市、區、地址、官網、電話、簡章招生名額、招生名額、資優班/特色班、課程方向、實習／專題、校車／專車資訊、通勤資訊、住宿資訊、Google地圖、課程資料來源、實習專題資料來源、校車／專車資料來源、通勤資料來源、住宿資料來源、地址資料來源、生活資料來源、資料更新日期

REGION_SPECIFIC_FIELDS：學校名稱、招生區、學制分類、男女校、地址、官網、電話、科系與名額、簡章招生名額、招生名額、資優班/特色班、課程方向、實習／專題、校車／專車資訊、通勤資訊、住宿資訊、Google地圖、課程資料來源、實習專題資料來源、校車／專車資料來源、通勤資料來源、住宿資料來源、地址資料來源、生活資料來源、資料更新日期

CONFLICT_FIELDS：無

## 招生區

| 中投區免試入學日間部 | 73 |
| 中投區免試入學進修部 | 23 |
| 基北區 | 129 |
| 基北區共同就學區 | 6 |
| 彰化區免試入學日間部 | 37 |
| 彰化區免試入學進修部 | 12 |
| 桃連區共同就學區（基北區） | 10 |
| 桃連區共同就學區（竹苗區） | 4 |
| 桃連區日間部 | 36 |
| 竹苗區學校名錄 | 39 |
| 臺南區免試入學日間部 | 58 |
| 臺南區免試入學進修部 | 15 |
| 高雄區學校名錄 | 53 |

## 縣市

| 南投縣 | 21 |
| 嘉義市 | 9 |
| 嘉義縣 | 2 |
| 基隆市 | 11 |
| 宜蘭縣 | 1 |
| 彰化縣 | 33 |
| 新北市 | 58 |
| 新竹市 | 13 |
| 新竹縣 | 10 |
| 桃園市 | 35 |
| 臺中市 | 65 |
| 臺北市 | 60 |
| 臺南市 | 56 |
| 苗栗縣 | 17 |
| 連江縣 | 1 |
| 雲林縣 | 3 |
| 高雄市 | 53 |

## 警告

- 高雄區: header order/duplicates normalized from 排名|學校代碼|學校名稱|公私立|招生區|學制分類|男女校|縣市|區|地址|官網|電話|科系與名額|簡章招生名額|招生名額|資優班/特色班|住宿資訊|課程方向|實習／專題|校車／專車資訊|通勤資訊|住宿資訊|Google地圖|課程資料來源|實習專題資料來源|校車／專車資料來源|通勤資料來源|住宿資料來源|地址資料來源|生活資料來源|資料更新日期
- cross-region school code aggregated: 011310
- cross-region school code aggregated: 011317
- cross-region school code aggregated: 011330
- cross-region school code aggregated: 011405
- cross-region school code aggregated: 013303
- cross-region school code aggregated: 013337
- cross-region school code aggregated: 013339
- cross-region school code aggregated: 014322
- cross-region school code aggregated: 014353
- cross-region school code aggregated: 014439
- cross-region school code aggregated: 031317
- cross-region school code aggregated: 031414
- cross-region school code aggregated: 034306
- cross-region school code aggregated: 034314
- cross-region school code aggregated: 034347
- cross-region school code aggregated: 040304
- cross-region school code aggregated: 041307
- cross-region school code aggregated: 041401
- cross-region school code aggregated: 044320
- cross-region school code aggregated: 050314
- cross-region school code aggregated: 050315
- cross-region school code aggregated: 050401
- cross-region school code aggregated: 051307
- cross-region school code aggregated: 051413
- cross-region school code aggregated: 054308
- cross-region school code aggregated: 054309
- cross-region school code aggregated: 061306
- cross-region school code aggregated: 063408
- cross-region school code aggregated: 063C08
- cross-region school code aggregated: 071414
- cross-region school code aggregated: 080302
- cross-region school code aggregated: 080305
- cross-region school code aggregated: 080307
- cross-region school code aggregated: 080404
- cross-region school code aggregated: 080406
- cross-region school code aggregated: 080C06
- cross-region school code aggregated: 081311
- cross-region school code aggregated: 081313
- cross-region school code aggregated: 081409
- cross-region school code aggregated: 084309
- cross-region school code aggregated: 091318
- cross-region school code aggregated: 120304
- cross-region school code aggregated: 120311
- cross-region school code aggregated: 120401
- cross-region school code aggregated: 120402
- cross-region school code aggregated: 121415
- cross-region school code aggregated: 124322

## 錯誤

無
