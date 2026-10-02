import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = (path) => readFile(new URL(path, root), "utf8");

test("the shared header fades into every page without a hard divider", async () => {
  const [layout, css] = await Promise.all([
    source("app/layout.tsx"),
    source("app/header-surface-transition.css"),
  ]);

  assert.match(layout, /import "\.\/header-surface-transition\.css";/);
  assert.match(css, /\.jshs-site-header\s*\{[^}]*border-bottom:\s*0 !important;[^}]*box-shadow:\s*none !important;/s);
  assert.match(css, /\.jshs-site-header::after\s*\{[^}]*linear-gradient\(\s*to bottom,\s*rgb\(255 255 255 \/ 88%\),\s*rgb\(255 255 255 \/ 0%\)\s*\)/s);
  assert.match(css, /pointer-events:\s*none;/);
});
