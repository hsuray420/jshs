"use client";
import Link from "next/link";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="mx-auto flex min-h-screen w-[min(720px,calc(100%-32px))] items-center py-16"><section className="w-full p-8 jshs-surface-card" role="alert"><p className="jshs-eyebrow">升學指南</p><h1 className="mt-3 text-3xl">目前無法載入這個內容</h1><p className="mt-3 leading-7 jshs-muted-copy">請稍後重新整理，或返回升學指南。若問題持續，歡迎回報錯誤。</p><div className="mt-6 flex flex-wrap gap-3"><button type="button" onClick={reset} className="px-4 py-3 text-sm jshs-button-primary">重新載入</button><Link href="/knowledge" className="px-4 py-3 text-sm jshs-button-secondary">返回升學指南</Link><Link href="/" className="px-4 py-3 text-sm jshs-button-secondary">返回首頁</Link></div></section></main>;
}
