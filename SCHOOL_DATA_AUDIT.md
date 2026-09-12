# School Data Audit

資料年度：115；來源更新日：2026-09-08。

本次找學校 runtime source of truth 為 registry 標示 available 的 5 個招生區 CSV。generated JSON 與 public CSV 皆由這 5 份 CSV 自動產生；未開放區域不建立假 CSV、不讀舊版備援資料。

| Region | CSV | Rows | Columns | Status |
|---|---|---:|---:|---|
| 基北區 | content/schools/regions/基北區_tp/JSHS_基北區_135校_完成版_無排序分數_2026-09-07.csv | 135 | 30 | PASS |
| 桃連區 | content/schools/regions/桃連區_taoyuan-lienchiang/JSHS_桃連區_50校_最終完成版_2026-09-08.csv | 50 | 30 | PASS |
| 竹苗區 | content/schools/regions/竹苗區_hsinchu-miaoli/JSHS_竹苗區_39校_最終完成版_2026-09-08.csv | 39 | 30 | PASS |
| 中投區 | content/schools/regions/中投區_ct/JSHS_中投區_96校_最終版_2026-09-07.csv | 96 | 30 | PASS |
| 高雄區 | content/schools/regions/高雄區_kaohsiung/JSHS_高雄區_53校_最終完成版_2026-09-07.csv | 53 | 30 | PASS |

## 欄位

前台主要欄位：排名、學校代碼、學校名稱、公私立、招生區、學制分類、男女校、縣市、區、地址、官網、電話、科系與名額、簡章招生名額、招生名額、資優班/特色班、課程方向、實習／專題、校車／專車資訊、通勤資訊、住宿資訊、Google地圖

來源 metadata 欄位：課程資料來源、實習專題資料來源、校車／專車資料來源、通勤資料來源、住宿資料來源、地址資料來源、生活資料來源、資料更新日期

## 統計

學校筆數：347

| SCHOOL_DATA_AVAILABLE_REGIONS | 5/5 |
| SCHOOL_DATA_UNAVAILABLE_REGIONS | 10 |
| SOURCE_ROWS | 373 |
| UNIQUE_SCHOOL_ENTITIES | 347 |
| RUNTIME_ADMISSION_RECORDS | 373 |
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

duplicate school codes：26

number of affected schools：26

number of extra rows：26

| schoolCode | schoolName | regions | rowCount |
|---|---|---|---:|
| 011310 | 財團法人恆毅高中 | 基北區、桃連區 | 2 |
| 011317 | 私立醒吾高中 | 基北區、桃連區 | 2 |
| 011330 | 新北市林口康橋國際高中 | 基北區、桃連區 | 2 |
| 011405 | 私立樹人家商 | 基北區、桃連區 | 2 |
| 013303 | 市立泰山高中 | 基北區、桃連區 | 2 |
| 013337 | 市立新莊高中 | 基北區、桃連區 | 2 |
| 013339 | 市立林口高中 | 基北區、桃連區 | 2 |
| 014322 | 市立樹林高中 | 基北區、桃連區 | 2 |
| 014353 | 市立丹鳳高中 | 基北區、桃連區 | 2 |
| 014439 | 市立鶯歌工商 | 基北區、桃連區 | 2 |
| 031317 | 私立光啟高中 | 基北區、桃連區 | 2 |
| 031414 | 桃園市世紀綠能工商 | 基北區、桃連區 | 2 |
| 034306 | 市立南崁高中 | 基北區、桃連區 | 2 |
| 034314 | 市立壽山高中 | 基北區、桃連區 | 2 |
| 034347 | 市立永豐高中 | 基北區、桃連區 | 2 |
| 040304 | 國立關西高中 | 桃連區、竹苗區 | 2 |
| 041307 | 私立仰德高中 | 桃連區、竹苗區 | 2 |
| 041401 | 私立內思高工 | 桃連區、竹苗區 | 2 |
| 044320 | 新竹縣立湖口高中 | 桃連區、竹苗區 | 2 |
| 050314 | 國立卓蘭高級中等學校 | 竹苗區、中投區 | 2 |
| 050315 | 國立苑裡高級中學 | 竹苗區、中投區 | 2 |
| 050401 | 國立大湖高級農工職業學校 | 竹苗區、中投區 | 2 |
| 051307 | 全人學校財團法人苗栗縣全人實驗高級中等學校 | 竹苗區、中投區 | 2 |
| 051413 | 苗栗縣私立龍德家事商業職業學校 | 竹苗區、中投區 | 2 |
| 054308 | 苗栗縣立三義高級中學 | 竹苗區、中投區 | 2 |
| 054309 | 苗栗縣立苑裡高級中學 | 竹苗區、中投區 | 2 |

IDENTICAL_FIELDS：排名、學校代碼、學校名稱、公私立、學制分類、縣市、區、地址、官網、電話、課程方向、實習／專題、校車／專車資訊、通勤資訊、住宿資訊、Google地圖、課程資料來源、實習專題資料來源、校車／專車資料來源、通勤資料來源、住宿資料來源、地址資料來源、生活資料來源、資料更新日期

REGION_SPECIFIC_FIELDS：學校名稱、招生區、學制分類、男女校、地址、官網、電話、科系與名額、簡章招生名額、招生名額、資優班/特色班、課程方向、實習／專題、校車／專車資訊、通勤資訊、住宿資訊、Google地圖、課程資料來源、實習專題資料來源、校車／專車資料來源、通勤資料來源、住宿資料來源、地址資料來源、生活資料來源、資料更新日期

CONFLICT_FIELDS：無

## 招生區

| 中投區免試入學日間部 | 73 |
| 中投區免試入學進修部 | 23 |
| 基北區 | 129 |
| 基北區共同就學區 | 6 |
| 桃連區共同就學區（基北區） | 10 |
| 桃連區共同就學區（竹苗區） | 4 |
| 桃連區日間部 | 36 |
| 竹苗區學校名錄 | 39 |
| 高雄區學校名錄 | 53 |

## 縣市

| 南投縣 | 21 |
| 基隆市 | 11 |
| 宜蘭縣 | 1 |
| 彰化縣 | 1 |
| 新北市 | 58 |
| 新竹市 | 13 |
| 新竹縣 | 10 |
| 桃園市 | 35 |
| 臺中市 | 65 |
| 臺北市 | 60 |
| 苗栗縣 | 17 |
| 連江縣 | 1 |
| 雲林縣 | 1 |
| 高雄市 | 53 |

## 警告

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

## 錯誤

無
