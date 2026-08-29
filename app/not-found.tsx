import Link from "next/link";

export default function NotFound() {
  return <main className="mx-auto flex min-h-screen w-[min(720px,calc(100%-32px))] items-center py-16"><section className="w-full p-8 jshs-surface-card"><p className="jshs-eyebrow">升學指南</p><h1 className="mt-3 text-3xl">找不到這個頁面</h1><p className="mt-3 leading-7 jshs-muted-copy">網址可能已變更，請返回升學指南尋找需要的內容。</p><Link href="/knowledge" className="mt-6 inline-flex px-4 py-3 text-sm jshs-button-primary">返回升學指南</Link></section></main>;
}
