// Node-side only — see kit-dither.ts. The hero film: one dashboard artboard,
// built from the kit's own anatomy (an area chart with its line and sparkle
// points, a bar row, a ring, a gradient button, a switch, placeholder copy),
// that tips into isometric, comes apart into its paint layers, lives for a
// beat in the exploded view (the data re-seeds, the switch flips, the button
// presses) and folds back flat. Clayzo owns the motion; the kit's dither
// rule renders every pixel (kit-dither.ts). The first and last frames are the
// same flat board, so the loop closes on a still — the frame reduced motion
// holds and the page shows before the player lands.
import {
  base,
  constant,
  fill,
  keyed,
  marker,
  parallaxLayersMacro,
  stroke,
  trim,
  type Animatable,
  type AnimationDocument,
  type Color,
  type Key,
  type PathContour,
  type PathData,
  type SceneNode,
  type Vec3,
} from "@clayzo/animation/authoring"
import { at as s, DRAIN, FR, MOVE, OUT, pixelFilm, rect, SETTLE, v, type Nodes } from "./frame"
import { heat, tone } from "./kit-dither"

export const HERO = { width: 1600, height: 800 } as const
export const HERO_END = s(9.6)

const LIFT = { mass: 1, stiffness: 140, damping: 15 }

// The beats.
const TILT = s(0.4)
const ISO = s(1.6)
const MORPH_A = s(2.2)
const FLIP_ON = s(3.2)
const PRESS = s(3.9)
const MORPH_B = s(5.0)
const FLIP_OFF = s(5.9)
const FOLD = s(6.7)
const FLAT = s(8.0)

/** A track on the camera beats: `flat` until the tilt, `iso` while the
 * board is exploded, `flat` again after the fold. */
const camera = <T,>(id: string, flat: T, iso: T) =>
  keyed(id, [
    [TILT, flat, MOVE],
    [ISO, iso],
    [FOLD, iso, MOVE],
    [FLAT, flat],
  ])

// The board, in its own space (origin at its centre), and its margin.
const BW = 1100
const BH = 600
const PAD = 52
/** The right column's centre: the ring, the switch and the button. */
const COL = BW / 2 - PAD - 120

// The chart panel and its two datasets (the second is the re-seed).
const CX = -BW / 2 + PAD
const CY = -BH / 2 + 118
const CW = 690
const CH = 300
const DATA_A = [46, 52, 49, 58, 64, 61, 72, 78, 74, 86, 92, 88]
const DATA_B = [38, 47, 60, 54, 66, 75, 69, 77, 88, 81, 90, 97]

const px = (i: number) => CX + 18 + (i * (CW - 36)) / (DATA_A.length - 1)
const py = (value: number) => CY + CH - (value / 100) * CH

/** A smooth curve through the points (Catmull-Rom as cubic tangents), so
 * the two datasets morph vertex for vertex. */
function curve(data: readonly number[]): PathContour["vertices"] {
  const pts = data.map((d, i) => ({ x: px(i), y: py(d) }))
  return pts.map((p, i) => {
    const prev = pts[Math.max(0, i - 1)]
    const next = pts[Math.min(pts.length - 1, i + 1)]
    const tx = (next.x - prev.x) / 6
    const ty = (next.y - prev.y) / 6
    return {
      point: p,
      inTangent: i === 0 ? { x: 0, y: 0 } : { x: -tx, y: -ty },
      outTangent: i === pts.length - 1 ? { x: 0, y: 0 } : { x: tx, y: ty },
    }
  })
}

const linePath = (data: readonly number[]): PathData => ({ contours: [{ closed: false, vertices: curve(data) }] })
const areaPath = (data: readonly number[]): PathData => ({
  contours: [{ closed: true, vertices: [v(px(0), CY + CH), ...curve(data), v(px(data.length - 1), CY + CH)] }],
})

/** A morph between the datasets: A holds, eases to B, holds, eases back. */
function morph<T>(id: string, a: T, b: T): Animatable<T> {
  return keyed(id, [
    [MORPH_A, a, SETTLE],
    [MORPH_A + s(0.8), b],
    [MORPH_B, b, SETTLE],
    [MORPH_B + s(0.8), a],
  ])
}

