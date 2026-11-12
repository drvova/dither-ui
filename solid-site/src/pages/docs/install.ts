// The kit's install steps for the frameworks this site shows: the Solid
// kit's own, and the Svelte kit's as the Vue site's docs write them
// (`@/pages/docs/install`, whose step shape and script form these keep). The
// source panel's prompt.md takes each as one commented script.
import { INSTALL as SITE_INSTALL, INSTALL_DEPS, type InstallStep, installScript } from "@/pages/docs/install"
import type { DocsFramework } from "./svelte"

/** The Solid kit's steps: the kit's folder, the packages it needs beside
 * Solid (the Tailwind layer's, whose `cn` it shares), its layer aliased. */
export const SOLID_STEPS: readonly InstallStep[] = [
  {
    title: "Copy the kit folder straight from the repo",
    why: "degit grabs just the folder",
    code: "npx degit drvova/dither-ui/dither-kit src/dither-kit",
  },
  {
    title: "Install the runtime deps",
    why: "you already have Solid, and Tailwind if you use it",
    code: `npm i ${INSTALL_DEPS.vue.join(" ")}`,
  },
  {
    title: "Alias @dither-kit so imports stay clean",
    code: `// vite.config.ts
resolve: { alias: { "@dither-kit": "/src/dither-kit/solid" } }

// tsconfig.json, under compilerOptions
"paths": { "@dither-kit": ["./src/dither-kit/solid"] }`,
  },
  { title: "Use it", code: `import { AreaChart, Area, DitherButton } from "@dither-kit"` },
]

export const INSTALL: Record<DocsFramework, string> = {
  solid: installScript(SOLID_STEPS),
  svelte: SITE_INSTALL.svelte,
}
