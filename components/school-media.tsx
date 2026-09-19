import { getResolvedSchoolMedia } from "@/lib/school-media";

export function SchoolMedia({ code, name, address = "", latitude, longitude, className = "" }: { code: string; name: string; address?: string; latitude?: number; longitude?: number; className?: string }) {
  const media = getResolvedSchoolMedia(code, { name, address, latitude, longitude });
  if (media) return <img src={media.coverImage} alt={media.alt || `${name}校園`} loading="lazy" className={`sv-school-media-image ${className}`} />;
  return <div className={`sv-school-media-placeholder ${className}`} role="img" aria-label={`${name}目前沒有合法校園圖片`}><span aria-hidden="true" className="sv-school-media-building"><i /><i /><i /></span><span>校園圖片尚未提供</span></div>;
}