const node = (id: string, x = 0, y = 0) => base(id, { outTick: HERO_END, x, y })

/** Layer 0 — the board: its plate, frame, grid and placeholder copy. */
function boardLayer(nodes: Nodes): string[] {
  nodes.plate = {
    ...node("plate"),
    type: "rect",
    size: constant({ width: BW, height: BH }),
    cornerRadius: constant(0),
    style: { fill: fill(tone(0.06)), stroke: stroke(tone(0.34), 5, { cap: "square", join: "miter" }) },
  }
  const grid: PathContour[] = []
  for (let i = 0; i <= 4; i++) grid.push(rect(CX, CY + (i * CH) / 4 - 4, CW, 8))
  nodes.grid = { ...node("grid"), type: "path", path: constant({ contours: grid }), style: { fill: fill(tone(0.18)) } }
  // Placeholder copy: a title and a subline, top left; a status row, top right.
  nodes.copy = {
    ...node("copy"),
    type: "path",
    path: constant({
      contours: [
        rect(CX, -BH / 2 + 44, 220, 18),
        rect(CX, -BH / 2 + 76, 132, 12),
        rect(BW / 2 - PAD - 96, -BH / 2 + 48, 96, 12),
        rect(CX, CY + CH + 120, 160, 10),
      ],
    }),
    style: { fill: fill(tone(0.34)) },
  }
  return ["plate", "grid", "copy"]
}

/** Layer 1 — the fills: the area under the series, the bar row, the ring. */
function fillLayer(nodes: Nodes): string[] {
  nodes.area = {
    ...node("area"),
    type: "path",
    path: morph("area.path", areaPath(DATA_A), areaPath(DATA_B)),
    style: {
      gradientFill: {
        kind: "linear",
        stops: constant([
          { position: 0, color: tone(0.84) },
          { position: 0.55, color: tone(0.48) },
          { position: 1, color: tone(0.12) },
        ]),
        start: constant({ x: 0, y: CY }),
        end: constant({ x: 0, y: CY + CH }),
        opacity: constant(1),
      },
    },
  }
  // The bar row under the chart: the same series, re-seeding with it.
  const barY = CY + CH + 100
  const ids: string[] = ["area"]
  DATA_A.forEach((a, i) => {
    const id = `bar${i}`
    const h = (d: number) => 14 + d * 0.62
    nodes[id] = {
      ...base(id, {
        outTick: HERO_END,
        x: px(i),
        y: barY,
        anchor: { x: 0, y: 0 },
        scale: keyed(`${id}.scale`, [
          [MORPH_A, { x: 1, y: 1, z: 1 }, SETTLE],
          [MORPH_A + s(0.8) + i * FR, { x: 1, y: h(DATA_B[i]) / h(a), z: 1 }],
          [MORPH_B, { x: 1, y: h(DATA_B[i]) / h(a), z: 1 }, SETTLE],
          [MORPH_B + s(0.8) + i * FR, { x: 1, y: 1, z: 1 }],
        ]),
      }),
      type: "path",
      path: constant({ contours: [rect(-14, -h(a), 28, h(a))] }),
      style: {
        gradientFill: {
          kind: "linear",
          stops: constant([
            { position: 0, color: tone(0.7) },
            { position: 1, color: tone(0.2) },
          ]),
          start: constant({ x: 0, y: -h(a) }),
          end: constant({ x: 0, y: 0 }),
          opacity: constant(1),
        },
      },
    }
    ids.push(id)
  })
  // The ring: a track and a lit arc that grows with the re-seed.
  const RX = COL
  const RY = CY + 52
  nodes.track = {
    ...node("track", RX, RY),
    type: "ellipse",
    size: constant({ width: 160, height: 160 }),
    style: { stroke: stroke(tone(0.22), 22) },
  }
  const arc: PathContour = {
    closed: false,
    vertices: Array.from({ length: 33 }, (_, i) => {
      const a = -Math.PI / 2 + (i / 32) * Math.PI * 2
      return v(Math.cos(a) * 80, Math.sin(a) * 80)
    }),
  }
  nodes.arc = {
    ...node("arc", RX, RY),
    type: "path",
    path: constant({ contours: [arc] }),
    style: { stroke: stroke(tone(0.86), 22, { cap: "butt" }) },
    operators: [trim("arc.trim", { end: morph("arc.end", 0.62, 0.84) })],
  }
  ids.push("track", "arc")
  return ids
}

