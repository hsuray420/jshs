import Link from "next/link";
import { PageContainer } from "@/components/ui/layout";

export function MockScoreEmptyState({ examName }: { examName?: string }) {
  return (
    <PageContainer as="section" className="jshs-feature-workspace">
      <div className="jshs-state-card">
        <p className="jshs-eyebrow">資料狀態</p>
        <h2>{examName ? `${examName} 尚未載入可驗證資料` : "目前尚未載入可驗證的模擬考資料"}</h2>
        <p>本站不會假造答案、級距、排名或落點機率；目前先提供個人模考紀錄與科目分析。官方或可核對答案來源提供後，才會開放對答案與結果頁。</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link href="/scores" className="jshs-button-secondary px-4">回成績分析</Link>
          <Link href="/scores/admission" className="jshs-button-primary px-4">先做積分試算</Link>
        </div>
      </div>
    </PageContainer>
  );
}
