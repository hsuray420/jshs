#!/usr/bin/env node
/**
 * JSHS Visual Acceptance Test Runner
 * Captures clean Desktop and Mobile screenshots for core pages.
 */
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const targetDir = resolve("artifacts/visual-acceptance");
if (!existsSync(targetDir)) {
  mkdirSync(targetDir, { recursive: true });
}

// Storage state ensuring initial welcome modal is dismissed
const storagePath = "/tmp/jshs-visual-storage.json";
writeFileSync(
  storagePath,
  JSON.stringify({
    cookies: [],
    origins: [
      {
        origin: "https://jshs.cc",
        localStorage: [
          { name: "jshs_intro_acknowledged", value: "1" },
        ],
      },
    ],
  }, null, 2)
);

const targets = [
  { name: "home-desktop", url: "https://jshs.cc/", viewport: "1280, 800" },
  { name: "home-mobile", url: "https://jshs.cc/", viewport: "390, 844" },
  { name: "schools-desktop", url: "https://jshs.cc/schools", viewport: "1280, 800" },
  { name: "schools-mobile", url: "https://jshs.cc/schools", viewport: "390, 844" },
  { name: "detail-desktop", url: "https://jshs.cc/schools/353301", viewport: "1280, 800" },
  { name: "detail-mobile", url: "https://jshs.cc/schools/353301", viewport: "390, 844" },
];

console.log("📸 Starting JSHS Visual Acceptance Capture...");
for (const target of targets) {
  const outputPath = resolve(targetDir, `${target.name}.png`);
  console.log(`- Capturing ${target.name} (${target.viewport}) -> ${target.url}`);
  execSync(
    `npx -y playwright screenshot --load-storage ${storagePath} --wait-for-timeout 1200 --viewport-size "${target.viewport}" "${target.url}" "${outputPath}"`,
    { stdio: "inherit" }
  );
}
console.log("✨ All visual acceptance screenshots successfully captured in artifacts/visual-acceptance/!");
