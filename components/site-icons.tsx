export type SiteIconName =
  | "account"
  | "calendar"
  | "calculator"
  | "chevron-down"
  | "chevron-right"
  | "close"
  | "home"
  | "knowledge"
  | "menu"
  | "more"
  | "planner"
  | "search"
  | "school"
  | "shield"
  | "sparkle"
  | "bell";

type SiteIconProps = {
  name: SiteIconName;
  size?: number;
  className?: string;
};

const commonProps = {
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  strokeWidth: 1.8,
};

export function SiteIcon({ name, size = 20, className }: SiteIconProps) {
  const props = { ...commonProps, width: size, height: size, className, "aria-hidden": true, viewBox: "0 0 24 24" };

  switch (name) {
    case "account":
      return <svg {...props}><circle cx="12" cy="8" r="3.2" /><path d="M5.5 19c.9-3 3.1-4.5 6.5-4.5s5.6 1.5 6.5 4.5" /></svg>;
    case "bell":
      return <svg {...props}><path d="M6.5 10.5a5.5 5.5 0 0 1 11 0c0 4 1.8 4.4 2 5.5H4.5c.2-1.1 2-1.5 2-5.5Z" /><path d="M10 19h4" /></svg>;
    case "calendar":
      return <svg {...props}><rect x="4" y="5.5" width="16" height="14" rx="2" /><path d="M8 3.5v4M16 3.5v4M4 10h16" /><path d="M8 13h.01M12 13h.01M16 13h.01M8 16.5h.01M12 16.5h.01" /></svg>;
    case "calculator":
      return <svg {...props}><rect x="5" y="3.5" width="14" height="17" rx="2" /><path d="M8 7h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 18h.01M12 18h.01M16 18h.01" /></svg>;
    case "chevron-down":
      return <svg {...props}><path d="m6 9 6 6 6-6" /></svg>;
    case "chevron-right":
      return <svg {...props}><path d="m9 6 6 6-6 6" /></svg>;
    case "close":
      return <svg {...props}><path d="m6 6 12 12M18 6 6 18" /></svg>;
    case "home":
      return <svg {...props}><path d="m4 10 8-6 8 6v9.5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V10Z" /><path d="M9.5 20.5v-6h5v6" /></svg>;
    case "knowledge":
      return <svg {...props}><path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v16H7.5A2.5 2.5 0 0 0 5 21V5.5Z" /><path d="M5 5.5V21M8.5 7h7M8.5 10h7" /></svg>;
    case "menu":
      return <svg {...props}><path d="M4 7h16M4 12h16M4 17h16" /></svg>;
    case "more":
      return <svg {...props}><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" /></svg>;
    case "planner":
      return <svg {...props}><path d="M6 4.5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-11a2 2 0 0 1 2-2Z" /><path d="M8 3v3M16 3v3M8 11h8M8 15h5" /></svg>;
    case "search":
      return <svg {...props}><circle cx="10.8" cy="10.8" r="6.3" /><path d="m16 16 4.5 4.5" /></svg>;
    case "school":
      return <svg {...props}><path d="m3 10 9-5 9 5-9 5-9-5Z" /><path d="M6 12.2v5.3c2.9 2 9.1 2 12 0v-5.3M21 10v6" /></svg>;
    case "shield":
      return <svg {...props}><path d="M12 3.5 19 6v5.4c0 4.4-2.7 7.5-7 9.1-4.3-1.6-7-4.7-7-9.1V6l7-2.5Z" /><path d="m9 12 2 2 4-4" /></svg>;
    case "sparkle":
      return <svg {...props}><path d="m12 3 1.3 5.7L19 10l-5.7 1.3L12 17l-1.3-5.7L5 10l5.7-1.3L12 3ZM19 16l.6 2.4L22 19l-2.4.6L19 22l-.6-2.4L16 19l2.4-.6L19 16Z" /></svg>;
    default:
      return null;
  }
}
