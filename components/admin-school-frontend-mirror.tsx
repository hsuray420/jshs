"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AdminSchoolDetailEditor, type AdminSchoolDetailEditorProps, type RawSchool } from "@/components/admin-school-detail-editor";
import { SchoolDetailClient } from "@/components/school-detail-client";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

type Props = Omit<AdminSchoolDetailEditorProps, "onDraftChange">;
type Viewport = "desktop" | "tablet" | "mobile";

const viewportWidths: Record<Viewport, string> = { desktop: "100%", tablet: "768px", mobile: "390px" };

export function AdminSchoolFrontendMirror(props: Props) {
  const [draft, setDraft] = useState<RawSchool>(props.initialDraft);
  const [editorOpen, setEditorOpen] = useState(false);
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [previewMode, setPreviewMode] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  const updateDraft = useCallback((next: RawSchool) => setDraft(next), []);

  useEffect(() => {
    if (!editorOpen) return;
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeButtonRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setEditorOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(drawerRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ) || []).filter((element) => element.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
      previousFocus.current?.focus();
    };
  }, [editorOpen]);

  return <section className={`admin-frontend-mirror ${previewMode ? "is-previewing" : ""}`}>
    <header className="admin-mirror-toolbar" aria-label="Admin 編輯工具列">
      <div className="admin-mirror-toolbar-context"><Link href="/admin/schools" aria-label="離開前台鏡像編輯">← 離開編輯</Link><div><p className="admin-eyebrow">Admin Edit Mode</p><h1>前台鏡像編輯</h1><p>{props.raw["學校名稱"] || props.schoolCode} · 草稿不會立即更新正式網站</p></div></div>
      <div className="admin-mirror-toolbar-actions">
        <fieldset className="admin-viewport-switch"><legend>預覽尺寸</legend>{(["desktop", "tablet", "mobile"] as const).map((size) => <button key={size} type="button" aria-pressed={viewport === size} onClick={() => setViewport(size)}>{size === "desktop" ? "桌面" : size === "tablet" ? "平板" : "手機"}</button>)}</fieldset>
        <span className="admin-edit-mode-status" role="status">{previewMode ? "預覽模式" : "草稿編輯模式"}</span>
        <button className="admin-button-secondary" type="button" onClick={() => setPreviewMode((current) => !current)}>{previewMode ? "返回編輯" : "預覽"}</button>
        {!previewMode ? <button className="admin-button" type="button" onClick={() => setEditorOpen(true)}>編輯這所學校</button> : null}
      </div>
    </header>
    <div className={`admin-mirror-viewport is-${viewport}`}>
      <div className="admin-mirror-site" style={{ width: viewportWidths[viewport] }}>
        <main className="min-h-screen jshs-page-shell jshs-feature-school">
          <SiteHeader activeHref="/schools" />
          <div className="sv-root admin-editable-surface"><SchoolDetailClient code={props.schoolCode} previewRaw={draft} />{!previewMode ? <button className="admin-edit-affordance" type="button" onClick={() => setEditorOpen(true)} aria-label="編輯學校資料">✎ 編輯</button> : null}</div>
          <SiteFooter />
        </main>
      </div>
    </div>
    {editorOpen ? <div className="admin-editor-drawer-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditorOpen(false); }}>
      <section ref={drawerRef} className="admin-editor-drawer" role="dialog" aria-modal="true" aria-labelledby="admin-editor-drawer-title">
        <header><div><p className="admin-eyebrow">School / {props.regionCode}</p><h2 id="admin-editor-drawer-title">{props.raw["學校名稱"] || props.schoolCode}</h2></div><button ref={closeButtonRef} type="button" className="admin-button-secondary" onClick={() => setEditorOpen(false)}>關閉編輯器</button></header>
        <AdminSchoolDetailEditor {...props} onDraftChange={updateDraft} />
      </section>
    </div> : null}
  </section>;
}
