"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import districtMetadata from "../public/it_hs/district-metadata.json";
import { getDistrictLabel, normalizeDistrict, readStoredDistrict, subscribeToDistrict, writeStoredDistrict, type DistrictCode } from "@/lib/district-context";
import { getRegionById } from "@/lib/region-registry";

type DistrictGateProps = Readonly<{
  children: React.ReactNode;
  initialDistrict?: string;
  title?: string;
}>;

export function DistrictGate({ children, initialDistrict, title = "先選擇就學區，才會顯示適用資料" }: DistrictGateProps) {
  const storedDistrict = useSyncExternalStore(subscribeToDistrict, readStoredDistrict, () => "") as DistrictCode | "";
  const district = normalizeDistrict(initialDistrict) || storedDistrict;
  const [draft, setDraft] = useState<DistrictCode | "">(normalizeDistrict(initialDistrict));
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ready = useSyncExternalStore((callback) => { window.setTimeout(callback, 0); return () => undefined; }, () => true, () => false);

  useEffect(() => {
    if (initialDistrict) writeStoredDistrict(initialDistrict);
  }, [initialDistrict]);

  const selected = useMemo(() => district ? districtMetadata.districts[district] : null, [district]);

  function confirm() {
    const next = writeStoredDistrict(draft);
    if (!next) return;
    setOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    params.set("district", next);
    router.replace(`${pathname}?${params.toString()}`);
  }

  function changeDistrict() {
    setDraft(district);
    setOpen(true);
  }

  return (
    <>
      {children}
      <div className="mx-auto flex w-[min(1180px,calc(100%-32px))] items-center justify-between gap-3 border-b border-[var(--jshs-border)] py-3 text-sm" data-district-context="shared" data-storage-key="jshs_district" data-change-event="jshs-district-changed">
        <span className="jshs-muted-copy">目前使用：<strong className="text-[var(--jshs-primary)]">{getDistrictLabel(district)}</strong>{selected ? ` · ${selected.academicYear} 學年度` : ""}{getRegionById(district)?.calculatorStatus === "verifying" ? " · 資料驗證中" : ""}</span>
        <button type="button" onClick={changeDistrict} className="text-sm font-black text-[var(--jshs-primary)]">切換就學區</button>
      </div>
      {ready && (open || !district) ? (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/35 p-4" role="dialog" aria-modal="true" aria-labelledby="district-gate-title">
          <section className="w-[min(520px,100%)] p-6 md:p-8 jshs-surface-card">
            <p className="jshs-eyebrow">地區前置設定</p>
            <h2 id="district-gate-title" className="mt-2 text-2xl">{title}</h2>
            <p className="mt-3 text-sm leading-6 jshs-muted-copy">學校查詢與成績試算目前只開放已完成資料驗證的區域；其他區域會標示「資料驗證中」。選定後右上角會同步更新，之後不會重複詢問。</p>
            <label className="mt-6 grid gap-2 text-sm font-black text-[var(--jshs-primary)]">就學區<select value={draft} onChange={(event) => setDraft(normalizeDistrict(event.target.value))}><option value="">請選擇就學區</option>{Object.entries(districtMetadata.districts).map(([code, item]) => <option key={code} value={code}>{item.label}{getRegionById(code)?.schoolDataStatus === "verifying" ? "（資料驗證中）" : ""}</option>)}</select></label>
            {draft && getRegionById(draft)?.schoolDataStatus === "verifying" ? <p className="mt-3 rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-950" role="status">{getDistrictLabel(draft)}資料驗證中，學校查詢與成績試算尚未開放。</p> : draft ? <p className="mt-3 rounded-2xl bg-[var(--jshs-muted-surface)] p-4 text-sm leading-6 jshs-muted-copy">將使用 {getDistrictLabel(draft)} 的 {districtMetadata.districts[draft].academicYear} 學年度資料；正式公告仍以招生單位最新版本為準。</p> : null}
            <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={confirm} disabled={!draft} className="px-5 py-3 text-sm jshs-button-primary">確認並繼續</button></div>
          </section>
        </div>
      ) : null}
    </>
  );
}
