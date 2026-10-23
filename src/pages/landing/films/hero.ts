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
  hoverLiftMacro,
  keyed,
  marker,
  parallaxLayersMacro,
  pressSquashMacro,
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
import { mulberry32 } from "@dither-kit"
import {
  at as s,
  cycle,
  DRAIN,
  FR,
  mixColor,
  mixVec3,
  MOVE,
  OUT,
  pixelFilm,
  rect,
  SETTLE,
  v,
  type Nodes,
} from "./frame"
import { heat, tone } from "./kit-dither"

/** The film's beats in seconds. */
const BEATS = {
  tilt: 0.4,
  exploded: 1.6,
  reseed: 2.2,
  flipOn: 3.2,
  press: 3.9,
  unseed: 5.0,
  flipOff: 5.9,
  fold: 6.7,
  flat: 8.0,
  end: 9.6,
} as const
/** How long a re-seed's morph takes, in seconds. */
const MORPH = 0.8

export const HERO = { width: 1280, height: 800 } as const
export const HERO_END = s(BEATS.end)

const LIFT = { mass: 1, stiffness: 140, damping: 15 }

// The beats.
const TILT = s(BEATS.tilt)
const ISO = s(BEATS.exploded)
const MORPH_A = s(BEATS.reseed)
const FLIP_ON = s(BEATS.flipOn)
const PRESS = s(BEATS.press)
const MORPH_B = s(BEATS.unseed)
const FLIP_OFF = s(BEATS.flipOff)
const FOLD = s(BEATS.fold)
const FLAT = s(BEATS.flat)

/** A track on the camera beats: `flat` until the tilt, `iso` while the
 * board is exploded, `flat` again after the fold. */
const camera = <T>(id: string, flat: T, iso: T) =>
  keyed(id, [
    [TILT, flat, MOVE],
    [ISO, iso],
    [FOLD, iso, MOVE],
    [FLAT, flat],
  ])

// The board, in its own space (origin at its centre), and its margin.
const BW = 1040
const BH = 600
const PAD = 52
/** The right column's centre: the ring, the switch and the button. */
const COL = BW / 2 - PAD - 120

// The chart panel and its two datasets (the second is the re-seed).
const CX = -BW / 2 + PAD
const CY = -BH / 2 + 118
const CW = 640
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
    [MORPH_A + s(MORPH), b],
    [MORPH_B, b, SETTLE],
    [MORPH_B + s(MORPH), a],
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
          [MORPH_A + s(MORPH) + i * FR, { x: 1, y: h(DATA_B[i]) / h(a), z: 1 }],
          [MORPH_B, { x: 1, y: h(DATA_B[i]) / h(a), z: 1 }, SETTLE],
          [MORPH_B + s(MORPH) + i * FR, { x: 1, y: 1, z: 1 }],
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
  // The re-seed's scan: a soft band of light runs down the board each time
  // the data changes — the board re-dithering under it.
  const pass = (t: number): Key<number>[] => [
    [t - FR, 0, "hold"],
    [t, 1, "linear"],
    [t + s(0.9), 1, "hold"],
    [t + s(0.9) + FR, 0, "hold"],
  ]
  nodes.scan = {
    ...base("scan", {
      outTick: HERO_END,
      blendMode: "lighten",
      position: keyed("scan.position", [
        [MORPH_A - FR, { x: 0, y: -BH / 2, z: 0 }, "hold"],
        [MORPH_A, { x: 0, y: -BH / 2, z: 0 }, "linear"],
        [MORPH_A + s(0.9), { x: 0, y: BH / 2, z: 0 }, "hold"],
        [MORPH_B, { x: 0, y: -BH / 2, z: 0 }, "linear"],
        [MORPH_B + s(0.9), { x: 0, y: BH / 2, z: 0 }],
      ]),
    }),
    type: "rect",
    size: constant({ width: BW - 24, height: 72 }),
    cornerRadius: constant(0),
    style: {
      gradientFill: {
        kind: "linear",
        stops: constant([
          { position: 0, color: tone(0) },
          { position: 0.8, color: tone(0.9) },
          { position: 1, color: tone(0) },
        ]),
        start: constant({ x: 0, y: -36 }),
        end: constant({ x: 0, y: 36 }),
        opacity: keyed("scan.opacity", [[0, 0, "hold"], ...pass(MORPH_A), ...pass(MORPH_B), [HERO_END, 0]]),
      },
    },
  }
  ids.push("scan")
  return ids
}

/** Dust: cells shaken loose while the board is apart, rising through the
 * stack and dithering out; one in six is an ember. Lives only between the
 * explode and the fold. */
