"use client";

import { getResolvedSchoolMedia } from "@/lib/school-media";
import { useEffect, useMemo, useState } from "react";

type SchoolMediaProps = {
  code: string;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  className?: string;
};

type AdminMediaResponse = {
  adminMedia?: {
    coverImage: string;
    source: string;
    sourceUrl: string;
    alt: string;
    updatedAt: string;
  } | null;
};

type SchoolType = "technical" | "junior_college" | "comprehensive" | "general";

function getSchoolCategory(name: string, address: string): { type: SchoolType; typeLabel: string; region: string } {
  // Extract region / city
  let region = "";
  const match = address.match(/^([\u4e00-\u9fa5]{2}[縣市])/);
  if (match) {
    region = match[1];
  } else if (name.startsWith("臺北") || name.startsWith("台北")) {
    region = "臺北市";
  } else if (name.startsWith("新北")) {
    region = "新北市";
  } else if (name.startsWith("臺中") || name.startsWith("台中")) {
    region = "臺中市";
  } else if (name.startsWith("高雄")) {
    region = "高雄市";
  } else if (name.startsWith("臺南") || name.startsWith("台南")) {
    region = "臺南市";
  } else if (name.startsWith("桃園")) {
    region = "桃園市";
  } else {
    region = "臺灣校園";
  }

  if (/高級工業|高級家事|高級商業|高級職業|高級工商|農工|高職|工職|商職|商工|家商/.test(name)) {
    return { type: "technical", typeLabel: "技術型高中", region };
  }
  if (/專科|五專|科技大學|科大|護理專科/.test(name)) {
    return { type: "junior_college", typeLabel: "五專院校", region };
  }
  if (/附屬|附中|實驗中學|完全中學|綜合高中/.test(name)) {
    return { type: "comprehensive", typeLabel: "綜合型學府", region };
  }
  return { type: "general", typeLabel: "普通型高中", region };
}

