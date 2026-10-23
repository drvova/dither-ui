// Node-side only — see kit-dither.ts. The dawn film, the bento band's
// floor: the dawn plate's planet (the same 168×46 lattice, so the plate is
// its stand-in cell for cell) brought to life — the sun breathes on the
// limb, its flare stretches along it, an aurora curtain sways over the far
// side, seed moons cross the sky on two orbits, stars flicker and a meteor
// crosses once. Every track closes on the value it opens with, so the loop
// has no seam; the still is the opening frame. Verb: breathe. Geometry:
// one circle much larger than the frame.
import {
  base,
  constant,
  cursorFollowMacro,
  fill,
  keyed,
  marker,
  parallaxLayersMacro,
  stroke,
  trim,
  type Animatable,
  type BaseOptions,
  type Binding,
  type Color,
  type GradientStop,
  type Key,
  type PathContour,
  type PathData,
} from "@clayzo/animation/authoring"
import { mulberry32 } from "@dither-kit"
import { at, FR, MOVE, OUT, pixelFilm, rect, v, wave, type Nodes } from "./frame"
import { heat, tone } from "./kit-dither"

/** One cell: the plate's lattice is 168×46 of these. */
const C = 8
const W = 168 * C
const H = 46 * C
const END = at(12)

// The plate's geometry in units: a planet much larger than the frame whose
// limb peaks right of centre, the sun sitting on the limb left of it.
const R = W * 0.95
const PX = W * 0.6
const PY = H * 0.36 + R
const SUN_X = W * 0.36
const SDX = (SUN_X - PX) / R
const SDY = -Math.sqrt(1 - SDX * SDX)
const SUN_Y = PY + SDY * R
/** The limb's tangent at the sun, in degrees. */
const TANGENT = (Math.atan2(SDY, SDX) * 180) / Math.PI + 90

/** The limb's height at `x`. */
const limb = (x: number) => PY - Math.sqrt(Math.max(0, R * R - (x - PX) ** 2))

const node = (id: string, x = 0, y = 0, extra: Pick<BaseOptions, "scale" | "rotation" | "blendMode"> = {}) =>
  base(id, { outTick: END, x, y, ...extra })
/** Light: a glow that only ever brightens what is under it. */
const LIGHT = { blendMode: "lighten" } as const
const radial = (
  cx: number,
  cy: number,
  r: number,
  stops: GradientStop[],
  opacity: Animatable<number> = constant(1),
) => ({
  kind: "radial" as const,
  stops: constant(stops),
  start: constant({ x: cx, y: cy }),
  end: constant({ x: cx + r, y: cy }),
  opacity,
})

/** The planet: the atmosphere's halo (breathing), the sky's light on the
 * sun's side, the disc with its bright limb, and the lit crescent. */
function planet(nodes: Nodes): string[] {
  const halo = R + 4 * C
  nodes.halo = {
    ...node("halo", PX, PY, LIGHT),
    type: "ellipse",
    size: constant({ width: halo * 2, height: halo * 2 }),
    style: {
      gradientFill: radial(
        0,
        0,
        halo,
        [
          { position: R / halo - 0.002, color: tone(0.46) },
          { position: (R + C) / halo, color: tone(0.24) },
          { position: 1, color: tone(0) },
        ],
        wave("halo.breath", END, 3, 0.7, 1),
      ),
    },
  }
  // Behind the disc, so only the atmosphere above the limb catches it.
  nodes.scatter = {
    ...node("scatter", SUN_X, SUN_Y, { ...LIGHT, scale: { x: 1, y: 0.36 } }),
    type: "ellipse",
    size: constant({ width: 64 * C, height: 64 * C }),
    style: {
      gradientFill: radial(0, 0, 32 * C, [
        { position: 0, color: tone(0.56) },
        { position: 0.3, color: tone(0.28) },
        { position: 1, color: tone(0) },
      ]),
    },
  }
  nodes.disc = {
    ...node("disc", PX, PY),
    type: "ellipse",
    size: constant({ width: R * 2, height: R * 2 }),
    style: {
      gradientFill: radial(0, 0, R, [
        { position: 0.9, color: tone(0.035) },
        { position: 0.97, color: tone(0.08) },
        { position: 0.99, color: tone(0.2) },
        { position: 0.997, color: tone(0.48) },
        { position: 1, color: tone(0.7) },
      ]),
    },
  }
  // The rim brightens toward the sun and breathes with it — never past
  // 0.7, so the sun's heat stays warm where it lightens over it.
  nodes.crescent = {
    ...node("crescent", SUN_X, SUN_Y, {
      ...LIGHT,
      rotation: TANGENT,
      scale: wave("crescent.scale", END, 4, { x: 1, y: 1, z: 1 }, { x: 1.2, y: 1, z: 1 }),
    }),
    type: "ellipse",
    size: constant({ width: 120 * C, height: 4 * C }),
    style: {
      gradientFill: radial(0, 0, 60 * C, [
        { position: 0, color: tone(0.7) },
        { position: 0.4, color: tone(0.5) },
        { position: 1, color: tone(0) },
      ]),
    },
  }
  return ["halo", "scatter", "disc", "crescent"]
}

