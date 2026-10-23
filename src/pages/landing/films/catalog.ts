// Node-side only — see kit-dither.ts. The catalog film, the hub band's
// floor: the docs catalog as a night skyline (`catalogLayout` — one 2×2
// window per docs section, a tower per family, the same lattice as the
// plate, so the plate is its still cell for cell). The city is awake:
// windows switch on and off, a beam sweeps the towers, motes rise off the
// roofs, the tallest tower's beacon breathes, and a new section falls out
// of the sky onto the tallest roof, lands with a spark, cools to a lit
// window and later goes dark. Rendered on the greys with one ember. Verb:
// arrive. Geometry: windows on a grid.
import {
  base,
  constant,
  fill,
  keyed,
  marker,
  parallaxLayersMacro,
  type Color,
  type InteractionContribution,
  type Key,
  type PathContour,
  type Vec3,
} from "@clayzo/animation/authoring"
import { mulberry32 } from "@dither-kit"
import { FAMILIES, SHELVES } from "../hub"
import { catalogLayout, GREY, windowTone } from "../plates"
import { at, cycle, FR, mixColor, mixVec3, MOVE, OUT, pixelFilm, POP, rect, SETTLE, wave, type Nodes } from "./frame"
import { heat, tone } from "./kit-dither"

const C = 8
const L = catalogLayout(FAMILIES.map((f) => f.count))
const W = L.w * C
const H = L.h * C
const END = at(9.6)
/** The film's seeded scatter, restarted on every build so a build is
 * deterministic. */
let RAND = mulberry32(0xca7a)

const node = (id: string, x = 0, y = 0) => base(id, { outTick: END, x, y })
const win = (x: number, y: number) => rect(x * C, y * C, 2 * C, 2 * C)
const v3 = (x: number, y: number): Vec3 => ({ x, y, z: 0 })

/** The skyline: the floor, then a group per tower (so a tower rises as
 * one): its steady windows by tone, its flickering ones (about one in six,
 * each on its own seeded beats), the beam crossing its glass, and on the
 * tallest the ember cap, the mast and the new section's arrival. The
 * tallest draws last, so its sparks land over its neighbours. */
function skyline(nodes: Nodes): string {
  nodes.floor = {
    ...node("floor"),
    type: "path",
    path: constant({ contours: [rect(0, (L.floor + 1) * C, W, C)] }),
    style: { fill: fill(tone(1 / 3)) },
  }
  const towers = L.towers.map(() => ({ steady: new Map<number, PathContour[]>(), flicker: [] as string[] }))
  const cap: PathContour[] = []
  L.windows.forEach((w, i) => {
    const t = windowTone(w, L.rows)
    const { steady, flicker } = towers[w.tower]
    if (w.top && w.tower === L.tallest) return void cap.push(win(w.x, w.y))
    if (w.top || RAND() > 0.17) {
      steady.set(t, [...(steady.get(t) ?? []), win(w.x, w.y)])
      return
    }
    // A flicker: the light goes out (or up) a few times a loop.
    const keys: Key<Color>[] = [[0, tone(t), "hold"]]
    const beats = 1 + Math.floor(RAND() * 3)
    for (let k = 0; k < beats; k++) {
      const on = Math.round(((k + 0.1 + RAND() * 0.6) * END) / beats / FR) * FR
      const off = on + at(0.4 + RAND() * 1.4)
      if (off >= END || on <= keys[keys.length - 1][0]) continue
      keys.push([on, tone(RAND() < 0.55 ? 0.06 : 0.82), "hold"], [off, tone(t), "hold"])
    }
    keys.push([END, tone(t)])
    const id = `win${i}`
    nodes[id] = {
      ...node(id),
      type: "path",
      path: constant({ contours: [win(w.x, w.y)] }),
      style: { fill: { color: keyed(`${id}.tone`, keys), opacity: constant(1) } },
    }
    flicker.push(id)
  })
  const ids = towers.map(({ steady, flicker }, i) => {
    const lit = [...steady.entries()].map(([t, contours], k) => {
      const id = `t${i}.lit${k}`
      nodes[id] = { ...node(id), type: "path", path: constant({ contours }), style: { fill: fill(tone(t)) } }
      return id
    })
    const id = `tower${i}`
    const crown = i === L.tallest ? [...beacon(nodes, cap), beam(nodes, i), ...arrival(nodes)] : [beam(nodes, i)]
    nodes[id] = { ...node(id), type: "group", children: [...lit, ...flicker, ...crown] }
    return id
  })
  nodes.skyline = {
    ...node("skyline"),
    type: "group",
    children: ["floor", ...ids.filter((_, i) => i !== L.tallest), ids[L.tallest], ...zones(nodes)],
  }
  return "skyline"
}

