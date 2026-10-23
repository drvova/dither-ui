// The kit's install steps per framework — the docs' Quick start, the source
// panel's prompt.md and (kept in sync by hand, it never imports the docs) the
// landing's InstallBlock.
export const INSTALL = {
  vue: `# 1 — copy the kit folder straight from the repo (degit grabs just the folder)
npx degit drvova/dither-ui/dither-kit src/dither-kit

# 2 — install the four runtime deps (Vue & Tailwind you already have)
npm i d3-scale d3-shape clsx tailwind-merge

# 3 — alias @dither-kit so imports stay clean
#     vite.config.ts → resolve.alias: { "@dither-kit": "/src/dither-kit" }
#     tsconfig.json  → paths:        { "@dither-kit": ["./src/dither-kit"] }

# 4 — use it
import { AreaChart, Area, DitherButton } from "@dither-kit"`,
  svelte: `# 1 — copy the kit folder straight from the repo (degit grabs just the folder)
npx degit drvova/dither-ui/dither-kit-svelte src/dither-kit-svelte

# 2 — install the four runtime deps (Svelte 5 & Tailwind you already have)
npm i d3-scale d3-shape clsx tailwind-merge

# 3 — alias @dither-kit-svelte so imports stay clean
#     vite.config.ts → resolve.alias: { "@dither-kit-svelte": "/src/dither-kit-svelte" }
#     tsconfig.json  → paths:        { "@dither-kit-svelte": ["./src/dither-kit-svelte"] }

# 4 — use it
import { AreaChart, Area, DitherButton } from "@dither-kit-svelte"`,
}
