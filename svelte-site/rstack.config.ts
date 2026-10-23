// The Svelte showcase on the Rstack CLI (`rs dev`, `rs build`, `rs preview`):
// Rsbuild with the Svelte and Tailwind plugins.
// Guide: https://rstack.rs/guide/configuration
import { resolve } from "node:path"
import { define } from "rstack"

const root = import.meta.dirname

define.app(async () => {
  const [{ pluginSvelte }, { pluginTailwindcss }] = await Promise.all([
    import("@rsbuild/plugin-svelte"),
    import("@rsbuild/plugin-tailwindcss"),
  ])
  return {
    plugins: [pluginSvelte(), pluginTailwindcss()],
    source: { entry: { index: "./src/main.ts" } },
    html: { template: "./index.html" },
    resolve: {
      alias: {
        "@": resolve(root, "src"),
        "@dither-kit-svelte": resolve(root, "../dither-kit-svelte/index.ts"),
      },
    },
    server: { base: process.env.BASE_PATH ?? "/" },
    // The kit folder carries its own node_modules (for svelte-check): this
    // app's packages resolve first, so the build holds ONE Svelte runtime.
    tools: { rspack: { resolve: { modules: [resolve(root, "node_modules"), "node_modules"] } } },
  }
})
