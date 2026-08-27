export type AdmissionScheduleStatus = "confirmed";

export type AdmissionScheduleItem = {
  id: string;
  eventDate: string;
  title: string;
  description: string;
  status: AdmissionScheduleStatus;
  sourcePages: "I" | "II" | "i" | "ii" | "iii";
};

const confirmed = (item: Omit<AdmissionScheduleItem, "status">): AdmissionScheduleItem => ({ ...item, status: "confirmed" });

export const districtAdmissionSchedules: Record<string, AdmissionScheduleItem[]> = {
  changhua: [
    confirmed({ id: "ch-115-order-survey", eventDate: "2025-12-22", title: "簡章及報名表訂購調查（集體）", description: "114 年 12 月 22 日至 115 年 1 月 2 日；由承辦學校國立秀水高級工業職業學校辦理。", sourcePages: "I" }),
    confirmed({ id: "ch-115-individual-purchase", eventDate: "2026-03-25", title: "簡章及報名表購買（個別）", description: "115 年 3 月 25 日至 115 年 6 月 26 日；可至承辦學校購買或由彰化區委員會網站下載。", sourcePages: "I" }),
    confirmed({ id: "ch-115-change-district", eventDate: "2026-04-23", title: "變更就學區申請期限", description: "115 年 4 月 23 日至 115 年 4 月 30 日；申請細節參閱簡章第 2 頁。", sourcePages: "I" }),
    confirmed({ id: "ch-115-change-district-result", eventDate: "2026-05-15", title: "變更就學區申請結果通知", description: "115 年 5 月 15 日；申請結果依簡章第 2 頁說明通知。", sourcePages: "I" }),
    confirmed({ id: "ch-115-review-submission", eventDate: "2026-05-05", title: "比序項目積分審查資料送件", description: "115 年 5 月 5 日至 5 月 6 日，每日上午 8:30 至下午 4 時前；集體報名由各國中送達承辦學校，個別報名由學生送達承辦學校。", sourcePages: "I" }),
    confirmed({ id: "ch-115-review-query", eventDate: "2026-05-25", title: "比序項目積分公告查詢", description: "115 年 5 月 25 日下午 2 時後，於彰化區委員會網站查詢。", sourcePages: "I" }),
    confirmed({ id: "ch-115-review-appeal", eventDate: "2026-05-25", title: "比序項目積分複查", description: "115 年 5 月 25 日下午 2 時後至 5 月 27 日下午 3 時前，親自向承辦學校申請。", sourcePages: "I" }),
    confirmed({ id: "ch-115-review-result", eventDate: "2026-06-01", title: "比序項目積分複查結果公告", description: "115 年 6 月 1 日中午 12 時後，於彰化區委員會網站公告。", sourcePages: "I" }),
    confirmed({ id: "ch-115-quota", eventDate: "2026-06-18", title: "公告實際招生名額", description: "115 年 6 月 18 日中午 12 時後，於彰化區委員會網站公告。", sourcePages: "I" }),
    confirmed({ id: "ch-115-rank", eventDate: "2026-06-18", title: "公告個人序位查詢", description: "115 年 6 月 18 日下午 1 時後至 6 月 24 日中午 12 時前，於彰化區委員會網站查詢。", sourcePages: "I" }),
    confirmed({ id: "ch-115-preference", eventDate: "2026-06-18", title: "網路選填志願", description: "115 年 6 月 18 日下午 1 時後至 6 月 24 日中午 12 時前，於彰化區委員會網站辦理。", sourcePages: "I" }),
    confirmed({ id: "ch-115-school-fee", eventDate: "2026-06-18", title: "國中生向就讀學校報名繳費", description: "115 年 6 月 18 日至 6 月 24 日；校內辦理時間依就讀國中規定。", sourcePages: "II" }),
    confirmed({ id: "ch-115-registration-group", eventDate: "2026-06-25", title: "報名日期（集體報名）", description: "115 年 6 月 25 日至 6 月 26 日，每日上午 8:30 至下午 4 時前；各國中向承辦學校報名。", sourcePages: "II" }),
    confirmed({ id: "ch-115-registration-individual", eventDate: "2026-06-26", title: "報名日期（個別報名）", description: "115 年 6 月 26 日上午 8:30 至下午 4 時前；學生向承辦學校報名。", sourcePages: "II" }),
    confirmed({ id: "ch-115-placement", eventDate: "2026-07-07", title: "分發結果公告", description: "115 年 7 月 7 日上午 11 時；各招生學校公告錄取名單，於彰化區委員會網站查詢。", sourcePages: "II" }),
    confirmed({ id: "ch-115-placement-review", eventDate: "2026-07-08", title: "分發結果複查", description: "115 年 7 月 8 日下午 2 時前；向國立秀水高級工業職業學校免試入學委員會申請。", sourcePages: "II" }),
    confirmed({ id: "ch-115-report", eventDate: "2026-07-09", title: "報到日期", description: "115 年 7 月 9 日上午 9 時至 11 時；於各錄取學校報到。", sourcePages: "II" }),
    confirmed({ id: "ch-115-withdrawal", eventDate: "2026-07-13", title: "已報到學生聲明放棄錄取資格", description: "115 年 7 月 13 日下午 2 時前；向各錄取學校辦理。", sourcePages: "II" }),
    confirmed({ id: "ch-115-complaint", eventDate: "2026-07-13", title: "申訴期限", description: "115 年 7 月 13 日下午 4 時前；向國立秀水高級工業職業學校免試入學委員會提出。", sourcePages: "II" }),
  ],
  ct: [
    confirmed({ id: "ct-115-order-survey", eventDate: "2025-12-18", title: "簡章訂購調查（集體）", description: "114 年 12 月 18 日至 114 年 12 月 29 日；由國立中興大學附屬臺中高級農業職業學校辦理。", sourcePages: "I" }),
    confirmed({ id: "ct-115-individual-purchase", eventDate: "2026-03-27", title: "簡章購買（個別）", description: "115 年 3 月 27 日至 115 年 6 月 25 日；可於中投區委員會網站下載。", sourcePages: "I" }),
    confirmed({ id: "ct-115-multi-performance", eventDate: "2026-04-30", title: "多元學習表現積分採計截止日", description: "115 年 4 月 30 日。", sourcePages: "I" }),
    confirmed({ id: "ct-115-change-district", eventDate: "2026-04-23", title: "變更就學區申請期限", description: "115 年 4 月 23 日至 115 年 4 月 30 日；參閱簡章附表一第 63 頁。", sourcePages: "I" }),
    confirmed({ id: "ct-115-change-district-result", eventDate: "2026-05-18", title: "變更就學區申請結果通知", description: "115 年 5 月 18 日。", sourcePages: "I" }),
    confirmed({ id: "ct-115-review-individual", eventDate: "2026-05-19", title: "比序項目積分審查資料送件（個別報名）", description: "115 年 5 月 19 日至 5 月 21 日，每日上午 9 時至 12 時、下午 1 時至 4 時；學生填妥附表七並到承辦學校審查。", sourcePages: "I" }),
    confirmed({ id: "ct-115-review-group", eventDate: "2026-05-22", title: "比序項目積分審查資料送件（集體報名）", description: "各國中於 115 年 5 月 22 日下午 5 時前上傳；資料包含就近入學、扶助弱勢、多元學習表現三項。", sourcePages: "I" }),
    confirmed({ id: "ct-115-quota", eventDate: "2026-06-18", title: "公告實際招生名額", description: "115 年 6 月 18 日上午 8 時後，於中投區委員會網站公告。", sourcePages: "I" }),
    confirmed({ id: "ct-115-rank", eventDate: "2026-06-18", title: "公告個人序位查詢", description: "115 年 6 月 18 日上午 8 時後至 6 月 23 日中午 12 時，於中投區委員會網站查詢。", sourcePages: "I" }),
    confirmed({ id: "ct-115-preference", eventDate: "2026-06-18", title: "網路選填志願", description: "115 年 6 月 18 日上午 8 時後至 6 月 23 日中午 12 時，於中投區委員會網站辦理。", sourcePages: "I" }),
    confirmed({ id: "ct-115-registration-group", eventDate: "2026-06-24", title: "集體報名日期", description: "115 年 6 月 24 日至 6 月 25 日，上午 9 時至 12 時、下午 1 時至 4 時；各國中向承辦學校報名。", sourcePages: "I" }),
    confirmed({ id: "ct-115-registration-individual", eventDate: "2026-06-25", title: "個別報名日期", description: "115 年 6 月 25 日上午 9 時至 12 時、下午 1 時至 4 時；學生向承辦學校報名。", sourcePages: "II" }),
    confirmed({ id: "ct-115-placement", eventDate: "2026-07-07", title: "分發結果公告", description: "115 年 7 月 7 日上午 11 時；各招生學校公告錄取名單，於中投區委員會網站查詢。", sourcePages: "II" }),
    confirmed({ id: "ct-115-placement-review", eventDate: "2026-07-08", title: "分發結果複查", description: "115 年 7 月 8 日下午 4 時前；向國立中興大學附屬臺中高級農業職業學校免試入學委員會申請。", sourcePages: "II" }),
    confirmed({ id: "ct-115-report", eventDate: "2026-07-09", title: "報到日期", description: "115 年 7 月 9 日上午 9 時至 11 時；於各錄取學校報到。", sourcePages: "II" }),
    confirmed({ id: "ct-115-withdrawal", eventDate: "2026-07-13", title: "已報到學生聲明放棄錄取資格", description: "115 年 7 月 13 日下午 2 時前；向各錄取學校辦理。", sourcePages: "II" }),
    confirmed({ id: "ct-115-complaint", eventDate: "2026-07-13", title: "申訴期限", description: "115 年 7 月 13 日下午 4 時前；向國立中興大學附屬臺中高級農業職業學校免試入學委員會提出。", sourcePages: "II" }),
  ],
  tp: [
    confirmed({ id: "tp-115-change", eventDate: "2026-04-23", title: "變更就學區申請", description: "115年4月23日9時至4月30日16時；來源簡章頁 i。", sourcePages: "i" }),
    confirmed({ id: "tp-115-multi-review", eventDate: "2026-06-02", title: "多元學習表現積分複查", description: "115年6月2日13時至16時；來源簡章頁 ii。", sourcePages: "ii" }),
    confirmed({ id: "tp-115-preference", eventDate: "2026-06-09", title: "模擬志願選填", description: "115年6月9日8時至6月16日12時；來源簡章頁 ii。", sourcePages: "ii" }),
    confirmed({ id: "tp-115-quota", eventDate: "2026-06-18", title: "公告實際招生名額及個人序位", description: "115年6月18日12時後公告，個人序位查詢至6月25日12時；來源簡章頁 ii、iii。", sourcePages: "iii" }),
    confirmed({ id: "tp-115-registration", eventDate: "2026-06-27", title: "個別報名", description: "115年6月27日9時至16時、6月28日9時至12時；集體報名為6月29日至30日；來源簡章頁 iii。", sourcePages: "iii" }),
    confirmed({ id: "tp-115-placement", eventDate: "2026-07-07", title: "分發結果公告", description: "115年7月7日11時；來源簡章頁 iii。", sourcePages: "iii" }),
    confirmed({ id: "tp-115-report", eventDate: "2026-07-09", title: "報到", description: "115年7月9日9時至11時；來源簡章頁 iii。", sourcePages: "iii" }),
  ],
  "taoyuan-lienchiang": [
    confirmed({ id: "tyc-115-change", eventDate: "2026-04-23", title: "變更就學區申請", description: "115年4月23日至4月30日；來源簡章頁 I。", sourcePages: "I" }),
    confirmed({ id: "tyc-115-score-upload", eventDate: "2026-05-25", title: "國中端上傳多元學習表現積分", description: "115年5月25日16時30分前；來源簡章頁 I。", sourcePages: "I" }),
    confirmed({ id: "tyc-115-choice", eventDate: "2026-06-18", title: "網路選填志願及個人序位查詢", description: "115年6月18日12時後至6月25日12時；來源簡章頁 I。", sourcePages: "I" }),
    confirmed({ id: "tyc-115-registration", eventDate: "2026-06-29", title: "報名", description: "115年6月29日至30日，8時30分至12時、13時30分至16時30分；來源簡章頁 II。", sourcePages: "II" }),
    confirmed({ id: "tyc-115-placement", eventDate: "2026-07-07", title: "分發結果公告", description: "115年7月7日11時；來源簡章頁 II。", sourcePages: "II" }),
    confirmed({ id: "tyc-115-report", eventDate: "2026-07-09", title: "報到", description: "115年7月9日9時至11時；來源簡章頁 II。", sourcePages: "II" }),
  ],
  kaohsiung: [
    confirmed({ id: "kh-115-change", eventDate: "2026-04-23", title: "變更就學區申請", description: "115年4月23日至4月30日；來源簡章頁 I。", sourcePages: "I" }),
    confirmed({ id: "kh-115-score-review", eventDate: "2026-06-05", title: "比序積分查詢", description: "115年6月5日12時後；複查為6月8日至9日中午12時；來源簡章頁 I。", sourcePages: "I" }),
    confirmed({ id: "kh-115-quota", eventDate: "2026-06-18", title: "公告實際招生名額及個人序位", description: "115年6月18日17時後至6月24日12時；來源簡章頁 I。", sourcePages: "I" }),
    confirmed({ id: "kh-115-registration", eventDate: "2026-06-28", title: "個別報名", description: "115年6月28日至30日，8時30分至12時、13時30分至16時；集體報名為6月29日至30日；來源簡章頁 II。", sourcePages: "II" }),
    confirmed({ id: "kh-115-placement", eventDate: "2026-07-07", title: "分發結果公告", description: "115年7月7日11時；來源簡章頁 II。", sourcePages: "II" }),
    confirmed({ id: "kh-115-report", eventDate: "2026-07-09", title: "報到", description: "115年7月9日9時至11時；來源簡章頁 II。", sourcePages: "II" }),
  ],
};

export function getDistrictAdmissionSchedule(district: string) {
  return districtAdmissionSchedules[district] ?? [];
}
