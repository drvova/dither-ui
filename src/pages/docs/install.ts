// The kit's install steps per framework — the docs' Quick start, the source
// panel's prompt.md and (kept in sync by hand, it never imports the docs) the
// landing's InstallBlock.
export const INSTALL = {
  vue: `# 1. Copy the kit folder straight from the repo (degit grabs just the folder)
npx degit drvova/dither-ui/dither-kit src/dither-kit

# 2. Install the four runtime deps (you already have Vue, and Tailwind if you use it)
npm i d3-scale d3-shape clsx tailwind-merge

# 3. Alias @dither-kit so imports stay clean
#    vite.config.ts  resolve.alias: { "@dither-kit": "/src/dither-kit" }
#    tsconfig.json   paths:         { "@dither-kit": ["./src/dither-kit"] }

# 4. Use it
import { AreaChart, Area, DitherButton } from "@dither-kit"`,
  svelte: `# 1. Copy the kit folder straight from the repo (degit grabs just the folder)
npx degit drvova/dither-ui/dither-kit-svelte src/dither-kit-svelte

# 2. Install the four runtime deps (you already have Svelte 5, and Tailwind if you use it)
npm i d3-scale d3-shape clsx tailwind-merge

# 3. Alias @dither-kit-svelte so imports stay clean
#    vite.config.ts  resolve.alias: { "@dither-kit-svelte": "/src/dither-kit-svelte" }
#    tsconfig.json   paths:         { "@dither-kit-svelte": ["./src/dither-kit-svelte"] }

# 4. Use it
import { AreaChart, Area, DitherButton } from "@dither-kit-svelte"`,
}
