// The kit's install steps per framework, and the Vue kit's StyleX layer: the
// docs' Quick start, the source panel's prompt.md and (kept in sync by hand,
// it never imports the docs) the landing's InstallBlock.
export const INSTALL = {
  vue: `# 1. Copy the kit folder straight from the repo (degit grabs just the folder)
npx degit drvova/dither-ui/dither-kit src/dither-kit

# 2. Install the four runtime deps (you already have Vue, and Tailwind if you use it)
npm i d3-scale d3-shape clsx tailwind-merge

# 3. Alias @dither-kit so imports stay clean
#    vite.config.ts  resolve.alias: { "@dither-kit": "/src/dither-kit/tailwind" }
#    tsconfig.json   paths:         { "@dither-kit": ["./src/dither-kit/tailwind"] }

# 4. Use it
import { AreaChart, Area, DitherButton } from "@dither-kit"`,
  stylex: `# 1. Copy the kit folder straight from the repo (degit grabs just the folder)
npx degit drvova/dither-ui/dither-kit src/dither-kit

# 2. Install the runtime deps (you already have Vue and your bundler's StyleX plugin)
npm i d3-scale d3-shape @stylexjs/stylex

# 3. Alias @dither-kit to the kit's StyleX layer so imports stay clean
#    vite.config.ts  resolve.alias: { "@dither-kit": "/src/dither-kit/stylex" }
#    tsconfig.json   paths:         { "@dither-kit": ["./src/dither-kit/stylex"] }

# 4. Load the tokens and the base once (the base applies inside .dither-kit)
import "./dither-kit/engine/theme.css"
import "./dither-kit/engine/base.css"

# 5. Use it: your own StyleX styles go in as xstyle
import { AreaChart, Area, DitherButton } from "@dither-kit"
<DitherButton :xstyle="styles.cta">Ship</DitherButton>`,
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
