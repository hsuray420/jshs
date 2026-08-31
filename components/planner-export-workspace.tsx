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
  const summary = formatText(items);
  function downloadText() { download(new Blob([summary], { type: "text/plain;charset=utf-8" }), "jshs-116-volunteer-summary.txt"); }
  function downloadPdf() { download(new Blob([makeTraditionalChinesePdf(pdfLines(items))], { type: "application/pdf" }), "jshs-116-volunteer-summary.pdf"); setStatus("已產生可讀的繁體中文 PDF；長內容會自動分頁。 "); }
  return <section className="mx-auto w-[min(1120px,calc(100%-32px))] pb-12"><div className="p-6 jshs-surface-card"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm leading-7 jshs-muted-copy">摘要標示 116 服務年度；正式志願選填仍須前往官方平台。</p><h2 className="mt-2 text-xl">志願摘要 {items.length ? `（${items.length} 所）` : ""}</h2></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => window.print()} className="min-h-11 px-4 py-3 text-sm jshs-button-secondary">列印／另存 PDF</button><button type="button" onClick={downloadPdf} className="min-h-11 px-4 py-3 text-sm jshs-button-primary">下載 PDF</button><button type="button" onClick={downloadText} className="min-h-11 px-4 py-3 text-sm jshs-button-secondary">下載文字摘要</button></div></div>{status ? <p role="status" className="mt-5 rounded-xl bg-[var(--jshs-muted-surface)] p-4 text-sm jshs-muted-copy">{status}</p> : <ol className="mt-5 grid gap-2">{items.map((item, index) => <li key={item.id} className="rounded-xl bg-[var(--jshs-muted-surface)] p-4"><strong>{index + 1}. {item.school_name}</strong>{item.department ? <span className="ml-2 text-sm text-slate-500">{item.department}</span> : null}{item.notes ? <p className="mt-2 text-sm leading-6 text-slate-600">備註：{item.notes}</p> : null}</li>)}{!items.length ? <li className="rounded-xl border border-dashed p-5 text-sm text-slate-500">尚未建立志願清單。</li> : null}</ol>}</div></section>;
}

function formatText(items: readonly LocalPlannerItem[]) { return `JSHS.CC 116 學年度志願摘要\n產生日期：${new Date().toLocaleDateString("zh-TW")}\n\n${items.length ? items.map((item, index) => `${index + 1}. ${item.school_name}${item.department ? `｜${item.department}` : ""}${item.notes ? `\n   備註：${item.notes}` : ""}`).join("\n") : "尚未建立志願"}`; }
function pdfLines(items: readonly LocalPlannerItem[]) { return wrapPdfLines(formatText(items), 28); }
function wrapPdfLines(text: string, width: number) { return text.split("\n").flatMap((line) => line ? Array.from({ length: Math.ceil(line.length / width) }, (_, index) => line.slice(index * width, (index + 1) * width)) : [""]); }
function download(blob: Blob, filename: string) { const href = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = href; anchor.download = filename; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(href), 1_000); }

// Adobe's standard Traditional-Chinese CID font requires no downloaded or unlicensed project font asset.
function makeTraditionalChinesePdf(lines: readonly string[]) {
  const perPage = 40;
  const pages = Array.from({ length: Math.max(1, Math.ceil(lines.length / perPage)) }, (_, index) => lines.slice(index * perPage, (index + 1) * perPage));
  const objects: string[] = ["<< /Type /Catalog /Pages 2 0 R >>", "", "", "<< /Type /Font /Subtype /Type0 /BaseFont /MSung-Light /Encoding /UniCNS-UTF16-H /DescendantFonts [5 0 R] >>", "<< /Type /Font /Subtype /CIDFontType0 /BaseFont /MSung-Light /CIDSystemInfo << /Registry (Adobe) /Ordering (CNS1) /Supplement 7 >> >>"];
  const pageObjectIds = pages.map((_, index) => 6 + index * 2);
  objects[1] = `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`;
  for (const [index, page] of pages.entries()) {
    const pageId = 6 + index * 2;
    const contentId = pageId + 1;
    const content = [`BT /F1 12 Tf 46 795 Td`, ...page.map((line, lineIndex) => `<${utf16beHex(line)}> Tj${lineIndex < page.length - 1 ? " 0 -18 Td" : ""}`), "ET", `BT /F1 9 Tf 500 24 Td <${utf16beHex(`頁碼 ${index + 1}／${pages.length}`)}> Tj ET`].join("\n");
    objects[pageId - 1] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents ${contentId} 0 R >>`;
    objects[contentId - 1] = `<< /Length ${new TextEncoder().encode(content).length} >>\nstream\n${content}\nendstream`;
  }
  let output = "%PDF-1.7\n%\xE2\xE3\xCF\xD3\n";
  const offsets = [0];
  objects.forEach((object, index) => { offsets.push(new TextEncoder().encode(output).length); output += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const start = new TextEncoder().encode(output).length;
  output += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n `).join("\n")}\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${start}\n%%EOF`;
  return new TextEncoder().encode(output);
}
function utf16beHex(value: string) { return `FEFF${Array.from(value).map((character) => character.charCodeAt(0).toString(16).padStart(4, "0")).join("")}`; }
function sortItems(items: readonly LocalPlannerItem[], state?: LocalPlannerState) { const order = new Map((state?.order || []).map((id, index) => [id, index])); return [...items].sort((left, right) => (order.get(left.id) ?? Number.MAX_SAFE_INTEGER) - (order.get(right.id) ?? Number.MAX_SAFE_INTEGER) || left.created_at.localeCompare(right.created_at)); }
