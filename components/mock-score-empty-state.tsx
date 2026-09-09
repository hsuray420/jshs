import Link from "next/link";
import { PageContainer } from "@/components/ui/layout";

export function MockScoreEmptyState({ examName }: { examName?: string }) {
  return (
    <PageContainer as="section" className="jshs-feature-workspace">
      <div className="jshs-state-card">
        <p className="jshs-eyebrow">資料狀態</p>
        <h2>{examName ? `${examName} 尚未載入可驗證資料` : "目前尚未載入可驗證的模擬考資料"}</h2>
        <p>這裡已經是模擬考中心入口；P0-D 前不會假造答案、級距、排名或落點機率。等官方或可核對來源建立後，才會開放對答案與結果頁。</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link href="/scores" className="jshs-button-secondary px-4">回成績分析</Link>
          <Link href="/scores/admission" className="jshs-button-primary px-4">先做積分試算</Link>
        </div>
      </div>
    </PageContainer>
  );
}
