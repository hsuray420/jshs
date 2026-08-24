export function classifyHistoricalSource() {
  return "community";
}

export function historicalSourceLabel(sourceType) {
  return sourceType === "official" ? "官方資料" : "非官方整理";
}
