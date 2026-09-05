import type { Plugin, PluginOption } from "vite";

/** Avoid quadratic comment scanning of generated ESM data in vinext's CJS plugin. */
export function guardGeneratedEsm(plugin: PluginOption): PluginOption {
  if (!plugin || typeof plugin !== "object" || !("name" in plugin)) return plugin;
  const candidate = plugin as Plugin;
  if (candidate.name !== "vite-plugin-commonjs" || !candidate.transform) return plugin;

  const original = candidate.transform;
  const handler = typeof original === "function" ? original : original.handler;
  if (!handler) return plugin;
  const transform: NonNullable<typeof handler> = function (this: ThisParameterType<NonNullable<typeof handler>>, code, id, ...options) {
    const path = id.split("?")[0].replaceAll("\\", "/");
    // Vite's JSON transform and our source snapshot generator both emit ESM.
    // Their embedded URLs/source text can trigger pathological comment regexes.
    if (path.endsWith(".json") || path.endsWith("/lib/source-code.ts")) return null;
    return handler.call(this, code, id, ...options);
  };
  return { ...candidate, transform: typeof original === "function"
    ? transform : { ...original, handler: transform } };
}
