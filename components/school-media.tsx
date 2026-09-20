"use client";

import { getResolvedSchoolMedia } from "@/lib/school-media";
import { useEffect, useState } from "react";

type SchoolMediaProps = { code: string; name: string; address?: string; latitude?: number; longitude?: number; className?: string };
type AdminMediaResponse = { adminMedia?: { coverImage: string; source: string; sourceUrl: string; alt: string; updatedAt: string } | null };

export function SchoolMedia({ code, name, address = "", latitude, longitude, className = "" }: SchoolMediaProps) {
  const initialMedia = getResolvedSchoolMedia(code, { name, address, latitude, longitude });
  const [adminMedia, setAdminMedia] = useState<AdminMediaResponse["adminMedia"]>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/school-image?code=${encodeURIComponent(code)}`, { headers: { accept: "application/json" }, signal: controller.signal })
      .then((response) => response.ok ? response.json() as Promise<AdminMediaResponse> : null)
      .then((payload) => { if (payload?.adminMedia) setAdminMedia(payload.adminMedia); })
      .catch(() => undefined);
    return () => controller.abort();
  }, [code]);
  const media = adminMedia || initialMedia;
  if (media) return <img src={media.coverImage} alt={media.alt || `${name}校園`} loading="lazy" className={`sv-school-media-image ${className}`} />;
  return <div className={`sv-school-media-placeholder ${className}`} role="img" aria-label={`${name}目前沒有合法校園圖片`}><span aria-hidden="true" className="sv-school-media-building"><i /><i /><i /></span><span>校園圖片尚未提供</span></div>;
}