/** The sun: a hot core on the limb that breathes, and a flare along the
 * tangent that stretches against it. */
function sun(nodes: Nodes): string[] {
  nodes.flare = {
    ...node("flare", SUN_X, SUN_Y, {
      ...LIGHT,
      rotation: TANGENT,
      scale: wave("flare.scale", END, 4, { x: 1.2, y: 1, z: 1 }, { x: 0.75, y: 1, z: 1 }),
    }),
    type: "ellipse",
    size: constant({ width: 64 * C, height: 2.2 * C }),
    style: {
      gradientFill: radial(0, 0, 32 * C, [
        { position: 0, color: heat(1) },
        { position: 0.3, color: heat(0.5) },
        { position: 1, color: heat(0) },
      ]),
    },
  }
  nodes.core = {
    ...node("core", SUN_X, SUN_Y, {
      ...LIGHT,
      scale: wave("core.scale", END, 4, { x: 0.84, y: 0.84, z: 1 }, { x: 1.12, y: 1.12, z: 1 }),
    }),
    type: "ellipse",
    size: constant({ width: 12 * C, height: 9 * C }),
    style: {
      gradientFill: radial(0, 0, 6 * C, [
        { position: 0, color: heat(1) },
        { position: 0.5, color: heat(0.7) },
        { position: 1, color: heat(0) },
      ]),
    },
  }
  return ["flare", "core"]
}

/** The aurora: two curtains standing on the far limb. Each curtain's crest
 * sways through three shapes and back; inside it (the same shape, as a
 * clip) one-cell rays shimmer on their own seeded beats. */
