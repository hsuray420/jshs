export type FeatureThemeName = "schools" | "analytics" | "tools" | "mock-exam" | "planner" | "schedule" | "official" | "guide" | "trust" | "other";

export const featureThemes: Record<FeatureThemeName, Readonly<{
  primary: string; primaryHover: string; surface: string; surfaceStrong: string; border: string; text: string; icon: string; illustrationAccent: string;
}>> = {
  schools: { primary: "#2563eb", primaryHover: "#1d4ed8", surface: "#eff6ff", surfaceStrong: "#dbeafe", border: "#bfdbfe", text: "#1e3a8a", icon: "#2563eb", illustrationAccent: "#60a5fa" },
  analytics: { primary: "#047857", primaryHover: "#065f46", surface: "#ecfdf5", surfaceStrong: "#d1fae5", border: "#a7f3d0", text: "#064e3b", icon: "#047857", illustrationAccent: "#34d399" },
  tools: { primary: "#047857", primaryHover: "#065f46", surface: "#ecfdf5", surfaceStrong: "#d1fae5", border: "#a7f3d0", text: "#064e3b", icon: "#047857", illustrationAccent: "#34d399" },
  "mock-exam": { primary: "#7c3aed", primaryHover: "#6d28d9", surface: "#f5f3ff", surfaceStrong: "#ede9fe", border: "#ddd6fe", text: "#4c1d95", icon: "#7c3aed", illustrationAccent: "#a78bfa" },
  planner: { primary: "#e11d48", primaryHover: "#be123c", surface: "#fff1f2", surfaceStrong: "#ffe4e6", border: "#fecdd3", text: "#881337", icon: "#e11d48", illustrationAccent: "#fb7185" },
  schedule: { primary: "#d97706", primaryHover: "#b45309", surface: "#fffbeb", surfaceStrong: "#fef3c7", border: "#fde68a", text: "#78350f", icon: "#d97706", illustrationAccent: "#f59e0b" },
  official: { primary: "#2563eb", primaryHover: "#1d4ed8", surface: "#eff6ff", surfaceStrong: "#dbeafe", border: "#bfdbfe", text: "#1e3a8a", icon: "#2563eb", illustrationAccent: "#60a5fa" },
  guide: { primary: "#0f766e", primaryHover: "#115e59", surface: "#f0fdfa", surfaceStrong: "#ccfbf1", border: "#99f6e4", text: "#134e4a", icon: "#0f766e", illustrationAccent: "#2dd4bf" },
  trust: { primary: "#475569", primaryHover: "#334155", surface: "#f8fafc", surfaceStrong: "#f1f5f9", border: "#cbd5e1", text: "#334155", icon: "#475569", illustrationAccent: "#94a3b8" },
  other: { primary: "#526275", primaryHover: "#39495d", surface: "#f2f5f8", surfaceStrong: "#e1e8ef", border: "#ccd6e0", text: "#344254", icon: "#526275", illustrationAccent: "#8da0b4" },
};