export function SchoolMedia({ code, name, address = "", latitude, longitude, className = "" }: SchoolMediaProps) {
  const initialMedia = useMemo(() => getResolvedSchoolMedia(code, { name, address, latitude, longitude }), [code, name, address, latitude, longitude]);
  const [adminMedia, setAdminMedia] = useState<AdminMediaResponse["adminMedia"]>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/school-image?code=${encodeURIComponent(code)}`, {
      headers: { accept: "application/json" },
      signal: controller.signal,
    })
      .then((response) => (response.ok ? (response.json() as Promise<AdminMediaResponse>) : null))
      .then((payload) => {
        if (payload?.adminMedia) setAdminMedia(payload.adminMedia);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [code]);

  const media = adminMedia || initialMedia;

  if (media?.coverImage) {
    return (
      <div className={`sv-school-media-wrap ${className}`}>
        <img
          src={media.coverImage}
          alt={media.alt || `${name}校園`}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          className={`sv-school-media-image ${imageLoaded ? "is-loaded" : ""} ${className}`}
        />
      </div>
    );
  }

  const { type, typeLabel, region } = getSchoolCategory(name, address);

  return (
    <div
      className={`sv-school-media-placeholder sv-school-poster sv-school-poster--${type} ${className}`}
      role="img"
      aria-label={`${name} - ${typeLabel}`}
    >
      <svg
        viewBox="0 0 400 250"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="sv-poster-svg"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          {/* General High School: Sky Blue & Soft Lavender */}
          <linearGradient id={`grad-general-${code}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#DBEAFE" />
            <stop offset="50%" stopColor="#E0E7FF" />
            <stop offset="100%" stopColor="#F3E8FF" />
          </linearGradient>

          {/* Technical High School: Coral & Warm Amber */}
          <linearGradient id={`grad-technical-${code}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFEDD5" />
            <stop offset="55%" stopColor="#FEF3C7" />
            <stop offset="100%" stopColor="#FCE7F3" />
          </linearGradient>

          {/* Junior College: Mint Emerald & Cyan Sky */}
          <linearGradient id={`grad-junior-${code}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#D1FAE5" />
            <stop offset="55%" stopColor="#CCFBF1" />
            <stop offset="100%" stopColor="#E0F2FE" />
          </linearGradient>

          {/* Comprehensive: Star Indigo & Sunset Cloud */}
          <linearGradient id={`grad-comprehensive-${code}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E0E7FF" />
            <stop offset="55%" stopColor="#EDE9FE" />
            <stop offset="100%" stopColor="#FAE8FF" />
          </linearGradient>

          <radialGradient id={`glow-${code}`} cx="80%" cy="20%" r="55%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Poster Canvas Background */}
        <rect
          width="400"
          height="250"
          fill={
            type === "technical"
              ? `url(#grad-technical-${code})`
              : type === "junior_college"
              ? `url(#grad-junior-${code})`
              : type === "comprehensive"
              ? `url(#grad-comprehensive-${code})`
              : `url(#grad-general-${code})`
          }
        />

        {/* Ambient Top Glow */}
        <circle cx="340" cy="40" r="140" fill={`url(#glow-${code})`} />

        {/* Architecture Illustrations according to School Type */}
        {type === "technical" ? (
          // Technical / Maker High School: High-tech workshop, angular roof, STEM gear & skyline
          <g opacity="0.85" className="sv-poster-art">
            {/* Background geometric skyline */}
            <path d="M40 250V130h50v-30h60v50h45v-40h75v70h90v70H40Z" fill="#FDBA74" fillOpacity="0.22" />
            {/* Dynamic perspective lines */}
            <path d="M0 210L140 160L400 220" stroke="#F97316" strokeWidth="1.5" strokeOpacity="0.3" strokeDasharray="4 4" />
            {/* Workshop Building */}
            <path d="M120 250V120l60-35 60 35v130H120Z" fill="#FFFFFF" fillOpacity="0.82" />
            <path d="M120 120l60-35 60 35" stroke="#EA580C" strokeWidth="2.5" strokeLinejoin="round" />
            {/* Workshop Gridded Windows */}
            <rect x="135" y="135" width="22" height="30" rx="3" fill="#FED7AA" fillOpacity="0.8" stroke="#EA580C" strokeWidth="1.2" />
            <rect x="169" y="135" width="22" height="30" rx="3" fill="#FED7AA" fillOpacity="0.8" stroke="#EA580C" strokeWidth="1.2" />
            <rect x="203" y="135" width="22" height="30" rx="3" fill="#FED7AA" fillOpacity="0.8" stroke="#EA580C" strokeWidth="1.2" />
            <rect x="135" y="180" width="22" height="34" rx="3" fill="#FED7AA" fillOpacity="0.8" stroke="#EA580C" strokeWidth="1.2" />
            <rect x="169" y="180" width="22" height="34" rx="3" fill="#FED7AA" fillOpacity="0.8" stroke="#EA580C" strokeWidth="1.2" />
            <rect x="203" y="180" width="22" height="34" rx="3" fill="#FED7AA" fillOpacity="0.8" stroke="#EA580C" strokeWidth="1.2" />
            {/* STEM Gear / Innovation Motif */}
            <circle cx="310" cy="90" r="32" stroke="#EA580C" strokeWidth="2" strokeDasharray="6 4" strokeOpacity="0.45" />
            <circle cx="310" cy="90" r="16" fill="#FDBA74" fillOpacity="0.35" stroke="#EA580C" strokeWidth="1.5" />
            <path d="M310 68v44M288 90h44" stroke="#EA580C" strokeWidth="1.8" strokeOpacity="0.5" />
            {/* Tech Horizon Platform */}
            <path d="M0 230h400v20H0z" fill="#EA580C" fillOpacity="0.12" />
          </g>
        ) : type === "junior_college" ? (
          // Junior College: Academy dome, colonnade, open collegiate atrium
          <g opacity="0.85" className="sv-poster-art">
            {/* Background wing */}
            <path d="M30 250V140h85v110H30Zm255 0V140h85v110h-85Z" fill="#A7F3D0" fillOpacity="0.25" />
            {/* Central Dome Hall */}
            <path d="M140 130c0-33 27-60 60-60s60 27 60 60v120H140V130Z" fill="#FFFFFF" fillOpacity="0.85" />
            <path d="M140 130c0-33 27-60 60-60s60 27 60 60" stroke="#059669" strokeWidth="2.5" />
            {/* Dome Spire */}
            <path d="M200 70V45m-6 0h12" stroke="#059669" strokeWidth="2" strokeLinecap="round" />
            {/* Colonnade Arches */}
            <path d="M155 250v-40c0-8 6-14 14-14s14 6 14 14v40m34 0v-40c0-8 6-14 14-14s14 6 14 14v40" stroke="#059669" strokeWidth="2" strokeLinejoin="round" />
            <rect x="185" y="125" width="30" height="42" rx="15" fill="#CCFBF1" stroke="#059669" strokeWidth="1.5" />
            {/* Campus Tree Foliage */}
            <circle cx="105" cy="180" r="26" fill="#10B981" fillOpacity="0.22" />
            <circle cx="295" cy="180" r="26" fill="#10B981" fillOpacity="0.22" />
            <circle cx="75" cy="200" r="32" fill="#059669" fillOpacity="0.18" />
            <circle cx="325" cy="200" r="32" fill="#059669" fillOpacity="0.18" />
          </g>
        ) : type === "comprehensive" ? (
          // Comprehensive High School: Modern library, glass curve, arch gate
          <g opacity="0.85" className="sv-poster-art">
            {/* Library Silhouette */}
            <path d="M60 250V110c0-10 8-18 18-18h164c10 0 18 8 18 18v140H60Z" fill="#FFFFFF" fillOpacity="0.8" />
            <path d="M60 110c0-10 8-18 18-18h164c10 0 18 8 18 18" stroke="#4F46E5" strokeWidth="2" />
            {/* Curved Glass Ribs */}
            <path d="M80 120c40-10 80-10 120 0m-120 28c40-10 80-10 120 0m-120 28c40-10 80-10 120 0m-120 28c40-10 80-10 120 0" stroke="#818CF8" strokeWidth="1.5" strokeOpacity="0.5" />
            {/* Grand Monumental Arch Entrance */}
            <path d="M230 250V140c0-25 20-45 45-45s45 20 45 45v110" stroke="#4338CA" strokeWidth="3" fill="#FFFFFF" fillOpacity="0.5" />
            <path d="M250 250v-85c0-14 11-25 25-25s25 11 25 25v85" stroke="#6366F1" strokeWidth="2" strokeDasharray="3 3" />
            {/* Constellation Star Spark */}
            <path d="M335 65l4 12 12 4-12 4-4 12-4-12-12-4 12-4 4-12Z" fill="#818CF8" fillOpacity="0.75" />
            <path d="M110 55l2.5 7.5 7.5 2.5-7.5 2.5-2.5 7.5-2.5-7.5-7.5-2.5 7.5-2.5 2.5-7.5Z" fill="#C084FC" fillOpacity="0.65" />
          </g>
        ) : (
          // General High School: Classic Clocktower, Gable Hall, Arched Colonnade & Campus Trees
          <g opacity="0.85" className="sv-poster-art">
            {/* Main Academy Building */}
            <path d="M80 250V150h240v100H80Z" fill="#FFFFFF" fillOpacity="0.82" />
            {/* Classic Clocktower */}
            <path d="M165 150V75l35-25 35 25v75H165Z" fill="#FFFFFF" fillOpacity="0.9" />
            <path d="M165 75l35-25 35 25" stroke="#2563EB" strokeWidth="2.5" strokeLinejoin="round" />
            {/* Bell Tower Clock */}
            <circle cx="200" cy="105" r="15" fill="#EFF6FF" stroke="#2563EB" strokeWidth="1.8" />
            <path d="M200 96v9l6 4" stroke="#1D4ED8" strokeWidth="1.5" strokeLinecap="round" />
            {/* Windows in side wings */}
            <rect x="100" y="170" width="16" height="24" rx="8" fill="#DBEAFE" stroke="#2563EB" strokeWidth="1.2" />
            <rect x="130" y="170" width="16" height="24" rx="8" fill="#DBEAFE" stroke="#2563EB" strokeWidth="1.2" />
            <rect x="254" y="170" width="16" height="24" rx="8" fill="#DBEAFE" stroke="#2563EB" strokeWidth="1.2" />
            <rect x="284" y="170" width="16" height="24" rx="8" fill="#DBEAFE" stroke="#2563EB" strokeWidth="1.2" />
            {/* Main Entrance Arch */}
            <path d="M184 250v-40c0-9 7-16 16-16s16 7 16 16v40" fill="#DBEAFE" stroke="#1D4ED8" strokeWidth="2" />
            {/* Campus Tree Foliage */}
            <circle cx="55" cy="190" r="28" fill="#93C5FD" fillOpacity="0.3" />
            <circle cx="345" cy="190" r="28" fill="#93C5FD" fillOpacity="0.3" />
            <circle cx="35" cy="215" r="32" fill="#60A5FA" fillOpacity="0.2" />
            <circle cx="365" cy="215" r="32" fill="#60A5FA" fillOpacity="0.2" />
          </g>
        )}

        {/* Foreground Ground Plane Accent */}
        <line x1="0" y1="249" x2="400" y2="249" stroke="#0F172A" strokeOpacity="0.08" strokeWidth="2" />
      </svg>

      {/* Floating Frosted Glass Region Badge (Top Left) */}
      <div className="sv-poster-badge" aria-hidden="true">
        <span className="sv-poster-badge-dot" />
        <span className="sv-poster-badge-text">{region}</span>
      </div>

      {/* Academic Track Watermark (Bottom Left) */}
      <div className="sv-poster-track" aria-hidden="true">
        <span className="sv-poster-track-label">{typeLabel}</span>
      </div>
    </div>
  );
}
