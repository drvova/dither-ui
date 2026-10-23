// Node-side only — see kit-dither.ts. The Studio film: the dotted canvas,
// an ember cursor that places three artboards (a bar chart, a line chart,
// a button and switch) with a click each, marquee-selects them, and lets
// them drain away in reverse. The loop opens and closes on the empty
// canvas. The cursor carries a soft light across the dots; each board's ink
// develops through a dithered edge after its pop. Verb: place. Geometry:
// frames on a dot lattice.
import {
  base,
  constant,
  fill,
  keyed,
  marker,
  stroke,
  type Key,
  type PathContour,
  type Vec3,
} from "@clayzo/animation/authoring"
import { at, DRAIN, FR, MOVE, OUT, pixelFilm, POP, rect, SETTLE, v, type Nodes } from "./frame"
import { heat, tone } from "./kit-dither"

const W = 960
const H = 600
const END = at(6.4)

/** The three artboards: centre, size, and the click that places each. */
const BOARDS = [
  { id: "a1", x: 222, y: 200, w: 264, h: 176, click: at(0.9) },
  { id: "a2", x: 600, y: 176, w: 312, h: 208, click: at(1.6) },
  { id: "a3", x: 470, y: 430, w: 252, h: 128, click: at(2.3) },
] as const
const SELECT = at(2.9)
const DRAIN_AT = at(4.6)
const EXIT = at(4.9)

/** The marquee's box: drawn from its top-left corner around all three. */
const MARQUEE = { x: 64, y: 48, w: W - 128, h: H - 96 }

const one = { x: 1, y: 1, z: 1 }
const none = { x: 0, y: 0, z: 1 }

/** Frame content in each board's own space (origin at its centre). */
function content(id: string, w: number, h: number): PathContour[] {
  if (id === "a1") {
    // Five bars on the board's floor.
    return [0.45, 0.7, 0.55, 0.85, 1].map((k, i) =>
      rect(-w / 2 + 36 + i * 42, h / 2 - 28 - k * (h - 76), 24, k * (h - 76)),
    )
  }
  if (id === "a2") {
    // A stepped line: a run of cells climbing left to right.
    const steps = [0.3, 0.42, 0.38, 0.56, 0.62, 0.8, 0.74, 0.9]
    return steps.map((k, i) => rect(-w / 2 + 32 + i * 32, h / 2 - 32 - k * (h - 84), 28, 12))
  }
  return [rect(-w / 2 + 28, -12, 120, 36)]
}

/** The cursor's path: in from the lower right, click to click, the
 * marquee's drag, and out — `dx`/`dy` offset it (the glow rides under the
 * arrow's body). */
function cursorTrack(id: string, dx = 0, dy = 0) {
  const box = MARQUEE
  const [a1, a2, a3] = BOARDS
  const k: [number, number, number][] = [
    [at(0.3), W + 60, H + 40],
    [a1.click, a1.x + 10, a1.y + 8],
    [a2.click, a2.x + 10, a2.y + 8],
    [a3.click, a3.x + 10, a3.y + 8],
    [SELECT, box.x, box.y],
    [SELECT + at(0.5), box.x + box.w, box.y + box.h],
    [EXIT, box.x + box.w, box.y + box.h],
    [EXIT + at(0.7), W + 60, H + 40],
  ]
  return keyed(
    id,
    k.map(([t, x, y], i) => [t, { x: x + dx, y: y + dy, z: 0 }, i < k.length - 1 ? MOVE : undefined] as Key<Vec3>),
  )
}

