export type HistoricalSourceType = "official" | "community";
import { classifyHistoricalSource as classify } from "./school-history.mjs";

export function classifyHistoricalSource(sourceName: string, sourceNote: string): HistoricalSourceType {
  return classify(sourceName, sourceNote) as HistoricalSourceType;
}

export function historicalSourceLabel(sourceType: HistoricalSourceType) {
  return sourceType === "official" ? "官方資料" : "非官方整理";
}