function aurora(nodes: Nodes): string[] {
  const third = Math.round(END / 3 / FR) * FR
  const curtain = (id: string, x0: number, x1: number, lift: number, crests: number[][], t: number, seed: number) => {
    const n = crests[0].length
    const xs = Array.from({ length: n }, (_, i) => x0 + ((x1 - x0) * i) / (n - 1))
    const shape = (crest: number[]): PathData => {
      const dx = (x1 - x0) / (n - 1) / 3
      const top = xs.map((x, i) => ({
        point: { x, y: limb(x) - lift - crest[i] * C },
        inTangent: { x: -dx, y: 0 },
        outTangent: { x: dx, y: 0 },
      }))
      const floor = [...xs].reverse().map((x) => v(x, limb(x) - C))
      return { contours: [{ closed: true, vertices: [...top, ...floor] }] }
    }
    const sway = () =>
      keyed(`${id}.path`, [
        [0, shape(crests[0]), MOVE],
        [third, shape(crests[1]), MOVE],
        [third * 2, shape(crests[2]), MOVE],
        [END, shape(crests[0])],
      ])
    const top = Math.min(limb(x0), limb(x1)) - lift - 16 * C
    const glow = (from: number, to: number, k: number) => ({
      kind: "linear" as const,
      stops: constant([
        { position: 0, color: tone(0) },
        { position: 0.6, color: tone(k * 0.55) },
        { position: 1, color: tone(k) },
      ]),
      start: constant({ x: 0, y: from }),
      end: constant({ x: 0, y: to }),
      opacity: constant(1),
    })
    // A clip is never drawn; its fill only satisfies the schema.
    nodes[`${id}.clip`] = { ...node(`${id}.clip`), type: "path", path: sway(), style: { fill: fill(tone(1)) } }
    nodes[`${id}.glow`] = {
      ...node(`${id}.glow`, 0, 0, LIGHT),
      type: "path",
      path: sway(),
      style: { gradientFill: glow(top, limb((x0 + x1) / 2), t) },
    }
    const rand = mulberry32(seed)
    const rays: string[] = []
    for (let x = Math.ceil(x0 / C) * C; x < x1; x += 2 * C) {
      const rid = `${id}.ray${rays.length}`
      const keys: Key<number>[] = [[0, 0.5, "hold"]]
      for (let k = 1; k < 6; k++) keys.push([Math.round((k * END) / 6 / FR) * FR, 0.25 + rand() * 0.75, "hold"])
      keys.push([END, 0.5])
      const h = limb(x) - top
      nodes[rid] = {
        ...node(rid, x + C / 2, top + h / 2, LIGHT),
        type: "rect",
        size: constant({ width: C, height: h }),
        cornerRadius: constant(0),
        style: { gradientFill: { ...glow(-h / 2, h / 2, Math.min(1, t * 1.5)), opacity: keyed(`${rid}.o`, keys) } },
      }
      rays.push(rid)
    }
    nodes[id] = { ...node(id), type: "group", children: [`${id}.glow`, ...rays], clipPathId: `${id}.clip` }
    return id
  }
  return [
    curtain(
      "aurora.far",
      W * 0.64,
      W * 1.02,
      1.5 * C,
      [
        [3, 8, 14, 10, 15, 11, 6, 3],
        [4, 12, 9, 15, 10, 14, 8, 2],
        [2, 7, 15, 12, 10, 16, 7, 4],
      ],
      0.3,
      0xa11,
    ),
    curtain(
      "aurora.near",
      W * 0.73,
      W * 1.04,
      C,
      [
        [2, 5, 10, 6, 11, 7, 3],
        [3, 9, 6, 11, 7, 10, 3],
        [1, 4, 11, 9, 6, 12, 5],
      ],
      0.4,
      0xa12,
    ),
  ]
}

/** The stars: seeded points in the sky above the limb, each flickering on
 * its own seeded beats (held steps — a pixel star does not fade). */
function stars(nodes: Nodes): string {
  const rand = mulberry32(0xd0a7)
  const ids: string[] = []
  for (let i = 0; ids.length < 54 && i < 400; i++) {
    const x = Math.floor(rand() * 168) * C
    const y = Math.floor(rand() * 40) * C
    if (y > limb(x + C / 2) - 4 * C || Math.hypot(x - SUN_X, (y - SUN_Y) * 2.4) < 34 * C) continue
    const bright = rand() < 0.2
    const rest = bright ? 0.62 : 0.3 + rand() * 0.22
    const keys: Key<Color>[] = [[0, tone(rest), "hold"]]
    // Two to four flickers a loop: a flash or a dip, two to five frames long.
    const flicks = 2 + Math.floor(rand() * 3)
    for (let k = 0; k < flicks; k++) {
      const t = Math.round(((k + rand() * 0.8) * END) / flicks / FR) * FR
      const long = (2 + Math.floor(rand() * 4)) * FR
      if (t <= keys[keys.length - 1][0] || t + long >= END) continue
      keys.push([t, tone(rand() < 0.6 ? 0.95 : 0.12), "hold"], [t + long, tone(rest), "hold"])
    }
    keys.push([END, tone(rest)])
    const id = `star${ids.length}`
    const contours: PathContour[] = bright ? [rect(x, y - C, C, 3 * C), rect(x - C, y, 3 * C, C)] : [rect(x, y, C, C)]
    nodes[id] = {
      ...node(id),
      type: "path",
      path: constant({ contours }),
      style: { fill: { color: keyed(`${id}.tone`, keys), opacity: constant(1) } },
    }
    ids.push(id)
  }
  nodes.stars = { ...node("stars"), type: "group", children: ids }
  return "stars"
}