/** Layer 2 — the line and its sparkle points. */
function lineLayer(nodes: Nodes): string[] {
  nodes.line = {
    ...node("line"),
    type: "path",
    path: morph("line.path", linePath(DATA_A), linePath(DATA_B)),
    // One cell wide flat; thick enough in the isometric squash to survive it.
    style: { stroke: stroke(tone(1), camera("line.width", 8, 18)) },
  }
  const ids = ["line"]
  // Sparkles ride the three peaks of whichever dataset is showing.
  ;[3, 7, 10].forEach((i, n) => {
    const id = `spark${n}`
    const at = (d: readonly number[]): Vec3 => ({ x: px(i), y: py(d[i]), z: 0 })
    nodes[id] = {
      ...base(id, { outTick: HERO_END, position: morph(`${id}.position`, at(DATA_A), at(DATA_B)) }),
      type: "rect",
      size: constant({ width: 26, height: 26 }),
      cornerRadius: constant(0),
      style: { fill: fill(heat(0.6)) },
    }
    ids.push(id)
  })
  return ids
}

/** Layer 3 — the controls: a gradient button and a switch, the board's two
 * verbs. The switch flips on and off; the button presses once between. The
 * button is the frame's one big ember — the accent at full scale. */
function controlLayer(nodes: Nodes): string[] {
  const X = COL
  const BY = CY + CH - 34
  const press = keyed<Vec3>("button.scale", [
    [PRESS, { x: 1, y: 1, z: 1 }, OUT],
    [PRESS + s(0.1), { x: 0.94, y: 0.94, z: 1 }, "linear"],
    [PRESS + s(0.13), { x: 0.94, y: 0.94, z: 1 }, { mass: 1, stiffness: 420, damping: 20 }],
    [PRESS + s(0.6), { x: 1, y: 1, z: 1 }],
  ])
  nodes.button = {
    ...base("button", { outTick: HERO_END, x: X, y: BY, scale: press }),
    type: "group",
    children: ["button.face", "button.label"],
  }
  nodes["button.face"] = {
    ...node("button.face"),
    type: "rect",
    size: constant({ width: 240, height: 68 }),
    cornerRadius: constant(0),
    style: {
      gradientFill: {
        kind: "linear",
        stops: constant([
          { position: 0, color: heat(0.62) },
          { position: 1, color: heat(0.3) },
        ]),
        start: constant({ x: 0, y: -34 }),
        end: constant({ x: 0, y: 34 }),
        opacity: constant(1),
      },
    },
  }
  nodes["button.label"] = {
    ...node("button.label"),
    type: "rect",
    size: constant({ width: 112, height: 12 }),
    cornerRadius: constant(0),
    style: { fill: fill(tone(1)) },
  }
  // The switch: a track and a knob that slides right and lights ember.
  const SY = BY - 84
  const on = (a: number, b: number): Key<number>[] => [
    [FLIP_ON, a, OUT],
    [FLIP_ON + s(0.27), b],
    [FLIP_OFF, b, OUT],
    [FLIP_OFF + s(0.27), a],
  ]
  nodes.switch = {
    ...node("switch", X, SY),
    type: "rect",
    size: constant({ width: 140, height: 56 }),
    cornerRadius: constant(0),
    style: { fill: fill(tone(0.42)) },
  }
  const knobColor: Key<Color>[] = [
    [FLIP_ON + 4 * FR, tone(0.9), "hold"],
    [FLIP_ON + 5 * FR, heat(0.75), "hold"],
    [FLIP_OFF + 4 * FR, heat(0.75), "hold"],
    [FLIP_OFF + 5 * FR, tone(0.9)],
  ]
  nodes.knob = {
    ...base("knob", {
      outTick: HERO_END,
      position: keyed(
        "knob.position",
        on(0, 1).map(([t, k, e]) => [t, { x: X - 36 + k * 72, y: SY, z: 0 }, e] as const),
      ),
    }),
    type: "rect",
    size: constant({ width: 44, height: 44 }),
    cornerRadius: constant(0),
    style: { fill: { color: keyed("knob.color", knobColor), opacity: constant(1) } },
  }
  return ["switch", "knob", "button"]
}

