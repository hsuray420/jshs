"use client";

import Link from "next/link";

function inline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|https?:\/\/[^\s)]+)/g);
  return parts.map((part, index) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (/^`[^`]+`$/.test(part)) return <code key={index}>{part.slice(1, -1)}</code>;
    if (/^https?:\/\//.test(part)) return <a key={index} href={part} target="_blank" rel="noreferrer">{part.replace(/^https?:\/\//, "")}</a>;
    return <span key={index}>{part}</span>;
  });
}

export function AiChatMarkdown({ content }: { content: string }) {
  const lines = content.split("\n");
  const blocks: React.ReactNode[] = [];
  let code: string[] = [];
  let inCode = false;
  let list: string[] = [];

  const flushList = () => { if (list.length) { blocks.push(<ul key={`list-${blocks.length}`}>{list.map((item) => <li key={item}>{inline(item)}</li>)}</ul>); list = []; } };
  const flushCode = () => { if (code.length) { blocks.push(<pre key={`code-${blocks.length}`}><code>{code.join("\n")}</code></pre>); code = []; } };

  lines.forEach((line, index) => {
    if (line.trim().startsWith("```")) { flushList(); if (inCode) flushCode(); inCode = !inCode; return; }
    if (inCode) { code.push(line); return; }
    const bullet = line.match(/^\s*[-*]\s+(.+)/);
    if (bullet) { list.push(bullet[1]); return; }
    flushList();
    if (/^###\s+/.test(line)) blocks.push(<h4 key={index}>{inline(line.replace(/^###\s+/, ""))}</h4>);
    else if (/^##\s+/.test(line)) blocks.push(<h3 key={index}>{inline(line.replace(/^##\s+/, ""))}</h3>);
    else if (/^#\s+/.test(line)) blocks.push(<h2 key={index}>{inline(line.replace(/^#\s+/, ""))}</h2>);
    else if (/^>\s+/.test(line)) blocks.push(<blockquote key={index}>{inline(line.replace(/^>\s+/, ""))}</blockquote>);
    else if (line.trim()) blocks.push(<p key={index}>{inline(line)}</p>);
  });
  flushList(); flushCode();
  return <div className="ai-chat-markdown">{blocks.length ? blocks : <p>…</p>}</div>;
}

export function AiChatLink({ href, children }: { href: string; children: React.ReactNode }) {
  return href.startsWith("/") ? <Link href={href}>{children}</Link> : <a href={href}>{children}</a>;
}