export function studioFilm() {
  const nodes: Nodes = {}
  // The Studio canvas: a dot every 72 units, one whole lattice cell each
  // (a dot that straddles two cells lands on neither centre).
  const dots: PathContour[] = []
  for (let y = 36; y < H; y += 72) for (let x = 36; x < W; x += 72) dots.push(rect(x, y, 12, 12))
  nodes.dots = {
    ...base("dots", { outTick: END }),
    type: "path",
    path: constant({ contours: dots }),
    style: { fill: fill(tone(0.3)) },
  }
  // The cursor carries a soft light: the dots near it brighten as it
  // passes (a glow clipped to the dots, so the canvas between stays dark).
  nodes["glow.clip"] = {
    ...base("glow.clip", { outTick: END }),
    type: "path",
    path: constant({ contours: dots }),
    style: { fill: fill(tone(1)) },
  }
  nodes["glow.light"] = {
    ...base("glow.light", { outTick: END, blendMode: "lighten", position: cursorTrack("glow.position", 28, 56) }),
    type: "ellipse",
    size: constant({ width: 360, height: 360 }),
    style: {
      gradientFill: {
        kind: "radial",
        stops: constant([
          { position: 0, color: tone(0.85) },
          { position: 0.45, color: tone(0.5) },
          { position: 1, color: tone(0) },
        ]),
        start: constant({ x: 0, y: 0 }),
        end: constant({ x: 180, y: 0 }),
        opacity: constant(1),
      },
    },
  }
  nodes.glow = { ...base("glow", { outTick: END }), type: "group", children: ["glow.light"], clipPathId: "glow.clip" }

  const scene = ["dots", "glow"]
  BOARDS.forEach((b, i) => {
    // Each board pops on its click (the one overshoot) and drains in reverse.
    const out = DRAIN_AT + (BOARDS.length - 1 - i) * at(0.12)
    const scale: Key<Vec3>[] = [
      [b.click + FR, none, POP],
      [b.click + FR + at(0.28), { x: 1.06, y: 1.06, z: 1 }, SETTLE],
      [b.click + FR + at(0.42), one],
      [out, one, DRAIN],
      [out + at(0.3), none],
    ]
    const children = [`${b.id}.plate`, `${b.id}.ink`]
    nodes[b.id] = {
      ...base(b.id, { outTick: END, x: b.x, y: b.y, scale: keyed(`${b.id}.scale`, scale) }),
      type: "group",
      children,
    }
    nodes[`${b.id}.plate`] = {
      ...base(`${b.id}.plate`, { outTick: END }),
      type: "rect",
      size: constant({ width: b.w, height: b.h }),
      cornerRadius: constant(0),
      style: { fill: fill(tone(0.07)), stroke: stroke(tone(0.42), 12, { cap: "square", join: "miter" }) },
    }
    // The ink develops left to right through a dithered edge — the kit's
    // own entrance: a gradient from the ink's tone to nothing whose span
    // slides across the board after the pop.
    const ink = b.id === "a3" ? heat : tone
    const edge = b.w * 0.4
    const sweep = (x: number) => ({ x, y: 0 })
    nodes[`${b.id}.ink`] = {
      ...base(`${b.id}.ink`, { outTick: END }),
      type: "path",
      path: constant({ contours: content(b.id, b.w, b.h) }),
      style: {
        gradientFill: {
          kind: "linear",
          stops: constant([
            { position: 0, color: ink(b.id === "a3" ? 0.5 : 0.72) },
            { position: 1, color: ink(0) },
          ]),
          start: keyed(`${b.id}.ink.start`, [
            [b.click + at(0.2), sweep(-b.w / 2 - edge), OUT],
            [b.click + at(0.9), sweep(b.w / 2)],
          ]),
          end: keyed(`${b.id}.ink.end`, [
            [b.click + at(0.2), sweep(-b.w / 2), OUT],
            [b.click + at(0.9), sweep(b.w / 2 + edge)],
          ]),
          opacity: constant(1),
        },
      },
    }
    // The click's ring: a one-cell stroke that opens and fades.
    nodes[`${b.id}.ring`] = {
      ...base(`${b.id}.ring`, {
        outTick: END,
        x: b.x,
        y: b.y,
        scale: keyed(`${b.id}.ring.scale`, [
          [b.click, { x: 0.2, y: 0.2, z: 1 }, OUT],
          [b.click + at(0.4), { x: 1.4, y: 1.4, z: 1 }],
        ]),
      }),
      inTick: b.click,
      outTick: b.click + at(0.4),
      type: "ellipse",
      size: constant({ width: 120, height: 120 }),
      style: {
        stroke: stroke(heat(0.7), 12, {
          opacity: keyed(`${b.id}.ring.o`, [
            [b.click, 1, OUT],
            [b.click + at(0.4), 0],
          ]),
        }),
      },
    }
    scene.push(b.id, `${b.id}.ring`)
  })

  // The marquee: drawn from the top-left corner around all three boards,
  // held, then dropped before the boards drain.
  const box = MARQUEE
  nodes.marquee = {
    ...base("marquee", {
      outTick: END,
      x: box.x,
      y: box.y,
      anchor: { x: 0, y: 0 },
      scale: keyed("marquee.scale", [
        [SELECT, { x: 0.02, y: 0.02, z: 1 }, MOVE],
        [SELECT + at(0.5), one],
      ]),
    }),
    inTick: SELECT,
    outTick: DRAIN_AT,
    type: "path",
    path: constant({ contours: [rect(0, 0, box.w, box.h)] }),
    style: { stroke: stroke(heat(0.75), 12, { cap: "butt", join: "miter", dash: [36, 24] }) },
  }
  scene.push("marquee")

  // The cursor: a pixel arrow that travels click to click, dips on each
  // click, drags the marquee, and leaves.
  nodes.cursor = {
    ...base("cursor", {
      outTick: END,
      position: cursorTrack("cursor.position"),
      scale: keyed(
        "cursor.scale",
        BOARDS.flatMap((b): Key<Vec3>[] => [
          [b.click - 2 * FR, one, OUT],
          [b.click, { x: 0.84, y: 0.84, z: 1 }, OUT],
          [b.click + 3 * FR, one],
        ]),
      ),
    }),
    type: "path",
    path: constant({
      contours: [
        {
          closed: true,
          vertices: [v(0, 0), v(0, 96), v(24, 74), v(42, 112), v(61, 102), v(43, 66), v(74, 66)],
        },
      ],
    }),
    style: { fill: fill(heat(0.9)) },
  }
  scene.push("cursor")

  return pixelFilm({
    id: "studio",
    name: "dither-ui studio",
    width: W,
    height: H,
    end: END,
    nodes,
    scene,
    cell: 12,
    loupe: 9 * 12,
    markers: [
      // The resting frame: all three boards placed and selected.
      marker("still", SELECT + at(1)),
      ...BOARDS.map((b) => marker(`place-${b.id}`, b.click)),
      marker("select", SELECT),
      marker("drain", DRAIN_AT),
    ],
  })
}
