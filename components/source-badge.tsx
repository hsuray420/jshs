import { SOURCE_TYPE_LABELS, type SourceType } from "@/lib/trust";

export function SourceBadge({ sourceType }: { sourceType: SourceType }) {
  return <span className={`jshs-source-badge is-${sourceType}`}>{SOURCE_TYPE_LABELS[sourceType]}</span>;
}

