const DISTRICT_STATUSES = new Set(["ready", "reference"]);

function isHttpsUrl(value) {
  if (typeof value !== "string" || !value) return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function isIsoDate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function validateDistrictMetadata(metadata) {
  const issues = [];

  if (metadata?.schemaVersion !== "1.0") {
    issues.push("schemaVersion must be 1.0");
  }
  if (!isHttpsUrl(metadata?.canonicalOrigin)) {
    issues.push("canonicalOrigin must be an HTTPS URL");
  }
  if (!/^\d{3}$/.test(metadata?.currentAcademicYear ?? "")) {
    issues.push("currentAcademicYear must be a three-digit academic year");
  }
  if (!/^\d{3}$/.test(metadata?.serviceYear ?? metadata?.currentAcademicYear ?? "")) {
    issues.push("serviceYear must be a three-digit academic year");
  }
  if (!isIsoDate(metadata?.updatedAt)) {
    issues.push("updatedAt must use YYYY-MM-DD");
  }
  if (!metadata?.officialDirectory?.name || !isHttpsUrl(metadata?.officialDirectory?.url)) {
    issues.push("officialDirectory must include a name and HTTPS URL");
  }

  const districts = Object.entries(metadata?.districts ?? {});
  if (districts.length === 0) issues.push("at least one district is required");

  for (const [code, district] of districts) {
    const prefix = `districts.${code}`;
    if (!district.label || !district.areas) {
      issues.push(`${prefix} must include label and areas`);
    }
    if (!/^\d{3}$/.test(district.academicYear ?? "")) {
      issues.push(`${prefix}.academicYear must be a three-digit source academic year`);
    }
    if (district.serviceYear !== undefined && district.serviceYear !== metadata.serviceYear) {
      issues.push(`${prefix}.serviceYear must match serviceYear`);
    }
    if (!DISTRICT_STATUSES.has(district.dataStatus)) {
      issues.push(`${prefix}.dataStatus must be ready or reference`);
    }
    if (!isIsoDate(district.updatedAt)) {
      issues.push(`${prefix}.updatedAt must use YYYY-MM-DD`);
    }
    if (!district.sourceName || !isHttpsUrl(district.sourceUrl)) {
      issues.push(`${prefix} must include a traceable HTTPS source`);
    }
    if (![district.schools, district.calculator, district.analysis].every((value) => typeof value === "boolean")) {
      issues.push(`${prefix} feature flags must be boolean`);
    }
    if (district.analysis && !district.calculator) {
      issues.push(`${prefix}.analysis requires calculator`);
    }
    if (district.calculator && !district.schools) {
      issues.push(`${prefix}.calculator requires schools`);
    }
    if (!Array.isArray(district.tasks) || district.tasks.length < 3) {
      issues.push(`${prefix}.tasks must include at least three next steps`);
    }
  }

  return issues;
}

export function validateSitemap(xml, canonicalOrigin) {
  const issues = [];
  const locations = [...String(xml).matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1].trim());

  if (locations.length === 0) return ["sitemap must include at least one URL"];

  const seen = new Set();
  for (const location of locations) {
    let parsed;
    try {
      parsed = new URL(location);
    } catch {
      issues.push(`sitemap URL must be absolute: ${location}`);
      continue;
    }
    if (parsed.protocol !== "https:") {
      issues.push(`sitemap URL must use HTTPS: ${location}`);
    }
    if (parsed.origin !== canonicalOrigin) {
      issues.push(`sitemap URL must use ${canonicalOrigin}: ${location}`);
    }
    if (parsed.hash) {
      issues.push(`sitemap URL must not include a fragment: ${location}`);
    }
    if (seen.has(location)) {
      issues.push(`sitemap URL must be unique: ${location}`);
    }
    seen.add(location);
  }

  return issues;
}

export function findForbiddenPublicMarkers(files) {
  const patterns = [
    { label: "visible or hidden test placeholder", regex: /<[^>]+class=["'][^"']*\btest\b[^"']*["'][^>]*>|>\s*test\s*</i },
    { label: "test data source", regex: /"分數來源備註"\s*:\s*"test"/i },
    { label: "unfinished public content", regex: /內容整理中/ },
  ];
  const issues = [];

  for (const [filename, content] of Object.entries(files)) {
    for (const pattern of patterns) {
      if (pattern.regex.test(content)) issues.push(`${filename}: ${pattern.label}`);
    }
  }

  return issues;
}