/** The angles (degrees from the top) where an orbit of `radius` leaves the
 * frame on the left and on the right, a few cells clear of each edge. */
function crossing(radius: number): [number, number] {
  const off = (dx: number) => (Math.asin(Math.min(1, dx / radius)) * 180) / Math.PI
  return [-off(PX + 6 * C), off(W - PX + 6 * C)]
}

/** A turn of `node` about the planet's centre from `a0` to `a1` degrees,
 * `travel` ticks long, starting at `start` — and when the pass runs past
 * the loop's end, its tail opens the loop, so the track closes on itself.
 * Between passes the body waits past an edge, out of frame. */
function pass(id: string, a0: number, a1: number, start: number, travel: number) {
  const z = (deg: number) => ({ x: 0, y: 0, z: deg })
  if (start + travel <= END) {
    return keyed(id, [
      [0, z(a0), "hold"],
      [start, z(a0), "linear"],
      [start + travel, z(a1)],
    ])
  }
  const tail = start + travel - END
  const open = a0 + ((a1 - a0) * (END - start)) / travel
  return keyed(id, [
    [0, z(open), "linear"],
    [tail, z(a1), "hold"],
    [start, z(a0), "linear"],
    [END, z(open)],
  ])
}

/** The seed moons: each its own size, tone, height and speed, crossing the
 * sky on its own pass (a seeded scatter, so no two moons keep step). Lit
 * from the sun's side, the night side lost to the sky. */
function moons(
  nodes: Nodes,
  id: string,
  seed: number,
  count: number,
  lift: [number, number],
  size: [number, number],
): string {
  const rand = mulberry32(seed)
  const children: string[] = []
  for (let i = 0; i < count; i++) {
    const radius = R + (lift[0] + rand() * (lift[1] - lift[0])) * C
    const d = (size[0] + Math.floor(rand() * (size[1] - size[0] + 1))) * C
    const t = 0.55 + rand() * 0.4
    const travel = Math.round(((7 + rand() * 5) * END) / 12 / FR) * FR
    const start = Math.round(((i + rand() * 0.6) * END) / count / FR) * FR
    const [a0, a1] = crossing(radius)
    const mid = `${id}.m${i}`
    nodes[`${mid}.body`] = {
      ...node(`${mid}.body`, 0, -radius),
      type: "ellipse",
      size: constant({ width: d, height: d }),
      style: {
        gradientFill: {
          kind: "linear",
          stops: constant([
            { position: 0, color: tone(t) },
            { position: 0.6, color: tone(t * 0.55) },
            { position: 1, color: tone(t * 0.2) },
          ]),
          start: constant({ x: -d / 2, y: 0 }),
          end: constant({ x: d / 2, y: 0 }),
          opacity: constant(1),
        },
      },
    }
    nodes[mid] = {
      ...node(mid, PX, PY, { rotation: pass(`${mid}.turn`, a0, a1, start, travel) }),
      type: "group",
      children: [`${mid}.body`],
    }
    children.push(mid)
  }
  nodes[id] = { ...node(id), type: "group", children }
  return id
}

/** One satellite with an ember beacon: the frame's second, smallest warm
 * point, blinking twice a second on the low orbit. */
