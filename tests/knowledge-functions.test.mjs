import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("升學知識每個入口都接到可操作工作區", async () => {
  const route = await readFile(new URL("../app/knowledge/[topic]/page.tsx", import.meta.url), "utf8");
  const workspace = await readFile(new URL("../components/knowledge-topic-workspace.tsx", import.meta.url), "utf8");
  const topics = ["admission-basics", "glossary", "misconceptions", "alumni-stories", "videos", "podcast", "fit-quiz", "career-map", "groups"];

  assert.match(route, /KnowledgeTopicWorkspace/);
  for (const topic of topics) assert.match(route, new RegExp(topic.replaceAll("-", "\\-")));
  assert.match(workspace, /useState/);
  assert.match(workspace, /onClick/);
  assert.match(workspace, /placeholder="例如：序位、群科、志願"/);
  assert.match(workspace, /請完成三題/);
});
