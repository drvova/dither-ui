// What other packages call: the share cards' drawing code and the pages'
// baked frames (the site's post-build runs both), the Chromium every task
// drives (the site's browser specs too) and the README's banner. The kit's
// standalone stylesheet is its own entry, `@dither-ui/tasks/kit-css`, which
// the site's build config loads alone. The two recorders beside them (`render-frames.mjs`,
// `agent-demo.mjs`) are run by hand, through the workspace root's
// `npm run frames` and `npm run demo:agent`.
export * from "./cards.ts"
export { bakeFrames } from "./bake-frames.ts"
export { chromiumCandidates, chromiumPath, findChromium } from "./chromium.ts"
export { brandSvg } from "./readme-art.ts"
export type { BrandArt } from "./readme-art.ts"
