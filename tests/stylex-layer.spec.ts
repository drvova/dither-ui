// The kit's StyleX layer (dither-kit/stylex/) is generated from its Tailwind
// layer by src/shared/lib/stylex-layer.ts. This spec writes it (`npx rs test
// -u tests/stylex-layer.spec.ts`) and fails while a committed file differs
// from what the Tailwind files give, so the two layers never drift.
import { readdirSync, readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { describe, expect, it } from "rstack/test"
import { HAND_WRITTEN, stylexLayer, type StylexLayer } from "../src/shared/lib/stylex-layer"
import { buildUtilityMap } from "../src/shared/lib/utility-map"

// `rs fmt` is rstack's Prettier with the house options (rstack.config.ts):
// the generated files come out of the same formatter.
const require = createRequire(import.meta.url)
const prettier = createRequire(require.resolve("rstack/package.json"))("prettier") as {
  format(text: string, options: Record<string, unknown>): Promise<string>
}
const FORMAT = { semi: false, printWidth: 120 }

const TAILWIND = "dither-kit/tailwind"
const STYLEX = "dither-kit/stylex"

// Class names the components style themselves (their scoped <style>), kept
// as class names in the StyleX layer.
const HOOKS = new Set([
  "bl",
  "br",
  "corner",
  "dither-animated-content",
  "dither-ascii",
  "dither-blur-part",
  "dither-caret",
  "dither-cell",
  "dither-circular-svg",
  "dither-circular-text",
  "dither-container",
  "dither-curve-text",
  "dither-fade-content",
  "dither-fall-char",
  "dither-float-char",
  "dither-focus-word",
  "dither-fuzzy",
  "dither-glare",
  "dither-glitch",
  "dither-gradient-text",
  "dither-layer",
  "dither-logoloop",
  "dither-magnet-inner",
  "dither-orbit",
  "dither-orbit-label",
  "dither-peel",
  "dither-pixeltrans",
  "dither-pressure-char",
  "dither-proximity-char",
  "dither-reveal-word",
  "dither-ring",
  "dither-rotating",
  "dither-sequence",
  "dither-shiny-text",
  "dither-shuffle-char",
  "dither-split-char",
  "dither-stage",
  "dither-star-border",
  "dither-sticker",
  "dither-target",
  "dither-veil",
  "dk-arrow",
  "dk-arrow-head",
  "dk-arrow-trail",
  "dk-check-card",
  "dk-cmm-panel",
  "dk-file-drop",
  "dk-scroll",
  "dk-thumb",
  "dk-thumb-img",
  "dk-tooltip-card",
  "dk-wc-digit",
  "glare",
  "star-bottom",
  "star-strip",
  "star-top",
  "tl",
  "tr",
])

let layer: StylexLayer | null = null
async function generate(): Promise<StylexLayer> {
  if (layer) return layer
  const map = await buildUtilityMap(process.cwd(), [TAILWIND])
  const files = new Map(readdirSync(TAILWIND).map((n) => [n, readFileSync(`${TAILWIND}/${n}`, "utf8")] as const))
  return (layer = stylexLayer(files, map))
}

describe("the StyleX layer", () => {
  it("is what the Tailwind layer generates", async () => {
    const { files } = await generate()
    for (const [name, text] of files)
      await expect(await prettier.format(text, { ...FORMAT, filepath: name })).toMatchFileSnapshot(
        `../${STYLEX}/${name}`,
      )
    const stale = readdirSync(STYLEX).filter((n) => !files.has(n) && !HAND_WRITTEN.has(n))
    expect(stale).toEqual([])
  }, 120_000)

  it("keeps no Tailwind class: only the components' own hooks stay class names", async () => {
    const { kept } = await generate()
    const left = [...kept].flatMap(([file, names]) => names.filter((n) => !HOOKS.has(n)).map((n) => `${file}: ${n}`))
    expect(left).toEqual([])
  }, 120_000)

  it("drops no utility: every class in a literal adds a declaration", async () => {
    const { inert } = await generate()
    expect([...inert].map(([file, names]) => `${file}: ${names.join(" ")}`)).toEqual([])
  }, 120_000)
})