/** The pointer's targets: an undrawn column per tower that stays put while
 * its tower rises (a target that rose with it would slip out from under
 * the pointer), from the floor to clear above the roof, halfway into the
 * gap on each side, so the columns tile the skyline. */
function zones(nodes: Nodes): string[] {
  return L.towers.map((t, i) => {
    const roof = Math.min(...L.windows.filter((w) => w.tower === i).map((w) => w.y)) - (i === L.tallest ? 5 : 0)
    const id = `t${i}.zone`
    nodes[id] = {
      ...node(id),
      type: "path",
      path: constant({
        contours: [rect((t.x - 1.5) * C, (roof - 3) * C, (t.w * 3 + 2) * C, (L.floor + 5 - roof) * C)],
      }),
      style: { fill: { color: constant(tone(1)), opacity: constant(0) } },
    }
    return id
  })
}

/** The tallest tower's crown: the cap breathes; the mast over it blinks. */
function beacon(nodes: Nodes, cap: PathContour[]): string[] {
  nodes.cap = {
    ...node("cap"),
    type: "path",
    path: constant({ contours: cap }),
    style: { fill: { color: wave("cap.tone", END, 4, heat(0.42), heat(0.9)), opacity: constant(1) } },
  }
  const top = Math.min(...L.windows.filter((w) => w.tower === L.tallest).map((w) => w.y))
  const t = L.towers[L.tallest]
  const mx = t.x + Math.floor((t.w * 3 - 1) / 2)
  nodes.mast = {
    ...node("mast"),
    type: "path",
    path: constant({ contours: [rect(mx * C, (top - 4) * C, C, 3 * C)] }),
    style: { fill: fill(tone(0.5)) },
  }
  const blink: Key<Color>[] = []
  for (let k = 0; k < END; k += at(1.2)) blink.push([k, heat(0.8), "hold"], [k + at(0.2), heat(0), "hold"])
  blink.push([END, heat(0.8)])
  nodes.light = {
    ...node("light"),
    type: "path",
    path: constant({ contours: [rect(mx * C, (top - 5) * C, C, C)] }),
    style: { fill: { color: keyed("light.tone", blink), opacity: constant(1) } },
  }
  return ["cap", "mast", "light"]
}

/** The beam over one tower: a soft vertical band crossing the skyline once
 * a loop, clipped to that tower's windows so only its lit glass catches it
 * and the light rises with the tower. */
function beam(nodes: Nodes, tower: number): string {
  const id = `t${tower}.beam`
  nodes[`${id}.clip`] = {
    ...node(`${id}.clip`),
    type: "path",
    path: constant({ contours: L.windows.filter((w) => w.tower === tower).map((w) => win(w.x, w.y)) }),
    // A clip is never drawn; its fill only satisfies the schema.
    style: { fill: fill(tone(1)) },
  }
  const span = 14 * C
  nodes[`${id}.band`] = {
    ...base(`${id}.band`, {
      outTick: END,
      blendMode: "lighten",
      position: keyed(`${id}.position`, [
        [0, v3(-span, H / 2), "hold"],
        [at(0.8), v3(-span, H / 2), MOVE],
        [at(3.6), v3(W + span, H / 2)],
      ]),
    }),
    type: "rect",
    size: constant({ width: span, height: H }),
    cornerRadius: constant(0),
    style: {
      gradientFill: {
        kind: "linear",
        stops: constant([
          { position: 0, color: tone(0) },
          { position: 0.55, color: tone(0.98) },
          { position: 1, color: tone(0) },
        ]),
        start: constant({ x: -span / 2, y: 0 }),
        end: constant({ x: span / 2, y: 0 }),
        opacity: constant(1),
      },
    },
  }
  nodes[id] = { ...node(id), type: "group", children: [`${id}.band`], clipPathId: `${id}.clip` }
  return id
}

