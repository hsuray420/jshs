export type FeatureThemeName = "schools" | "analytics" | "tools" | "mock-exam" | "planner" | "schedule" | "official" | "guide" | "trust" | "other";

export interface FeatureThemeConfig {
  primary: string;
  primaryHover: string;
  surface: string;
  surfaceStrong: string;
  surfaceGradient: string;
  border: string;
  glowBorder: string;
  text: string;
  icon: string;
  illustrationAccent: string;
}

export const featureThemes: Record<FeatureThemeName, Readonly<FeatureThemeConfig>> = {
  schools: { primary: "#2563eb", primaryHover: "#1d4ed8", surface: "#eff6ff", surfaceStrong: "#dbeafe", surfaceGradient: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)", border: "#bfdbfe", glowBorder: "rgba(37, 99, 235, 0.28)", text: "#1e3a8a", icon: "#2563eb", illustrationAccent: "#60a5fa" },
  analytics: { primary: "#047857", primaryHover: "#065f46", surface: "#ecfdf5", surfaceStrong: "#d1fae5", surfaceGradient: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)", border: "#a7f3d0", glowBorder: "rgba(5, 150, 105, 0.28)", text: "#064e3b", icon: "#047857", illustrationAccent: "#34d399" },
  tools: { primary: "#047857", primaryHover: "#065f46", surface: "#ecfdf5", surfaceStrong: "#d1fae5", surfaceGradient: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)", border: "#a7f3d0", glowBorder: "rgba(5, 150, 105, 0.28)", text: "#064e3b", icon: "#047857", illustrationAccent: "#34d399" },
  "mock-exam": { primary: "#7c3aed", primaryHover: "#6d28d9", surface: "#f5f3ff", surfaceStrong: "#ede9fe", surfaceGradient: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)", border: "#ddd6fe", glowBorder: "rgba(124, 58, 237, 0.28)", text: "#4c1d95", icon: "#7c3aed", illustrationAccent: "#a78bfa" },
  planner: { primary: "#e11d48", primaryHover: "#be123c", surface: "#fff7ed", surfaceStrong: "#ffedd5", surfaceGradient: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)", border: "#fed7aa", glowBorder: "rgba(234, 88, 12, 0.28)", text: "#881337", icon: "#ea580c", illustrationAccent: "#fb7185" },
  schedule: { primary: "#d97706", primaryHover: "#b45309", surface: "#fffbeb", surfaceStrong: "#fef3c7", surfaceGradient: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)", border: "#fde68a", glowBorder: "rgba(217, 119, 6, 0.28)", text: "#78350f", icon: "#d97706", illustrationAccent: "#f59e0b" },
  official: { primary: "#2563eb", primaryHover: "#1d4ed8", surface: "#eff6ff", surfaceStrong: "#e0e7ff", surfaceGradient: "linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%)", border: "#bfdbfe", glowBorder: "rgba(29, 78, 216, 0.28)", text: "#1e3a8a", icon: "#2563eb", illustrationAccent: "#60a5fa" },
  guide: { primary: "#0f766e", primaryHover: "#115e59", surface: "#f0fdfa", surfaceStrong: "#ccfbf1", surfaceGradient: "linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)", border: "#99f6e4", glowBorder: "rgba(13, 148, 136, 0.28)", text: "#134e4a", icon: "#0f766e", illustrationAccent: "#2dd4bf" },
  trust: { primary: "#475569", primaryHover: "#334155", surface: "#f8fafc", surfaceStrong: "#f1f5f9", surfaceGradient: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)", border: "#cbd5e1", glowBorder: "rgba(51, 65, 85, 0.25)", text: "#334155", icon: "#475569", illustrationAccent: "#94a3b8" },
  other: { primary: "#526275", primaryHover: "#39495d", surface: "#f2f5f8", surfaceStrong: "#e1e8ef", surfaceGradient: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)", border: "#ccd6e0", glowBorder: "rgba(71, 85, 105, 0.25)", text: "#344254", icon: "#526275", illustrationAccent: "#8da0b4" },
};
