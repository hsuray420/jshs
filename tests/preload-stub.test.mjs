import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("build publishes stubs for pruned CSS-only chunks that are still preloaded", async () => {
  const script = await readFile(new URL("../scripts/publish-app-css.mjs", import.meta.url), "utf8");
  assert.match(script, /__vite_rsc_assets_manifest\.js/);
  assert.match(script, /export \{\};/);
});

test("mobile AI launcher keeps a gap above the bottom navigation", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /--ai-mobile-nav-space: calc\(68px \+ env\(safe-area-inset-bottom\)\)/);
  assert.match(css, /bottom: calc\(var\(--ai-mobile-nav-space\) \+ 12px\)/);
});
