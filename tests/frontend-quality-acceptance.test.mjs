import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("Apple Visual Design: font stack, design tokens, and squircle radii", async () => {
  const [tokensCss, designSystem] = await Promise.all([
    read("public/design-tokens.css"),
    read("DESIGN_SYSTEM.md"),
  ]);

  // 1. Apple-inspired typography stack
  assert.match(
    tokensCss,
    /-apple-system|BlinkMacSystemFont|"SF Pro Text"/,
    "Design tokens must include Apple system font stack",
  );

  // 2. Surface hierarchy tokens
  assert.match(tokensCss, /--bg-page:/, "Must define --bg-page surface");
  assert.match(tokensCss, /--bg-elevated:/, "Must define --bg-elevated surface");
  assert.match(tokensCss, /--bg-subtle:/, "Must define --bg-subtle surface");
  assert.match(tokensCss, /--bg-glass:/, "Must define --bg-glass translucent surface");

  // 3. Apple squircle radii scale
  assert.match(tokensCss, /--radius-sm:\s*8px/, "Must specify 8px for radius-sm");
  assert.match(tokensCss, /--radius-md:\s*12px/, "Must specify 12px for radius-md");
  assert.match(tokensCss, /--radius-lg:\s*16px/, "Must specify 16px for radius-lg");
  assert.match(tokensCss, /--radius-xl:\s*20px/, "Must specify 20px for radius-xl");

  // 4. Anti-AI-Slop design guidelines documented
  assert.match(designSystem, /Apple Aesthetic Elegance|Apple Human Interface/i);
  assert.match(designSystem, /Restrained & Purposeful Motion/i);
});

test("Kinetic Motion & Interaction: universal reduced motion and micro-interaction safety", async () => {
  const [globalsCss, schoolExplorer] = await Promise.all([
    read("app/globals.css"),
    read("components/school-explorer.tsx"),
  ]);

  // Universal prefers-reduced-motion reset
  assert.match(
    globalsCss,
    /@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)\s*\{[\s\S]*?animation-duration:\s*0\.01ms/s,
    "Global stylesheet must enforce 0.01ms animation reset under prefers-reduced-motion",
  );

  // Purposeful micro-interaction
  assert.match(
    schoolExplorer,
    /heart-pop-anim/,
    "Heart favorite button must use purposeful spring pop animation",
  );
});

test("QA Quality Gate: rule integration and verification readiness", async () => {
  const agentsRule = await read("AGENTS.md");
  assert.match(
    agentsRule,
    /frontend-quality-workflow\.md/,
    "AGENTS.md must reference the frontend quality workflow rule",
  );
  assert.match(
    agentsRule,
    /prefers-reduced-motion/,
    "AGENTS.md must mandate prefers-reduced-motion compliance",
  );
});
