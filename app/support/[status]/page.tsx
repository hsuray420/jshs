import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const messages: Record<string, { title: string; body: string }> = {
  success: { title: "付款成功", body: "感謝你的支持。款項狀態仍以綠界回傳與伺服器驗證紀錄為準。" },
  failed: { title: "付款失敗", body: "尚未完成付款，請確認付款方式後再試一次。" },
  cancelled: { title: "付款取消", body: "你已取消本次付款，沒有建立成功的捐款紀錄。" },
};
export function generateStaticParams() { return Object.keys(messages).map((status) => ({ status })); }
export default async function SupportStatusPage({ params }: { params: Promise<{ status: string }> }) {
  const { status } = await params;
  const item = messages[status] || messages.failed;
  return <main className="min-h-screen jshs-page-shell"><SiteHeader /><section className="mx-auto w-[min(680px,calc(100%-32px))] py-20"><article className="p-7 jshs-surface-card"><p className="jshs-eyebrow">支持 JSHS</p><h1 className="mt-3">{item.title}</h1><p className="mt-4 leading-7 jshs-muted-copy">{item.body}</p><Link href="/support" className="mt-6 inline-flex px-4 py-3 text-sm jshs-button-primary">回到捐款頁</Link></article></section><SiteFooter /></main>;
}