/** One rising mote: a cell that leaves a roof, drifts up and dithers out,
 * on a period that divides the loop. */
function mote(
  nodes: Nodes,
  id: string,
  from: Vec3,
  to: Vec3,
  color: (t: number) => Color,
  run: { period: number; offset: number; life: number },
) {
  nodes[id] = {
    ...base(id, { outTick: END, position: cycle(`${id}.position`, END, run, from, to, mixVec3) }),
    type: "rect",
    size: constant({ width: C, height: C }),
    cornerRadius: constant(0),
    style: { fill: { color: cycle(`${id}.tone`, END, run, color(0.9), color(0), mixColor), opacity: constant(1) } },
  }
  return id
}

/** Motes off the roofs: seeded towers, columns, heights and periods; one in
 * five is an ember. */
function motes(nodes: Nodes): string {
  const roofs = L.towers.map((t, i) => ({ t, y: Math.min(...L.windows.filter((w) => w.tower === i).map((w) => w.y)) }))
  const children: string[] = []
  for (let i = 0; i < 26; i++) {
    const { t, y } = roofs[Math.floor(RAND() * roofs.length)]
    const x = (t.x + Math.floor(RAND() * (t.w * 3 - 1)) + 0.5) * C
    const rise = (6 + Math.floor(RAND() * 9)) * C
    const drift = (Math.floor(RAND() * 5) - 2) * C
    const period = END / (1 + Math.floor(RAND() * 3))
    const life = Math.min(period - FR, at(1.4 + RAND() * 1.8))
    const offset = Math.round((RAND() * period) / FR) * FR
    const hot = RAND() < 0.2
    children.push(
      mote(nodes, `mote${i}`, v3(x, (y - 0.5) * C), v3(x + drift, (y - 0.5) * C - rise), hot ? heat : tone, {
        period,
        offset,
        life,
      }),
    )
  }
  nodes.motes = { ...node("motes"), type: "group", children }
  return "motes"
}

/** A new section: an ember cell falls onto the tallest roof's next free
 * slot, squashes, throws four sparks, cools to a lit window, and much later
 * goes dark again so the loop closes on the plate. */
