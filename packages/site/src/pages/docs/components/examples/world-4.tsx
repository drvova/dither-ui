import { createSignal, onCleanup, onMount } from "solid-js"
import { DitherReveal, DitherWorld } from "@dither-kit"

// A whale of our own, built here as a VRML97 file: ONE surface, the body
// lofted from the shape table below with its flippers and flukes, curled
// at rest. It swims by its points: a CoordinateInterpolator keys the whole
// surface as a wave runs down the spine, so the body bends with no joint
// anywhere, and `creaseAngle` shades it as one smooth skin.

/** Half height and half width of the body, nose (0) to tail (1). */
const PROFILE = [
  [0, 0.45, 0.36],
  [0.12, 0.5, 0.4],
  [0.28, 0.47, 0.37],
  [0.42, 0.39, 0.31],
  [0.56, 0.3, 0.24],
  [0.7, 0.2, 0.16],
  [0.82, 0.12, 0.1],
  [0.92, 0.075, 0.07],
  [1, 0.06, 0.055],
]
const LENGTH = 2.2
const SIDES = 20
/** The spine's turn at `s` (radians): curled up at rest, and a stroke's
 * swing that grows toward the tail and runs down it. */
const CURL = -1.05
const SWING = 0.55
const STROKE_S = 1.8
const WANDER_S = 12
const FRAMES = 13
const EMBER = "1 0.42 0.17"
const CREAM = "0.96 0.9 0.82"

const n = (v: number) => String(+v.toFixed(3))
/** The body's half sizes at `s`, between the table's rows. */
function size(s: number) {
  const k = Math.min(
    PROFILE.length - 1,
    Math.max(
      1,
      PROFILE.findIndex(([at]) => at >= s),
    ),
  )
  const [s0, h0, w0] = PROFILE[k - 1]
  const [s1, h1, w1] = PROFILE[k]
  const f = Math.max(0, Math.min(1, (s - s0) / (s1 - s0)))
  return [h0 + (h1 - h0) * f, w0 + (w1 - w0) * f]
}

/** A point of the whale as it is built: where along the spine it rides
 * (`s`), how far past that it stands along the body (`u`, toward the
 * tail), above the spine (`y`) and out to its side (`z`). */
type Point = { s: number; u: number; y: number; z: number }
const points: Point[] = []
const faces: number[][] = []
const tints: number[] = []

/** The body: an ellipse every 2.5% of its length between domed ends, the
 * belly a little flatter and cream. */
function body() {
  const rings: Point[] = []
  const dome = (s: number, toward: number) => {
    const [h, w] = size(s)
    const out: Point[] = []
    for (const q of [0.6, 0.85, 0.97]) {
      const r = Math.sqrt(1 - q * q)
      out.push({ s, u: toward * q * h * 0.9, y: h * r, z: w * r })
    }
    return out
  }
  rings.push(...dome(0, -1).reverse())
  for (let s = 0; s <= 1 + 1e-9; s += 0.025) {
    const [h, w] = size(s)
    rings.push({ s, u: 0, y: h, z: w })
  }
  rings.push(...dome(1, 1))
  const base = points.length
  for (const ring of rings)
    for (let k = 0; k < SIDES; k++) {
      const t = (k / SIDES) * Math.PI * 2
      points.push({
        s: ring.s,
        u: ring.u,
        y: Math.sin(t) * ring.y * (Math.sin(t) < 0 ? 0.85 : 1),
        z: Math.cos(t) * ring.z,
      })
    }
  for (let r = 0; r + 1 < rings.length; r++)
    for (let k = 0; k < SIDES; k++) {
      const p = base + r * SIDES + k
      const q = base + r * SIDES + ((k + 1) % SIDES)
      faces.push([p, p + SIDES, q + SIDES, q])
      tints.push(Math.sin(((k + 0.5) / SIDES) * Math.PI * 2) < -0.5 ? 1 : 0)
    }
  const ring = (r: number) => Array.from({ length: SIDES }, (_, k) => base + r * SIDES + k)
  faces.push(ring(0), ring(rings.length - 1).reverse())
  tints.push(0, 0)
}

/** A flattened ellipsoid riding the spine at `s`: a flipper or a fluke,
 * rounded all round. `axis` is its long direction (u, y, z), `radii` its
 * length, thickness and breadth. */