function beacon(nodes: Nodes, radius: number): string {
  const blink: Key<Color>[] = []
  const period = at(0.5)
  for (let t = 0; t < END; t += period) blink.push([t, heat(0.7), "hold"], [t + 2 * FR, heat(0), "hold"])
  blink.push([END, heat(0.7)])
  nodes["sat.body"] = {
    ...node("sat.body"),
    type: "path",
    path: constant({ contours: [rect(-2 * C, -C / 2, 4 * C, C), rect(-C / 2, -C, C, 2 * C)] }),
    style: { fill: fill(tone(0.55)) },
  }
  nodes["sat.light"] = {
    ...node("sat.light", 0, -2 * C),
    type: "rect",
    size: constant({ width: C, height: C }),
    cornerRadius: constant(0),
    style: { fill: { color: keyed("sat.light.tone", blink), opacity: constant(1) } },
  }
  nodes.sat = { ...node("sat", 0, -radius), type: "group", children: ["sat.body", "sat.light"] }
  // Rises over the left edge, crosses, and sets past the right one.
  const [a0, a1] = crossing(radius)
  nodes["sat.orbit"] = {
    ...node("sat.orbit", PX, PY, { rotation: pass("sat.turn", a0, a1, at(1.4), at(10)) }),
    type: "group",
    children: ["sat"],
  }
  return "sat.orbit"
}

/** One meteor: a streak drawn on and off along a falling diagonal. */
function meteor(nodes: Nodes): string {
  const t0 = at(7.2)
  const len = at(0.7)
  nodes.meteor = {
    ...node("meteor"),
    inTick: t0,
    outTick: t0 + len,
    type: "path",
    path: constant({
      contours: [
        { closed: false, vertices: [v(W * 0.5, 3 * C), v(W * 0.5 + 16 * C, 7 * C), v(W * 0.5 + 32 * C, 11 * C)] },
      ],
    }),
    style: { stroke: stroke(tone(0.95), C, { cap: "butt" }) },
    operators: [
      trim("meteor.trim", {
        start: keyed("meteor.start", [
          [t0 + at(0.2), 0, OUT],
          [t0 + len, 1],
        ]),
        end: keyed("meteor.end", [
          [t0, 0, OUT],
          [t0 + at(0.4), 1],
        ]),
      }),
    ],
  }
  return "meteor"
}

export function dawnFilm() {
  const nodes: Nodes = {}
  const sky = stars(nodes)
  const ground = planet(nodes)
  const high = moons(nodes, "moons.high", 0x5eed, 5, [22, 30], [3, 5])
  const low = moons(nodes, "moons.low", 0x0b17, 4, [10, 15], [4, 6])
  const sat = beacon(nodes, R + 17 * C)
  const scene: string[] = [sky, meteor(nodes), high, ...ground, ...aurora(nodes), low, sat, ...sun(nodes)]
  return pixelFilm({
    id: "dawn",
    name: "dither-ui dawn",
    width: W,
    height: H,
    end: END,
    nodes,
    scene,
    cell: C,
    markers: [marker("still", 0)],
    loupe: 9 * C,
    // The sky parts by depth under the cursor and the sun leans after it,
    // slow, the way attention trails; it swells while the page's `glow`
    // input is up (a hand on the close's keys).
    interaction: [
      parallaxLayersMacro({ nodeIds: [sky, high, low, sat], span: 900, reach: 3 * C }),
      cursorFollowMacro({ nodeId: "flare", span: 700, reach: 2 * C, stiffness: 120, damping: 16 }),
      cursorFollowMacro({ nodeId: "core", span: 700, reach: 2 * C, stiffness: 120, damping: 16 }),
      { input: { id: "input-glow", name: "glow", kind: "number", defaultValue: 0, minimum: 0, maximum: 1 } },
      swell("flare", 1.6, "x"),
      swell("core", 1.3),
    ],
  })
}

/** The sun grows toward `peak` times its size as `glow` rises, on a slow
 * spring: the flare along the limb, the core all round. */
function swell(nodeId: string, peak: number, axis?: "x"): Binding {
  return {
    id: `${nodeId}.swell`,
    name: `${nodeId} swells with the glow input`,
    target: { kind: "node-property", nodeId, property: "scale", ...(axis ? { axis } : {}) },
    blend: "multiply",
    steps: [
      { id: "glow", op: "input", input: "glow" },
      { id: "size", op: "map-range", inputMinimum: 0, inputMaximum: 1, outputMinimum: 1, outputMaximum: peak },
      { id: "eased", op: "spring", stiffness: 90, damping: 14 },
    ],
  }
}
