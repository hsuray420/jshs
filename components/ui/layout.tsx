import type { ElementType, ComponentPropsWithoutRef, ReactNode } from "react";

type ContainerSize = "content" | "wide" | "narrow";

const containerClasses: Record<ContainerSize, string> = {
  content: "jshs-container",
  wide: "jshs-container jshs-container-wide",
  narrow: "jshs-container jshs-container-narrow",
};

export function PageContainer<T extends ElementType = "div">({
  as,
  size = "content",
  className = "",
  children,
  ...props
}: { as?: T; size?: ContainerSize; children: ReactNode; className?: string } & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className">) {
  const Component = (as || "div") as ElementType;
  return <Component className={`${containerClasses[size]} ${className}`.trim()} {...props}>{children}</Component>;
}

export function PageSection({ children, className = "", tone = "default", ...props }: { children: ReactNode; className?: string; tone?: "default" | "subtle" } & ComponentPropsWithoutRef<"section">) {
  return <section className={`jshs-section ${tone === "subtle" ? "jshs-section-subtle" : ""} ${className}`.trim()} {...props}>{children}</section>;
}

export function ResponsiveGrid({ children, className = "", ...props }: { children: ReactNode; className?: string } & ComponentPropsWithoutRef<"div">) {
  return <div className={`jshs-responsive-grid ${className}`.trim()} {...props}>{children}</div>;
}