function dust(nodes: Nodes): string {
  const rand = mulberry32(0xd057)
  const life = FOLD - ISO
  const children: string[] = []
  for (let i = 0; i < 22; i++) {
    const id = `dust${i}`
    const x = Math.round((260 + rand() * 760) / 8) * 8 + 4
    const y = Math.round((330 + rand() * 360) / 8) * 8 + 4
    const rise = (10 + Math.floor(rand() * 16)) * 8
    const hot = rand() < 0.16
    // Three runs across the explode, each frame-aligned (1224 / 3 = 51 frames).
    const period = life / 3
    const run = {
      period,
      offset: Math.round((rand() * period) / FR) * FR,
      life: Math.round(((0.5 + rand() * 0.4) * period) / FR) * FR,
    }
    // Its own little loop, laid on the explode.
    const to = { x: x + (Math.floor(rand() * 5) - 2) * 8, y: y - rise, z: 0 }
    nodes[id] = {
      ...base(id, { outTick: FOLD, position: cycle(`${id}.position`, life, run, { x, y, z: 0 }, to, mixVec3, ISO) }),
      inTick: ISO,
      type: "rect",
      size: constant({ width: 8, height: 8 }),
      cornerRadius: constant(0),
      style: {
        fill: {
          color: cycle(`${id}.tone`, life, run, hot ? heat(0.8) : tone(0.95), hot ? heat(0) : tone(0), mixColor, ISO),
          opacity: constant(1),
        },
      },
    }
    children.push(id)
  }
  nodes.dust = { ...node("dust"), type: "group", children }
  return "dust"
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
    ...node("switch"),
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
        on(0, 1).map(([t, k, e]) => [t, { x: -36 + k * 72, y: 0, z: 0 }, e] as const),
      ),
    }),
    type: "rect",
    size: constant({ width: 44, height: 44 }),
    cornerRadius: constant(0),
    style: { fill: { color: keyed("knob.color", knobColor), opacity: constant(1) } },
  }
  // Track and knob are one control, so they answer the cursor together.
  nodes.toggle = { ...node("toggle", X, SY), type: "group", children: ["switch", "knob"] }
  return ["toggle", "button"]
}

/** One exploded layer: the board's rotation plus its own lift, both on the
 * camera beats; `order` staggers the lifts and reverses the fold. Lifted
 * layers carry a hairline sheet — the board's outline — so the exploded
 * stack reads as paint layers over one artboard. */
function layer(nodes: Nodes, id: string, content: string[], order: number, lift: number): SceneNode {
  const children = [...content]
  const up = TILT + s(0.5) + order * s(0.12)
  const down = FOLD + (3 - order) * s(0.08)
  if (order > 0) {
    // The sheet draws itself round as the layer lifts and undraws as it
    // folds (an open contour that returns to its start, so the trim reaches
    // the closing edge too).
    const [x0, y0, x1, y1] = [-BW / 2, -BH / 2, BW / 2, BH / 2]
    nodes[`${id}.sheet`] = {
      ...node(`${id}.sheet`),
      type: "path",
      path: constant({
        contours: [{ closed: false, vertices: [v(x0, y0), v(x1, y0), v(x1, y1), v(x0, y1), v(x0, y0)] }],
      }),
      style: { stroke: stroke(tone(0.3), 16, { cap: "square", join: "miter" }) },
      operators: [
        trim(`${id}.sheet.trim`, {
          end: keyed(`${id}.sheet.end`, [
            [up, 0, OUT],
            [up + s(0.9), 1],
            [down, 1, DRAIN],
            [down + s(0.45), 0],
          ]),
        }),
      ],
    }
    children.unshift(`${id}.sheet`)
  }
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
  const K = 0.82
  nodes.board = {
    ...base("board", {
      outTick: HERO_END,
      position: camera(
        "board.position",
        { x: HERO.width / 2, y: HERO.height / 2, z: 0 },
        { x: HERO.width / 2, y: HERO.height / 2 + 106, z: 0 },
      ),
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
    scene: ["board", dust(nodes)],
    cell: 8,
    loupe: 12 * 8,
    markers: [
      marker("still", 0),
      marker("tilt", TILT),
      marker("exploded", ISO),
      marker("reseed", MORPH_A),
      marker("press", PRESS),
      marker("fold", FOLD),
      marker("flat", FLAT),
    ],
    // The cursor parts the layers a little: the front moves most. The
    // board's two verbs answer it: hovered they swell a touch, pressed they
    // squash, on whatever the loop is doing underneath.
    interaction: [
      parallaxLayersMacro({ nodeIds: layers.map((l) => l.id), span: 800, reach: 28 }),
      hoverLiftMacro({ nodeId: "button", hitAreaId: "button-hit", padding: 24, scale: 1.06, lift: 0 }),
      pressSquashMacro({ nodeId: "button", hitAreaId: "button-hit", scale: 0.92 }),
      hoverLiftMacro({ nodeId: "toggle", hitAreaId: "toggle-hit", padding: 24, scale: 1.06, lift: 0 }),
      pressSquashMacro({ nodeId: "toggle", hitAreaId: "toggle-hit", scale: 0.94 }),
    ],
  })
}
