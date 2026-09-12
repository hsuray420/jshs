"use client";

import { useEffect, useState } from "react";
import type { SchoolSearchIndexEntry } from "@/lib/school-search-index";

export type SourceLink = Readonly<{ label: string; url: string }>;
export type SchoolDetail = Readonly<{
  code: string;
  name: string;
  ownership: string;
  schoolType: string;
  gender: string;
  city: string;
  area: string;
  address: string;
  phone: string;
  website: string;
  mapUrl: string;
  admissionDistricts: readonly string[];
  admissionRecords: readonly {
    id: string;
    sourceDistrict: string;
    admissionDistrict: string;
    departmentRaw: string;
    brochureQuota: string;
    admissionQuota: string;
    raw: Record<string, string>;
  }[];
  features: string;
  courseDirection: string;
  project: string;
  transport: string;
  commute: string;
  lodging: string;
  sourceMetadata: Record<string, string>;
  sources: Record<string, readonly SourceLink[]>;
}>;

const detailCache = new Map<string, SchoolDetail>();
let indexCache: readonly SchoolSearchIndexEntry[] | null = null;

export function useSchoolSearchIndex() {
  const [schools, setSchools] = useState<readonly SchoolSearchIndexEntry[]>(() => indexCache || []);
  const [loading, setLoading] = useState(!indexCache);
  const [error, setError] = useState("");
  useEffect(() => {
    if (indexCache) return;
    const controller = new AbortController();
    fetch("/data/school-search-index.json", { headers: { accept: "application/json" }, signal: controller.signal })
      .then((response) => response.ok ? response.json() as Promise<{ schools?: SchoolSearchIndexEntry[] }> : Promise.reject(new Error(`school-search-index ${response.status}`)))
      .then((payload) => {
        indexCache = payload.schools || [];
        setSchools(indexCache);
        setError("");
      })
      .catch((caught) => { if (caught.name !== "AbortError") setError("目前無法載入學校搜尋索引。"); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);
  return { schools, loading, error };
}

export function useSelectedSchoolDetails(codes: readonly string[]) {
  const selectedKey = codes.join("|");
  const [details, setDetails] = useState<readonly SchoolDetail[]>([]);
  useEffect(() => {
    const wanted = [...new Set(codes)].filter(Boolean);
    if (!wanted.length) return;
    const controller = new AbortController();
    Promise.all(wanted.map(async (code) => {
      const cached = detailCache.get(code);
      if (cached) return cached;
      const response = await fetch(`/data/schools/by-code/${encodeURIComponent(code)}.json`, { headers: { accept: "application/json" }, signal: controller.signal });
      if (!response.ok) throw new Error(`school-detail ${code} ${response.status}`);
      const payload = await response.json() as { school?: SchoolDetail };
      if (!payload.school) throw new Error(`school-detail ${code} empty`);
      detailCache.set(code, payload.school);
      return payload.school;
    }))
      .then(setDetails)
      .catch((caught) => { if (caught.name !== "AbortError") setDetails([]); });
    return () => controller.abort();
  }, [codes, selectedKey]);
  return { details: selectedKey ? details.filter((school) => codes.includes(school.code)) : [], loading: false };
}