function arrival(nodes: Nodes): string[] {
  const t = L.towers[L.tallest]
  const k = t.n
  const row = Math.floor(k / t.w)
  // The slot's bottom centre (the cell squashes about it) and its centre.
  const sx = (t.x + (k % t.w) * 3 + 1) * C
  const sy = (L.floor - (row + 1) * 3 + 3) * C
  const cy = sy - C
  const FALL = at(1.4)
  const LAND = at(2.1)
  const DARK = at(8.4)
  nodes.cell = {
    ...base("cell", {
      outTick: END,
      position: keyed("cell.position", [
        [FALL, v3(sx, -2 * C), { x1: 0.55, y1: 0, x2: 1, y2: 0.6 }],
        [LAND, v3(sx, sy)],
      ]),
      anchor: { x: 0, y: C },
      scale: keyed("cell.scale", [
        [LAND - FR, { x: 0.8, y: 1.3, z: 1 }, "hold"],
        [LAND, { x: 1.35, y: 0.7, z: 1 }, POP],
        [LAND + at(0.35), { x: 1, y: 1, z: 1 }],
      ]),
    }),
    inTick: FALL,
    type: "rect",
    size: constant({ width: 2 * C, height: 2 * C }),
    cornerRadius: constant(0),
    style: {
      fill: {
        color: keyed("cell.tone", [
          [FALL, heat(1), "hold"],
          [LAND, heat(0.85), SETTLE],
          [LAND + at(1.6), tone(0.86), "hold"],
          [DARK, tone(0.86), MOVE],
          [DARK + at(0.6), tone(0)],
        ]),
        opacity: constant(1),
      },
    },
  }
  // The fall's trail: three cells behind it, dimmer each, gone on landing.
  const trail = [0.62, 0.4, 0.22].map((k, i) => {
    const id = `trail${i}`
    nodes[id] = {
      ...base(id, {
        outTick: LAND,
        position: keyed(`${id}.position`, [
          [FALL, v3(sx, -3 * C - (i + 1) * 2 * C), { x1: 0.55, y1: 0, x2: 1, y2: 0.6 }],
          [LAND, v3(sx, cy - (i + 1) * 2 * C)],
        ]),
      }),
      inTick: FALL,
      type: "rect",
      size: constant({ width: 2 * C, height: 2 * C }),
      cornerRadius: constant(0),
      style: { fill: fill(heat(k)) },
    }
    return id
  })
  const sparks = [
    [-5, -3],
    [-3, -5],
    [3, -5],
    [5, -3],
  ].map(([dx, dy], i) => {
    const id = `spark${i}`
    nodes[id] = {
      ...base(id, {
        outTick: LAND + at(0.7),
        position: keyed(`${id}.position`, [
          [LAND, v3(sx - C / 2, cy - C / 2), OUT],
          [LAND + at(0.7), v3(sx - C / 2 + dx * C, cy - C / 2 + dy * C)],
        ]),
      }),
      inTick: LAND,
      type: "rect",
      size: constant({ width: C, height: C }),
      cornerRadius: constant(0),
      style: {
        fill: {
          color: keyed(`${id}.tone`, [
            [LAND, heat(0.95), OUT],
            [LAND + at(0.7), heat(0)],
          ]),
          opacity: constant(1),
        },
      },
    }
    return id
  })
  return [...trail, "cell", ...sparks]
}

export function catalogFilm() {
  RAND = mulberry32(0xca7a)
  const nodes: Nodes = {}
  const city = skyline(nodes)
  const scene = [motes(nodes), city]
  return pixelFilm({
    id: "catalog",
    name: "dither-ui catalog",
    width: W,
    height: H,
    end: END,
    nodes,
    scene,
    cell: C,
    cool: GREY,
    markers: [marker("still", 0), marker("arrive", at(2.1))],
    loupe: 10 * C,
    interaction: [parallaxLayersMacro({ nodeIds: ["motes"], span: 900, reach: 2 * C }), ...rise()],
  })
}

/** A tower rises three cells while the pointer is over it, or while the
 * page's `family` input names it (the directory's picked tab, by family
 * index; -1 for none). Its hit area is `tower<i>-hit`, the page's cue that
 * a click picks that family; a family with a shelf shows the pointer. */
const SHELVED = new Set<string>(SHELVES.map((s) => s.label))

function rise(): InteractionContribution[] {
  const input: InteractionContribution = {
    input: { id: "input-family", name: "family", kind: "number", defaultValue: -1, minimum: -1 },
  }
  return [
    input,
    ...L.towers.flatMap((_, i): InteractionContribution[] => [
      {
        hitArea: {
          id: `tower${i}-hit`,
          nodeId: `t${i}.zone`,
          shape: "bounds",
          // Only a family with a shelf below answers a click.
          ...(SHELVED.has(FAMILIES[i].title) ? { cursor: "pointer" } : {}),
        },
      },
      {
        id: `tower${i}.rise`,
        name: `tower ${i} rises while hovered or picked`,
        target: { kind: "node-property", nodeId: `tower${i}`, property: "position", axis: "y" },
        blend: "add",
        steps: [
          { id: "over", op: "pointer-over", hitAreaId: `tower${i}-hit` },
          { id: "family", op: "input", input: "family" },
          { id: "picked", op: "compare", operation: "equal", operand: i },
          { id: "up", op: "constant", value: -3 * C },
          { id: "rest", op: "constant", value: 0 },
          { id: "chosen", op: "select", inputs: ["picked", "up", "rest"] },
          { id: "goal", op: "select", inputs: ["over", "up", "chosen"] },
          { id: "eased", op: "spring", stiffness: 300, damping: 24 },
        ],
      },
    ]),
  ]
}