function paddle(s: number, at: number[], axis: number[], radii: number[], tint: number) {
  const len = Math.hypot(...axis)
  const a = axis.map((v) => v / len)
  // its thin axis as near the body's own up as the long one allows
  const up = [0, 1, 0]
  const dot = a[0] * up[0] + a[1] * up[1] + a[2] * up[2]
  const t0 = up.map((v, i) => v - dot * a[i])
  const tl = Math.hypot(...t0)
  const t = t0.map((v) => v / tl)
  const b = [a[1] * t[2] - a[2] * t[1], a[2] * t[0] - a[0] * t[2], a[0] * t[1] - a[1] * t[0]]
  const LAT = 6
  const LON = 10
  const base = points.length
  for (let i = 0; i <= LAT; i++) {
    const phi = (i / LAT) * Math.PI
    for (let j = 0; j < LON; j++) {
      const th = (j / LON) * Math.PI * 2
      const ca = Math.cos(phi) * radii[0]
      const ct = Math.sin(phi) * Math.cos(th) * radii[1]
      const cb = Math.sin(phi) * Math.sin(th) * radii[2]
      const v = [0, 1, 2].map((k) => at[k] + a[k] * ca + t[k] * ct + b[k] * cb)
      points.push({ s, u: v[0], y: v[1], z: v[2] })
    }
  }
  for (let i = 0; i < LAT; i++)
    for (let j = 0; j < LON; j++) {
      const p = base + i * LON + j
      const q = base + i * LON + ((j + 1) % LON)
      faces.push([p, q, q + LON, p + LON])
      tints.push(tint)
    }
}

body()
for (const side of [1, -1]) paddle(0.4, [0.1, -0.27, side * 0.32], [0.55, -0.35, side * 0.45], [0.24, 0.035, 0.1], 1)
// the flukes: one broad paddle across the tail, its ends swept back
paddle(1, [0.1, 0, 0], [0.25, 0, 1], [0.36, 0.03, 0.1], 0)

/** Every point at `f` of a stroke (0-1): the spine walked from the nose,
 * each point carried by the spine's place and turn where it rides. */
function frame(f: number): number[] {
  const STEPS = 200
  const at = [[0, 0]]
  const turn = [0]
  for (let i = 1; i <= STEPS; i++) {
    const s = i / STEPS
    const a = CURL * s * s + SWING * s * s * Math.sin(Math.PI * 2 * f - 4.2 * s)
    const [x, y] = at[i - 1]
    at.push([x - Math.cos(a) * (LENGTH / STEPS), y - Math.sin(a) * (LENGTH / STEPS)])
    turn.push(a)
  }
  const out: number[] = []
  for (const p of points) {
    const i = Math.round(p.s * STEPS)
    const [x, y] = at[i]
    const a = turn[i]
    // along the body toward the tail (tx, ty), and the body's up (ty, -tx)
    const tx = -Math.cos(a)
    const ty = -Math.sin(a)
    out.push(x + LENGTH / 2 + p.u * tx + p.y * ty, y + p.u * ty - p.y * tx, p.z)
  }
  return out.map(n).map(Number)
}

const KEYS = Array.from({ length: FRAMES }, (_, i) => i / (FRAMES - 1))
const SWIM = KEYS.map(frame)
const WANDER = Array.from({ length: 13 }, (_, i) => i / 12)
const triple = (v: number[]) => v.reduce((s, x, i) => s + (i % 3 ? " " : i ? ", " : "") + x, "")

