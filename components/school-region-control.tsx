"use client";

import Link from "next/link";
import { getAvailableSchoolDataRegions } from "@/lib/region-registry";
import { writeStoredDistrict } from "@/lib/district-context";

const regions = getAvailableSchoolDataRegions();

export function SchoolRegionControl({ value, onChange }: { value: string; onChange: (region: string) => void }) {
  const changeRegion = (region: string) => {
    writeStoredDistrict(region);
    onChange(region);
  };

  return <div className="sd-context" aria-label="學校模組導覽與就學區">
    <nav className="sd-module-nav" aria-label="找學校功能">
      <Link href="/schools">全國校科查詢</Link>
      <Link href="/schools/map">學校地圖</Link>
    </nav>
    <label>目前就學區
      <select value={value} onChange={(event) => changeRegion(event.target.value)}>
        {regions.map((region) => <option key={region.id} value={region.id}>{region.name}</option>)}
      </select>
    </label>
  </div>;
}
