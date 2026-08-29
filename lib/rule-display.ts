const replacements: readonly [RegExp, string][] = [
  [/chinese[_ ]+full[_ ]+grade/gi, "國文完整標示"],
  [/math[_ ]+full[_ ]+grade/gi, "數學完整標示"],
  [/english[_ ]+full[_ ]+grade/gi, "英語完整標示"],
  [/social[_ ]+full[_ ]+grade/gi, "社會完整標示"],
  [/science[_ ]+full[_ ]+grade/gi, "自然完整標示"],
  [/school[_ ]+sequence[_ ]+rank/gi, "校科志願順位"],
  [/raw[_ ]+choice[_ ]+order/gi, "志願選填順序"],
  [/total[_ ]?score/gi, "總積分"],
  [/nearby[_ ]?score/gi, "就近入學積分"],
  [/disadvantaged[_ ]?score|economic[_ ]?score/gi, "弱勢身分積分"],
  [/multiple[_ ]?(?:learning|development)[_ ]?score/gi, "多元學習積分"],
  [/morality[_ ]?score|discipline[_ ]?score/gi, "品德紀錄積分"],
  [/reward[_ ]?score/gi, "獎勵紀錄積分"],
  [/exam[_ ]?tie[_ ]?points/gi, "會考同分比序點"],
  [/exam[_ ]?plus[_ ]?count/gi, "會考加號數"],
  [/chinese[_ ]?level[_ ]?score/gi, "國文等級積分"],
  [/math[_ ]?level[_ ]?score/gi, "數學等級積分"],
  [/english[_ ]?level[_ ]?score/gi, "英語等級積分"],
  [/social[_ ]?level[_ ]?score/gi, "社會等級積分"],
  [/science[_ ]?level[_ ]?score/gi, "自然等級積分"],
  [/preference|target[_ ]?choice|effective[_ ]?preference[_ ]?rank/gi, "志願序"],
  [/remote[_ ]?area/gi, "偏遠地區"],
  [/economic[_ ]?weakness/gi, "經濟弱勢"],
  [/balanced[_ ]?learning/gi, "均衡學習"],
  [/service[_ ]?learning/gi, "服務學習"],
  [/competition/gi, "競賽表現"],
  [/fitness/gi, "體適能"],
  [/exam/gi, "會考"],
  [/score/gi, "積分"],
  [/rank/gi, "順位"],
];

export function humanizeRuleExplanation(value: string | undefined, fallback: string): string {
  if (!value || /[()=?:+*]|\b(?:min|max|sum|floor|lookup|if)\b/i.test(value)) {
    return fallback || "依本區正式規則與你填寫的資料換算，結果不超過本項上限。";
  }
  return replacements.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), value)
    .replaceAll("_", " ").replace(/\s+/g, " ").trim();
}

export function humanizeRuleLabel(value: string): string {
  const label = replacements.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), value)
    .replaceAll("_", " ").replace(/志願序\s+積分/g, "志願序積分").replace(/會考\s+積分/g, "會考積分")
    .replace(/\s+/g, " ").trim();
  // A new internal key must never leak through just because it was not added
  // to the dictionary yet. Keep the UI safe and understandable by default.
  return /[A-Za-z][A-Za-z0-9_ ]*[A-Za-z0-9_]/.test(label) ? "同分比序項目" : label;
}
