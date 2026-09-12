import registry from "../content/schools/region-registry.json";

export type RegionStatus = "available" | "unavailable";
export type RegionRegistryEntry = Readonly<{
  id: string;
  name: string;
  schoolDataStatus: RegionStatus;
  calculatorStatus: RegionStatus;
  csvPath?: string;
  schoolYear: number;
  displayOrder: number;
}>;

export const regionRegistry = Object.freeze(
  [...registry.regions].sort((a, b) => a.displayOrder - b.displayOrder),
) as readonly RegionRegistryEntry[];

export function getRegionRegistry(): readonly RegionRegistryEntry[] {
  return regionRegistry;
}

export function getRegionById(id: string): RegionRegistryEntry | undefined {
  return regionRegistry.find((region) => region.id === id);
}

export function getSchoolDataStatus(id: string): RegionStatus {
  return getRegionById(id)?.schoolDataStatus ?? "unavailable";
}

export function getAvailableSchoolDataRegions(): readonly RegionRegistryEntry[] {
  return regionRegistry.filter((region) => region.schoolDataStatus === "available");
}

export function getUnavailableSchoolDataRegions(): readonly RegionRegistryEntry[] {
  return regionRegistry.filter((region) => region.schoolDataStatus === "unavailable");
}

export function assertSchoolDataAvailable(id: string): RegionRegistryEntry {
  const region = getRegionById(id);
  if (!region) throw new Error(`Unknown region: ${id}`);
  if (region.schoolDataStatus !== "available") throw new Error(`School data unavailable: ${id}`);
  return region;
}
