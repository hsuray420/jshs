"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type MarkdownRuntime = {
  marked: { parse: (source: string, options?: Record<string, unknown>) => string };
  DOMPurify: { sanitize: (html: string, options?: Record<string, unknown>) => string };
  hljs?: { highlightElement: (element: HTMLElement) => void };
};

declare global {
  interface Window {
    marked?: MarkdownRuntime["marked"];
    DOMPurify?: MarkdownRuntime["DOMPurify"];
    hljs?: MarkdownRuntime["hljs"];
    __jshsMarkdownRuntime?: Promise<MarkdownRuntime>;
  }
}

const CDN_SCRIPTS = [
  ["jshs-marked", "https://cdn.jsdelivr.net/npm/marked@15.0.7/marked.min.js"],
  ["jshs-dompurify", "https://cdn.jsdelivr.net/npm/dompurify@3.2.6/dist/purify.min.js"],
  ["jshs-highlight", "https://cdn.jsdelivr.net/npm/highlight.js@11.11.1/lib/common.min.js"],
] as const;

function loadMarkdownRuntime(): Promise<MarkdownRuntime> {
  if (typeof window === "undefined") return Promise.reject(new Error("markdown_runtime_unavailable"));
  if (window.__jshsMarkdownRuntime) return window.__jshsMarkdownRuntime;
  window.__jshsMarkdownRuntime = Promise.all(CDN_SCRIPTS.map(([id, src]) => new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(id) as HTMLScriptElement | null;
    if (existing?.dataset.loaded === "true") { resolve(); return; }
    const script = existing || document.createElement("script");
    script.id = id;
    script.src = src;
    script.async = true;
    script.onload = () => { script.dataset.loaded = "true"; resolve(); };
    script.onerror = () => reject(new Error("markdown_cdn_failed"));
    if (!existing) document.head.appendChild(script);
  }))).then(() => {
    if (!window.marked || !window.DOMPurify) throw new Error("markdown_runtime_incomplete");
    return { marked: window.marked, DOMPurify: window.DOMPurify, hljs: window.hljs };
  }).catch((error) => { window.__jshsMarkdownRuntime = undefined; throw error; });
  return window.__jshsMarkdownRuntime;
}

function fallbackMarkdown(content: string) {
  return <div className="ai-chat-markdown ai-chat-markdown-fallback"><p>{content || "…"}</p></div>;
}

export function AiChatMarkdown({ content }: { content: string }) {
  const [runtime, setRuntime] = useState<MarkdownRuntime | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => { let active = true; void loadMarkdownRuntime().then((next) => { if (active) setRuntime(next); }).catch(() => undefined); return () => { active = false; }; }, []);
  useEffect(() => {
    if (!runtime || !rootRef.current) return;
    rootRef.current.querySelectorAll<HTMLElement>("pre code").forEach((code) => {
      const pre = code.parentElement;
      if (!pre || pre.dataset.enhanced === "true") return;
      pre.dataset.enhanced = "true";
      const language = [...code.classList].find((name) => name.startsWith("language-"))?.replace("language-", "") || "code";
      const wrapper = document.createElement("div");
      wrapper.className = "ai-code-block";
      pre.parentNode?.insertBefore(wrapper, pre);
      const toolbar = document.createElement("div");
      toolbar.className = "ai-code-toolbar";
      toolbar.innerHTML = `<span>${language}</span><button type="button" class="ai-code-copy" aria-label="複製程式碼">複製</button>`;
      wrapper.appendChild(toolbar);
      wrapper.appendChild(pre);
      runtime.hljs?.highlightElement(code);
    });
  }, [content, runtime]);
  if (!runtime) return fallbackMarkdown(content);
  const source = runtime.marked.parse(content || "…", { gfm: true, breaks: true, async: false });
  const safe = runtime.DOMPurify.sanitize(source, { USE_PROFILES: { html: true }, FORBID_TAGS: ["style", "script", "iframe", "object"] });
  function copyCode(event: React.MouseEvent<HTMLDivElement>) {
    const target = (event.target as HTMLElement).closest<HTMLButtonElement>(".ai-code-copy");
    if (!target) return;
    const code = target.closest(".ai-code-block")?.querySelector("code")?.textContent || "";
    void navigator.clipboard?.writeText(code).then(() => { target.textContent = "已複製 ✓"; window.setTimeout(() => { target.textContent = "複製"; }, 2_000); });
  }
  return <div ref={rootRef} className="ai-chat-markdown" onClick={copyCode} dangerouslySetInnerHTML={{ __html: safe }} />;
}

export function AiChatLink({ href, children }: { href: string; children: React.ReactNode }) {
  return href.startsWith("/") ? <Link href={href}>{children}</Link> : <a href={href}>{children}</a>;
}
