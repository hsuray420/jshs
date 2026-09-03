import roadmap from "@/content/news/116-junior-high-exam-roadmap.md?raw";
import vocationalChoice from "@/content/news/general-vocational-five-year-choice.md?raw";
import districtEnrollment from "@/content/news/how-to-confirm-enrollment-district.md?raw";
import parentMeeting from "@/content/news/parent-student-admission-meeting.md?raw";
import scoreRanking from "@/content/news/score-ranking-placement-difference.md?raw";
import wishList from "@/content/news/wish-list-three-tiers.md?raw";
import { parseFrontmatter } from "./markdown";
import { validateContentMetadata } from "./schema";
import type { ContentDocument, ContentMetadata } from "./types";
import guideNavigation from "@/content/guide/navigation.json";

const contentSources: Readonly<Record<string, readonly string[]>> = Object.freeze({
  news: Object.freeze([roadmap, vocationalChoice, districtEnrollment, parentMeeting, scoreRanking, wishList]),
});

function loadCollection<T extends ContentMetadata = ContentMetadata>(collection: string): readonly ContentDocument<T>[] {
  const sources = contentSources[collection] || [];
  const documents = sources.map((source, index) => {
    const document = parseFrontmatter<T>(source, `${collection}[${index}]`);
    validateContentMetadata(document.metadata, `${collection}[${index}]`);
    return document;
  });
  return Object.freeze(documents.filter((document) => document.metadata.status === "published"));
}

export async function getContentCollection<T extends ContentMetadata = ContentMetadata>(collection: string) {
  return loadCollection<T>(collection);
}

export async function getContentBySlug<T extends ContentMetadata = ContentMetadata>(collection: string, slug: string) {
  return (await getContentCollection<T>(collection)).find((document) => document.metadata.slug === slug);
}

export function getContentCollectionSync<T extends ContentMetadata = ContentMetadata>(collection: string) {
  return loadCollection<T>(collection);
}

export type GuideTopic = Readonly<{ title: string; description: string }>;
export function getGuideTopic(topic: string): GuideTopic | undefined {
  return guideNavigation.topics[topic as keyof typeof guideNavigation.topics];
}
export function getGuideTopics() { return Object.keys(guideNavigation.topics); }
