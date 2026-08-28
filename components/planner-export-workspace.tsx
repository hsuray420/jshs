"use client";

import { useEffect, useState } from "react";
import { readLocalPlanner, type LocalPlannerItem, type LocalPlannerState } from "@/lib/planner-local";

export function PlannerExportWorkspace({ isMember }: { isMember: boolean }) {
  const [items, setItems] = useState<LocalPlannerItem[]>([]);
  const [status, setStatus] = useState("正在讀取志願清單…");
  useEffect(() => {
    if (!isMember) { const timer = window.setTimeout(() => { setItems(readLocalPlanner().items); setStatus(""); }, 0); return () => window.clearTimeout(timer); }
    Promise.all([fetch("/api/planner").then((response) => response.json() as Promise<{ items?: LocalPlannerItem[] }>), fetch("/api/planner/state").then((response) => response.json() as Promise<{ state?: LocalPlannerState }>)]).then(([itemsPayload, statePayload]) => { setItems(sortItems(itemsPayload.items || [], statePayload.state)); setStatus(""); }).catch(() => setStatus("目前無法讀取志願清單，請稍後再試。"));
  }, [isMember]);
  const summary = items.map((item, index) => `${index + 1}. ${item.school_name}${item.department ? ` - ${item.department}` : ""}`).join("\n");
  function downloadText() { download(new Blob([`JSHS.CC 116 學年度志願摘要\n\n${summary || "尚未建立志願"}`], { type: "text/plain;charset=utf-8" }), "jshs-116-volunteer-summary.txt"); }
  function downloadPdf() { const lines = ["JSHS.CC 116 VOLUNTEER SUMMARY", `COUNT: ${items.length}`, ...items.map((item, index) => `${index + 1}. ${ascii(item.school_name)}`)]; const stream = `BT /F1 12 Tf 50 760 Td ${lines.map((line, index) => `(${escapePdf(line)}) Tj ${index < lines.length - 1 ? "0 -18 Td" : ""}`).join(" ")} ET`; download(new Blob([makePdf(stream)], { type: "application/pdf" }), "jshs-116-volunteer-summary.pdf"); }
  return <section className="mx-auto w-[min(1120px,calc(100%-32px))] pb-12"><div className="p-6 jshs-surface-card"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm leading-7 jshs-muted-copy">摘要會標示 116 服務年度；正式志願選填仍須前往官方平台。</p><h2 className="mt-2 text-xl">志願摘要 {items.length ? `（${items.length} 所）` : ""}</h2></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => window.print()} className="min-h-11 px-4 py-3 text-sm jshs-button-secondary">列印／另存 PDF</button><button type="button" onClick={downloadPdf} className="min-h-11 px-4 py-3 text-sm jshs-button-primary">下載 PDF</button><button type="button" onClick={downloadText} className="min-h-11 px-4 py-3 text-sm jshs-button-secondary">下載文字摘要</button></div></div>{status ? <p role="status" className="mt-5 rounded-xl bg-[var(--jshs-muted-surface)] p-4 text-sm jshs-muted-copy">{status}</p> : <ol className="mt-5 grid gap-2">{items.map((item) => <li key={item.id} className="rounded-xl bg-[var(--jshs-muted-surface)] p-4"><strong>{item.school_name}</strong>{item.department ? <span className="ml-2 text-sm text-slate-500">{item.department}</span> : null}</li>)}{!items.length ? <li className="rounded-xl border border-dashed p-5 text-sm text-slate-500">尚未建立志願清單。</li> : null}</ol>}</div></section>;
}

function download(blob: Blob, filename: string) { const href = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = href; anchor.download = filename; anchor.click(); URL.revokeObjectURL(href); }
function ascii(value: string) { return value.replace(/[^\x20-\x7E]/g, "?"); }
function escapePdf(value: string) { return ascii(value).replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)"); }
function makePdf(stream: string) { const objects = [`<< /Type /Catalog /Pages 2 0 R >>`, `<< /Type /Pages /Kids [3 0 R] /Count 1 >>`, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>`, `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`, `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`]; let output = "%PDF-1.4\n"; const offsets = [0]; objects.forEach((object, index) => { offsets.push(output.length); output += `${index + 1} 0 obj\n${object}\nendobj\n`; }); const start = output.length; output += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n `).join("\n")}\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${start}\n%%EOF`; return output; }

function sortItems(items: readonly LocalPlannerItem[], state?: LocalPlannerState) { const order = new Map((state?.order || []).map((id, index) => [id, index])); return [...items].sort((left, right) => (order.get(left.id) ?? Number.MAX_SAFE_INTEGER) - (order.get(right.id) ?? Number.MAX_SAFE_INTEGER) || left.created_at.localeCompare(right.created_at)); }