export const WHALE = `#VRML V2.0 utf8
DirectionalLight { direction -0.3 0.5 -0.8 intensity 0.5 }
DEF DRIFT Transform { children DEF WHALE Transform { children Shape {
  appearance Appearance { material Material { diffuseColor ${EMBER} } }
  geometry IndexedFaceSet { creaseAngle 1.2
    coord DEF SKIN Coordinate { point [${triple(SWIM[0])}] }
    coordIndex [${faces.map((face) => `${face.join(" ")} -1`).join(" ")}]
    color Color { color [${EMBER}, ${CREAM}] } colorPerVertex FALSE colorIndex [${tints.join(" ")}] } } } }
DEF STROKE TimeSensor { cycleInterval ${STROKE_S} loop TRUE }
DEF SWIM CoordinateInterpolator { key [${KEYS.map(n).join(" ")}] keyValue [${SWIM.map(triple).join(", ")}] }
DEF ROAM TimeSensor { cycleInterval ${WANDER_S} loop TRUE }
DEF BOB PositionInterpolator { key [${KEYS.map(n).join(" ")}] keyValue [${KEYS.map((f) => `0 ${n(0.04 * Math.sin(Math.PI * 2 * (f + 0.25)))} 0`).join(", ")}] }
DEF PATH PositionInterpolator { key [${WANDER.map(n).join(" ")}] keyValue [${WANDER.map((f) => `${n(0.35 * Math.sin(Math.PI * 2 * f))} ${n(0.22 * Math.sin(Math.PI * 4 * f))} 0`).join(", ")}] }
DEF ROLL OrientationInterpolator { key [${WANDER.map(n).join(" ")}] keyValue [${WANDER.map((f) => `1 0 0 ${n(0.35 * Math.sin(Math.PI * 2 * f))}`).join(", ")}] }
ROUTE STROKE.fraction_changed TO SWIM.set_fraction
ROUTE SWIM.value_changed TO SKIN.set_point
ROUTE STROKE.fraction_changed TO BOB.set_fraction
ROUTE BOB.value_changed TO WHALE.set_translation
ROUTE ROAM.fraction_changed TO PATH.set_fraction
ROUTE PATH.value_changed TO DRIFT.set_translation
ROUTE ROAM.fraction_changed TO ROLL.set_fraction
ROUTE ROLL.value_changed TO DRIFT.set_rotation
`

/** The poses it cuts between. A cut breaks the whale into coarse blocks
 * that drift apart, changes the pose at the coarsest, and the new pose
 * prints back in block by block. */
const SHOTS = [
  { yaw: -25, pitch: 10 },
  { yaw: 160, pitch: -6 },
  { yaw: 70, pitch: 22 },
  { yaw: 200, pitch: 8 },
  { yaw: -60, pitch: -14 },
]
const BREAK = [
  { cell: 3, scatter: 0.05 },
  { cell: 6, scatter: 0.12 },
  { cell: 10, scatter: 0.2 },
  { cell: 1, scatter: 0 },
]
const HOLD_MS = 2600
const STEP_MS = 80

export default function Example() {
  const [shot, setShot] = createSignal(0)
  const [cut, setCut] = createSignal({ cell: 1, scatter: 0 })
  let box: HTMLDivElement | undefined
  let timers: number[] = []
  let seen = false
  const clear = () => {
    for (const t of timers) clearTimeout(t)
    timers = []
  }
  // one cut, then the next after the hold, while the card is on screen
  const next = () => {
    clear()
    if (!seen) return
    BREAK.forEach((step, i) =>
      timers.push(
        window.setTimeout(() => {
          setCut(step)
          if (i === BREAK.length - 1) setShot((s) => (s + 1) % SHOTS.length)
        }, i * STEP_MS),
      ),
    )
    timers.push(window.setTimeout(next, HOLD_MS + BREAK.length * STEP_MS))
  }
  onMount(() => {
    // under reduced motion it holds its first pose, still
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) return
    // the newest entry: a box sized late reports out of view, then in view
    const watch = new IntersectionObserver((entries) => {
      seen = entries[entries.length - 1].isIntersecting
      if (seen) timers.push(window.setTimeout(next, HOLD_MS))
      else clear()
    })
    if (box) watch.observe(box)
    onCleanup(() => {
      watch.disconnect()
      clear()
    })
  })

  return (
    <div ref={(el) => (box = el)} class="mx-auto max-w-md">
      <DitherReveal restartKey={shot()} cell={12} duration={0.5}>
        <DitherWorld
          source={WHALE}
          material
          animate
          yaw={SHOTS[shot()].yaw}
          pitch={SHOTS[shot()].pitch}
          autoRotate={5}
          zoom={1.4}
          fov={35}
          cell={cut().cell}
          scatter={cut().scatter}
          shade={0.15}
          color="orange"
          label="A whale swimming"
          class="h-[340px]"
        />
      </DitherReveal>
    </div>
  )
}
