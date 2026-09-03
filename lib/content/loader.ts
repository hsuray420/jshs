import { readdir, readFile } from "node:fs/promises";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseFrontmatter } from "./markdown";
import { validateContentMetadata } from "./schema";
import type { ContentDocument, ContentMetadata } from "./types";
import guideNavigation from "@/content/guide/navigation.json";

const root = resolve(process.cwd(), "content");

export async function getContentCollection<T extends ContentMetadata = ContentMetadata>(collection: string): Promise<readonly ContentDocument<T>[]> {
  const directory = resolve(root, collection);
  const files = (await readdir(directory)).filter((file) => file.endsWith(".md")).sort();
  const documents = await Promise.all(files.map(async (file) => {
    const path = resolve(directory, file);
    const document = parseFrontmatter<T>(await readFile(path, "utf8"), path);
    validateContentMetadata(document.metadata, path);
    return document;
  }));
  return Object.freeze(documents.filter((document) => document.metadata.status === "published"));
}

export async function getContentBySlug<T extends ContentMetadata = ContentMetadata>(collection: string, slug: string) {
  return (await getContentCollection<T>(collection)).find((document) => document.metadata.slug === slug);
}

export function getContentCollectionSync<T extends ContentMetadata = ContentMetadata>(collection: string): readonly ContentDocument<T>[] {
  const directory = resolve(root, collection);
  return Object.freeze(readdirSync(directory).filter((file) => file.endsWith(".md")).sort().map((file) => {
    const path = resolve(directory, file);
    const document = parseFrontmatter<T>(readFileSync(path, "utf8"), path);
    validateContentMetadata(document.metadata, path);
    return document;
  }).filter((document) => document.metadata.status === "published"));
}

export type GuideTopic = Readonly<{ title: string; description: string }>;
export function getGuideTopic(topic: string): GuideTopic | undefined {
  return guideNavigation.topics[topic as keyof typeof guideNavigation.topics];
}
export function getGuideTopics() { return Object.keys(guideNavigation.topics); }
