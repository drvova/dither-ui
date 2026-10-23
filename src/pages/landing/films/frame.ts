// Node-side only — see kit-dither.ts. What every landing film shares: the
// time base (240 ticks a second, played at 30 fps, every key snapped to a
// frame), the house eases, cell-geometry helpers, and the one way a film
// becomes a document — its scene drawn in tones, rendered through the kit
// dither pass, stamped, validated.
import {
  ANIMATION_DOCUMENT_VERSION,
  assertValidAnimationDocument,
  base,
  withComputedRevision,
  withInteraction,
  type AnimationDocument,
  type CubicBezier,
  type InteractionContribution,
  type Marker,
  type PathContour,
  type SceneNode,
} from "@clayzo/animation/authoring"
import { kitDither, tone } from "./kit-dither"

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

/** A vertex with no tangents. */
export const v = (x: number, y: number) => ({ point: { x, y }, inTangent: { x: 0, y: 0 }, outTangent: { x: 0, y: 0 } })

/** An axis-aligned rectangle contour from its top-left corner. */
export const rect = (x: number, y: number, w: number, h: number): PathContour => ({
  closed: true,
  vertices: [v(x, y), v(x + w, y), v(x + w, y + h), v(x, y + h)],
})

/** A film's whole document: `scene` lists the root's children back to
 * front; the scene renders through the kit dither pass on a `cell`-unit
 * lattice; `interaction` adds pointer behaviour on top of a timeline that
 * reads on its own. Every film marks a `still` — the resting frame the page
 * holds under reduced motion. */
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
  markers?: Marker[]
  interaction?: InteractionContribution[]
}): AnimationDocument {
  const { id, width, height, end } = film
  const nodes: Nodes = {
    ...film.nodes,
    scene: { ...base("scene", { outTick: end }), type: "group", children: film.scene },
    pixels: kitDither("pixels", "scene", end, { cell: film.cell, gap: film.gap ?? 1 }),
  }
  const doc = withComputedRevision({
    version: ANIMATION_DOCUMENT_VERSION,
    id,
    name: film.name,
    canvas: { width, height, pixelAspectRatio: 1, backgroundColor: tone(0) },
    timing: {
      ticksPerSecond: TPS,
      frameRate: { numerator: FPS, denominator: 1 },
      durationTicks: end,
      displayStartTick: 0,
    },
    assets: {},
    compositions: { main: { id: "main", name: "Main", width, height, durationTicks: end, nodes, rootNodeIds: ["pixels"] } },
    rootCompositionId: "main",
    components: {},
    markers: film.markers ?? [],
    capabilities: { required: [], optional: [], unsupportedPolicy: "warn" },
  })
  const live = film.interaction?.length ? withComputedRevision(withInteraction(doc, film.interaction)) : doc
  return assertValidAnimationDocument(live)
}
