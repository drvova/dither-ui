// Node-side only — see kit-dither.ts. What every landing film shares: the
// time base (240 ticks a second, played at 30 fps, every key snapped to a
// frame), the house eases, cell-geometry helpers, and the one way a film
// becomes a document — its scene drawn in tones, rendered through the kit
// dither pass, stamped, validated.
import {
  ANIMATION_DOCUMENT_VERSION,
  assertValidAnimationDocument,
  base,
  keyed,
  pointerFieldMacro,
  withComputedRevision,
  withInteraction,
  type Animatable,
  type AnimationDocument,
  type Color,
  type CubicBezier,
  type InteractionContribution,
  type Key,
  type Marker,
  type PathContour,
  type SceneNode,
  type Vec3,
} from "@clayzo/animation/authoring"
import { kitDither } from "./kit-dither"

export const TPS = 240
export const FPS = 30
/** One frame: every key lands on this grid. */
export const FR = TPS / FPS
/** Seconds as ticks, snapped to the frame grid. */
export const at = (seconds: number) => Math.round((seconds * TPS) / FR) * FR

// The house eases (the Clayzo recipes' shapes): a symmetric camera move,
// ins that settle, outs that drain, and the one pop with an overshoot.
export const MOVE: CubicBezier = { x1: 0.65, y1: 0, x2: 0.35, y2: 1 }
export const SETTLE: CubicBezier = { x1: 0.25, y1: 0.5, x2: 0.45, y2: 1 }
export const OUT: CubicBezier = { x1: 0.2, y1: 0.45, x2: 0.45, y2: 1 }
export const DRAIN: CubicBezier = { x1: 0.5, y1: 0, x2: 0.7, y2: 0.7 }
export const POP: CubicBezier = { x1: 0.1, y1: 0.9, x2: 0.3, y2: 1 }

export type Nodes = Record<string, SceneNode>

/** A smooth wave between `lo` and `hi` on the house camera ease: `count`
 * full periods across a loop `end` ticks long, opening (and so closing) on
 * `lo`, or on `hi` when `inverse`. */
export function wave<T>(id: string, end: number, count: number, lo: T, hi: T, inverse = false): Animatable<T> {
  const keys: Key<T>[] = []
  for (let i = 0; i <= count * 2; i++)
    keys.push([Math.round((i * end) / (count * 2) / FR) * FR, (i % 2 === 0) !== inverse ? lo : hi, MOVE])
  return keyed(id, keys)
}

/** A recurring move on a loop `end` ticks long: every `period` ticks from
 * `offset`, the value runs linearly `from` → `to` over `life` ticks and then
 * rests on `to` until the next run. A run that crosses the loop's end opens
 * the loop with its tail, so the track closes on itself (`end` must be a
 * multiple of `period`). `mix` interpolates the two values. `start` places
 * the loop later on the film's timeline (a loop inside one beat). */
export function cycle<T>(
  id: string,
  end: number,
  run: { period: number; offset: number; life: number },
  from: T,
  to: T,
  mix: (a: T, b: T, f: number) => T,
  start = 0,
): Animatable<T> {
  const { period, offset, life } = run
  if (end % period !== 0 || life >= period)
    throw new Error(`cycle ${id}: period ${period}, life ${life} do not fit a ${end}-tick loop`)
  const phase = (t: number) => (((t - offset) % period) + period) % period
  const valueAt = (t: number) => (phase(t) < life ? mix(from, to, phase(t) / life) : to)
  const ticks = new Set([0, end])
  for (let c = offset - period; c < end + period; c += period) {
    if (c >= 0 && c <= end) ticks.add(c)
    if (c + life >= 0 && c + life <= end) ticks.add(c + life)
  }
  const keys: Key<T>[] = [...ticks]
    .sort((a, b) => a - b)
    .map((t) => {
      const p = phase(t)
      // At a run's start the value is `from`; inside a run it moves.
      return p < life ? [start + t, p === 0 ? from : valueAt(t), "linear"] : [start + t, to, "hold"]
    })
  return keyed(id, keys)
}

/** Mixers for `cycle`. */
export const mixNumber = (a: number, b: number, f: number) => a + (b - a) * f
export const mixVec3 = (a: Vec3, b: Vec3, f: number): Vec3 => ({
  x: mixNumber(a.x, b.x, f),
  y: mixNumber(a.y, b.y, f),
  z: mixNumber(a.z, b.z, f),
})
export const mixColor = (a: Color, b: Color, f: number): Color => ({
  r: mixNumber(a.r, b.r, f),
  g: mixNumber(a.g, b.g, f),
  b: mixNumber(a.b, b.b, f),
  a: mixNumber(a.a, b.a, f),
})

/** A vertex with no tangents. */
export const v = (x: number, y: number) => ({ point: { x, y }, inTangent: { x: 0, y: 0 }, outTangent: { x: 0, y: 0 } })

/** An axis-aligned rectangle contour from its top-left corner. */
export const rect = (x: number, y: number, w: number, h: number): PathContour => ({
  closed: true,
  vertices: [v(x, y), v(x + w, y), v(x + w, y + h), v(x, y + h)],
})

/** A film's whole document: `scene` lists the root's children back to
 * front; the scene renders through the kit dither pass on a `cell`-unit
 * lattice (`cool` swaps the cool ramp); `loupe` is the radius (composition units) the shader's loupe
 * opens to under the pointer; `interaction` adds more pointer behaviour.
 * Both sit on top of a timeline that reads on its own. Every film marks a
 * `still` — the resting frame the page holds under reduced motion. */
export function pixelFilm(film: {
  id: string
  name: string
  width: number
  height: number
  end: number
  nodes: Nodes
  scene: string[]
  cell: number
  gap?: number
  cool?: readonly string[]
  markers?: Marker[]
  loupe?: number
  interaction?: InteractionContribution[]
}): AnimationDocument {
  const { id, width, height, end } = film
  const nodes: Nodes = {
    ...film.nodes,
    scene: { ...base("scene", { outTick: end }), type: "group", children: film.scene },
    pixels: kitDither("pixels", "scene", end, { cell: film.cell, gap: film.gap ?? 1, cool: film.cool }),
  }
  const doc = withComputedRevision({
    version: ANIMATION_DOCUMENT_VERSION,
    id,
    name: film.name,
    // Transparent: below the ramp is clear, so a film lies on whatever
    // ground holds it (matte panels, the lens) with no black box.
    canvas: { width, height, pixelAspectRatio: 1, backgroundColor: { r: 0, g: 0, b: 0, a: 0 } },
    timing: {
      ticksPerSecond: TPS,
      frameRate: { numerator: FPS, denominator: 1 },
      durationTicks: end,
      displayStartTick: 0,
    },
    assets: {},
    compositions: {
      main: { id: "main", name: "Main", width, height, durationTicks: end, nodes, rootNodeIds: ["pixels"] },
    },
    rootCompositionId: "main",
    components: {},
    markers: film.markers ?? [],
    capabilities: { required: [], optional: [], unsupportedPolicy: "warn" },
  })
  const interaction = [
    ...(film.loupe
      ? [
          pointerFieldMacro({
            effectNodeId: "pixels",
            focusParameterId: "pixels.focus",
            radiusParameterId: "pixels.radius",
            radius: film.loupe,
            halfLife: 0.06,
          }),
        ]
      : []),
    ...(film.interaction ?? []),
  ]
  const live = interaction.length ? withComputedRevision(withInteraction(doc, interaction)) : doc
  return assertValidAnimationDocument(live)
}
