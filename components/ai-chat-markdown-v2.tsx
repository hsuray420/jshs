"use client";

import { useEffect, useState } from "react";

type MarkdownRuntime = {
  marked?: { parse: (source: string, options?: Record<string, unknown>) => string };
  DOMPurify?: { sanitize: (html: string, options?: Record<string, unknown>) => string };
  hljs?: { highlightElement: (element: HTMLElement) => void; getLanguage: (language: string) => unknown };
};

declare global {
  interface Window {
    marked?: MarkdownRuntime["marked"];
    DOMPurify?: MarkdownRuntime["DOMPurify"];
    hljs?: MarkdownRuntime["hljs"];
  }
}

const CDN_SCRIPTS = [
  ["ai-marked", "https://cdn.jsdelivr.net/npm/marked@15.0.7/marked.min.js"],
  ["ai-dompurify", "https://cdn.jsdelivr.net/npm/dompurify@3.2.5/dist/purify.min.js"],
  ["ai-highlight", "https://cdn.jsdelivr.net/npm/highlight.js@11.11.1/lib/common.min.js"],
] as const;

let runtimePromise: Promise<void> | null = null;

function loadRuntime() {
  if (runtimePromise) return runtimePromise;
  runtimePromise = CDN_SCRIPTS.reduce((promise, [id, src]) => promise.then(() => new Promise<void>((resolve) => {
    if (document.getElementById(id)) return resolve();
    const script = document.createElement("script"); script.id = id; script.src = src; script.async = true; script.onload = () => resolve(); script.onerror = () => resolve(); document.head.appendChild(script);
  })), Promise.resolve());
  return runtimePromise;
}

function closeOpenFence(content: string) { const fences = content.match(/^\s*```/gmu)?.length || 0; return fences % 2 ? `${content}\n\n\`\`\`` : content; }

function renderSafeMarkdown(content: string) {
  const marked = window.marked?.parse;
  const purifier = window.DOMPurify?.sanitize;
  if (!marked || !purifier) return "";
  const raw = marked(closeOpenFence(content), { gfm: true, breaks: true });
  const clean = purifier(raw, { USE_PROFILES: { html: true }, ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|\/)/iu });
  const template = document.createElement("template"); template.innerHTML = clean;
  template.content.querySelectorAll("pre code").forEach((code) => {
    const language = [...code.classList].find((item) => item.startsWith("language-"))?.replace("language-", "") || "程式碼";
    if (window.hljs && (!language || window.hljs.getLanguage(language))) window.hljs.highlightElement(code as HTMLElement);
    const pre = code.parentElement; if (!pre || pre.querySelector(".ai-chat-code-copy")) return;
    pre.dataset.language = language;
    const button = document.createElement("button");
    button.className = "ai-chat-code-copy";
    button.type = "button";
    button.setAttribute("aria-label", "複製程式碼");
    button.textContent = "複製";
    pre.innerHTML = button.outerHTML + pre.innerHTML;
  });
  return template.innerHTML;
}

export function AiChatMarkdown({ content }: { content: string }) {
  const [html, setHtml] = useState("");
  useEffect(() => { let active = true; void loadRuntime().then(() => { if (active) setHtml(renderSafeMarkdown(content)); }); return () => { active = false; }; }, [content]);
  async function copyCode(event: React.MouseEvent<HTMLDivElement>) {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>(".ai-chat-code-copy"); if (!button) return; const code = button.parentElement?.querySelector("code")?.textContent || ""; await navigator.clipboard?.writeText(code); const original = button.textContent; button.textContent = "已複製 ✓"; window.setTimeout(() => { button.textContent = original || "複製"; }, 2000);
  }
  if (!html) return <div className="ai-chat-markdown ai-chat-markdown-fallback">{content.split("\n").map((line, index) => <p key={`${line}-${index}`}>{line || "\u00a0"}</p>)}</div>;
  return <div className="ai-chat-markdown" onClick={copyCode} dangerouslySetInnerHTML={{ __html: html }} />;
}