/** One exploded layer: the board's rotation plus its own lift, both on the
 * camera beats; `order` staggers the lifts and reverses the fold. Lifted
 * layers carry a hairline sheet — the board's outline — so the exploded
 * stack reads as paint layers over one artboard. */
function layer(nodes: Nodes, id: string, content: string[], order: number, lift: number): SceneNode {
  const children = [...content]
  if (order > 0) {
    nodes[`${id}.sheet`] = {
      ...node(`${id}.sheet`),
      type: "rect",
      size: constant({ width: BW, height: BH }),
      cornerRadius: constant(0),
      style: { stroke: stroke(tone(0.24), 16, { cap: "square", join: "miter" }) },
    }
    children.unshift(`${id}.sheet`)
  }
  const up = TILT + s(0.5) + order * s(0.12)
  const down = FOLD + (3 - order) * s(0.08)
  return {
    ...base(id, {
      outTick: HERO_END,
      position: keyed(`${id}.position`, [
        [up, { x: 0, y: 0, z: 0 }, LIFT],
        [up + s(1.1), { x: 0, y: -lift, z: 0 }],
        [down, { x: 0, y: -lift, z: 0 }, DRAIN],
        [down + s(0.5), { x: 0, y: 0, z: 0 }],
      ]),
      rotation: keyed(`${id}.rotation`, [
        [TILT, { x: 0, y: 0, z: 0 }, MOVE],
        [ISO, { x: 0, y: 0, z: 45 }],
        [FOLD, { x: 0, y: 0, z: 45 }, MOVE],
        [FLAT, { x: 0, y: 0, z: 0 }],
      ]),
    }),
    type: "group",
    children,
  }
}

/** The hero film document, validated and stamped. */
export function heroFilm(): AnimationDocument {
  const nodes: Nodes = {}
  const layers = [
    layer(nodes, "layer0", boardLayer(nodes), 0, 0),
    layer(nodes, "layer1", fillLayer(nodes), 1, 150),
    layer(nodes, "layer2", lineLayer(nodes), 2, 300),
    layer(nodes, "layer3", controlLayer(nodes), 3, 450),
  ]
  for (const l of layers) nodes[l.id] = l
  // The camera: the board squashes into isometric (rotate 45°, scale y by
  // tan 30°), steps back and drops so the exploded stack sits centred.
  const Y = Math.tan(Math.PI / 6)
  const K = 0.8
  nodes.board = {
    ...base("board", {
      outTick: HERO_END,
      position: camera("board.position", { x: HERO.width / 2, y: HERO.height / 2, z: 0 }, { x: HERO.width / 2, y: HERO.height / 2 + 100, z: 0 }),
      scale: camera("board.scale", { x: 1, y: 1, z: 1 }, { x: K, y: K * Y, z: 1 }),
    }),
    type: "group",
    children: layers.map((l) => l.id),
  }
  return pixelFilm({
    id: "hero",
    name: "dither-ui hero",
    ...HERO,
    end: HERO_END,
    nodes,
    scene: ["board"],
    cell: 8,
    markers: [
      marker("still", 0),
      marker("tilt", TILT),
      marker("exploded", ISO),
      marker("reseed", MORPH_A),
      marker("press", PRESS),
      marker("fold", FOLD),
      marker("flat", FLAT),
    ],
    // The cursor parts the layers a little: the front moves most.
    interaction: [parallaxLayersMacro({ nodeIds: layers.map((l) => l.id), span: 800, reach: 28 })],
  })
}

