export type FeatureThemeName = "schools" | "tools" | "planner" | "schedule" | "official" | "guide" | "trust" | "other";

export const featureThemes: Record<FeatureThemeName, Readonly<{
  primary: string; primaryHover: string; surface: string; surfaceStrong: string; border: string; text: string; icon: string; illustrationAccent: string;
}>> = {
  schools: { primary: "#1976d2", primaryHover: "#135ca5", surface: "#edf6ff", surfaceStrong: "#d8ebff", border: "#b9dcff", text: "#0d4778", icon: "#1976d2", illustrationAccent: "#54a5ea" },
  tools: { primary: "#248a49", primaryHover: "#176d36", surface: "#edf9f0", surfaceStrong: "#d9f0df", border: "#b8dfc3", text: "#175a30", icon: "#248a49", illustrationAccent: "#69b77e" },
  planner: { primary: "#b76e00", primaryHover: "#8c5300", surface: "#fff7df", surfaceStrong: "#ffedbd", border: "#f4d58d", text: "#744400", icon: "#b76e00", illustrationAccent: "#e8a32c" },
  schedule: { primary: "#7651c8", primaryHover: "#5a36a5", surface: "#f4efff", surfaceStrong: "#e8ddff", border: "#d5c3fb", text: "#51328f", icon: "#7651c8", illustrationAccent: "#a88bec" },
  official: { primary: "#1976d2", primaryHover: "#135ca5", surface: "#edf6ff", surfaceStrong: "#d8ebff", border: "#b9dcff", text: "#0d4778", icon: "#1976d2", illustrationAccent: "#54a5ea" },
  guide: { primary: "#7651c8", primaryHover: "#5a36a5", surface: "#f4efff", surfaceStrong: "#e8ddff", border: "#d5c3fb", text: "#51328f", icon: "#7651c8", illustrationAccent: "#a88bec" },
  trust: { primary: "#526275", primaryHover: "#39495d", surface: "#f2f5f8", surfaceStrong: "#e1e8ef", border: "#ccd6e0", text: "#344254", icon: "#526275", illustrationAccent: "#8da0b4" },
  other: { primary: "#526275", primaryHover: "#39495d", surface: "#f2f5f8", surfaceStrong: "#e1e8ef", border: "#ccd6e0", text: "#344254", icon: "#526275", illustrationAccent: "#8da0b4" },
};
