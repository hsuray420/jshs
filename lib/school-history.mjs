export function classifyHistoricalSource(sourceName, sourceNote) {
  const source = `${sourceName} ${sourceNote}`;
  return /官方|教育部|委員會|招生委員會|免試入學/.test(source) ? "official" : "community";
}

export function historicalSourceLabel(sourceType) {
  return sourceType === "official" ? "官方資料" : "非官方整理";
}
