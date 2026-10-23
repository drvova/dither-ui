// Node-side only (tests/films.spec.ts writes public/films/*.json from these
// builders). The app never imports this folder: the Clayzo authoring
// package is licensed for authoring, not for redistribution, so only the
// documents it writes and the playback runtime ship to the browser.
//
// The kit's ordered-dither rule as a Clayzo `custom-sksl` effect. Clayzo
// moves vector shapes (2.5D, springs, morphs); this pass renders whatever it
// draws through the same rule `ditherTone` paints the plates with — the
// 4x4 Bayer thresholds and the house ramps — so a film is pixel art in the
// kit's own palette, on a screen-aligned lattice like real pixel art.
//
// Authoring contract: a film draws TONES, not colours. A grey of value t
// lands on the cool ramp (SKY) at tone t; a warm colour rgb(1, t, 0) lands on
// the hot ramp (SUN) at tone t; below the ramp's first level is clear, so the
// stage behind the canvas shows through. Each lattice cell samples its own
// centre, so edges are cell-crisp at any rotation.
//
// The loupe: every coarse cell whose centre lies within `radius` of `focus`
// renders on a lattice twice as fine, seamless and a touch brighter — under
// the cursor the art reads at double resolution, the kit's `cell` prop as a
// material. `radius` rests at
// 0 (no loupe); `pixelFilm`'s `loupe` springs it open under the pointer.
import { constant, hex, type Color, type EffectNode, type SceneNode } from "@clayzo/animation/authoring"
import { resolveMatrix } from "@dither-kit"
import { SKY, SUN } from "../plates"

/** A cool tone: grey t lands on the SKY ramp at tone t. */
export const tone = (t: number): Color => ({ r: t, g: t, b: t, a: 1 })
/** A hot tone: rgb(1, t, 0) lands on the SUN ramp at tone t. */
export const heat = (t: number): Color => ({ r: 1, g: t, b: 0, a: 1 })

/** The kit's 4x4 thresholds in row-major order — the gradient matrix the
 * plates and every dithered kit surface threshold against. */
export const THRESHOLDS = resolveMatrix("gradient").flat()

const f = (v: number) => (Number.isInteger(v) ? `${v}.0` : String(v))

/** `value(i)` as a chain of ternaries on a float index — SkSL has no array
 * initialisers, so the matrix and the ramps are unrolled from kit data. */
const lookup = (index: string, values: readonly string[]) =>
  values
    .slice(0, -1)
    .reduceRight((rest, v, i) => `(${index} < ${f(i + 0.5)} ? ${v} : ${rest})`, values[values.length - 1])

/** The shader: uniforms `cell` and `gap` (composition units), the loupe's
 * `focus` (device pixels, as the engine converts points) and `radius`
 * (composition units), then one colour per ramp level, then the engine's
 * appended `renderScale`. */
export function kitDitherSksl(cool: readonly string[] = SKY, hot: readonly string[] = SUN): string {
  const k = cool.map((_, i) => `k${i}`)
  const h = hot.map((_, i) => `h${i}`)
  return [
    "uniform shader inputImage;",
    "uniform float cell;",
    "uniform float gap;",
    "uniform float2 focus;",
    "uniform float radius;",
    ...k.map((n) => `uniform half4 ${n};`),
    ...h.map((n) => `uniform half4 ${n};`),
    "uniform float2 renderScale;",
    "float threshold(float2 q) {",
    "  float k = mod(q.y, 4.0) * 4.0 + mod(q.x, 4.0);",
    `  return ${lookup("k", THRESHOLDS.map(f))};`,
    "}",
    "half4 main(float2 p) {",
    "  float s = cell * renderScale.x;",
    "  float2 q = floor(p / s);",
    "  float r = radius * renderScale.x;",
    "  bool lens = r > 0.0 && length((q + 0.5) * s - focus) < r;",
    "  if (lens) { s = s * 0.5; q = floor(p / s); }",
    "  float2 o = p - q * s;",
    // A seam is at least one device pixel: thinner, it lands on some
    // cells and not others and the lattice shimmers at small scales. The
    // lens has none — its cells run together, finer and a touch brighter.
    "  float g = gap > 0.0 && !lens ? max(gap * renderScale.x, 1.0) : 0.0;",
    "  if (o.x < g || o.y < g) { return half4(0.0); }",
    "  half4 src = unpremul(inputImage.eval((q + 0.5) * s));",
    "  if (src.a < 0.5) { return half4(0.0); }",
    "  bool warm = src.r - src.b > 0.25;",
    "  float t = clamp((warm ? src.g : max(src.r, max(src.g, src.b))) + (lens ? 0.08 : 0.0), 0.0, 1.0);",
    `  float n = warm ? ${f(hot.length)} : ${f(cool.length)};`,
    "  float v = t * n;",
    "  float b = floor(v);",
    "  float i = min(n, b + ((v - b) > threshold(q) ? 1.0 : 0.0));",
    "  if (i < 0.5) { return half4(0.0); }",
    `  half4 c = warm ? ${lookup("i - 1.0", h)} : ${lookup("i - 1.0", k)};`,
    "  return half4(c.rgb * src.a, src.a);",
    "}",
  ].join("\n")
}

const number = (
  id: string,
  name: string,
  value: number,
  minimum: number,
  maximum: number,
): EffectNode["parameters"][number] => ({
  id,
  name,
  valueType: "number",
  value: constant(value),
  minimum,
  maximum,
})

/** The effect node: renders `inputId` (which must stay out of
 * `rootNodeIds`) through the kit rule on a lattice of `cell` units with a
 * `gap`-unit seam between cells. */
export function kitDither(
  id: string,
  inputId: string,
  outTick: number,
  options: { cell: number; gap?: number; cool?: readonly string[]; hot?: readonly string[] },
): SceneNode {
  const cool = options.cool ?? SKY
  const hot = options.hot ?? SUN
  return {
    id,
    name: id,
    visible: true,
    inTick: 0,
    outTick,
    opacity: constant(1),
    blendMode: "normal",
    transform: {
      position: constant({ x: 0, y: 0, z: 0 }),
      anchor: constant({ x: 0, y: 0, z: 0 }),
      scale: constant({ x: 1, y: 1, z: 1 }),
      rotation: constant({ x: 0, y: 0, z: 0 }),
      skew: constant({ x: 0, y: 0 }),
    },
    type: "effect",
    effect: "custom-sksl",
    implementation: kitDitherSksl(cool, hot),
    inputId,
    parameters: [
      number(`${id}.cell`, "cell", options.cell, 1, 64),
      number(`${id}.gap`, "gap", options.gap ?? 0, 0, 16),
      {
        id: `${id}.focus`,
        name: "focus",
        valueType: "point" as const,
        value: constant({ x: -1e4, y: -1e4 }),
        minimum: { x: -1e4, y: -1e4 },
        maximum: { x: 1e4, y: 1e4 },
      },
      number(`${id}.radius`, "radius", 0, 0, 1000),
      ...cool.map((c, i) => ({
        id: `${id}.k${i}`,
        name: `k${i}`,
        valueType: "color" as const,
        value: constant(hex(c)),
      })),
      ...hot.map((c, i) => ({
        id: `${id}.h${i}`,
        name: `h${i}`,
        valueType: "color" as const,
        value: constant(hex(c)),
      })),
    ],
    capability: { requires: ["runtime-effect"], fallback: "passthrough", maxTemporarySurfaces: 1 },
  }
}
