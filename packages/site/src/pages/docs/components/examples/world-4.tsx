import { createSignal, onCleanup, onMount } from "solid-js"
import { DitherReveal, DitherWorld } from "@dither-kit"

// A whale of our own, built here as a VRML97 file: a body lofted from the
// shape table below, cut into segments hinged one inside the next, curled at
// rest and swum by a wave that grows toward the tail. Flippers and flukes
// are flattened spheres, so nothing on it ends in a point.

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
/** Where the segments meet, their curl at rest and how far a stroke swings them. */
const JOINTS = [0, 0.3, 0.5, 0.66, 0.8, 0.9, 1]
const CURL = [0, -0.1, -0.16, -0.22, -0.26, -0.3]
const SWING = [0.03, 0.05, 0.08, 0.12, 0.18, 0.26]
const LENGTH = 2.2
const SIDES = 24
const STROKE_S = 1.8
const WANDER_S = 12
const EMBER = "1 0.42 0.17"
const CREAM = "0.96 0.9 0.82"

const n = (v: number) => String(+v.toFixed(3))
const along = (s: number) => LENGTH / 2 - s * LENGTH
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
const look = (rgb: string) => `appearance Appearance { material Material { diffuseColor ${rgb} } }`

/** The body from `a` to `b` around the joint at `a`: an ellipse every 2% of
 * the length, a domed end where the body ends, a cream belly by face colour. */
function body(a: number, b: number) {
  const rings: [x: number, h: number, w: number][] = []
  const dome = (s: number, toward: number) => {
    const [h, w] = size(s)
    for (const q of [0.6, 0.85, 0.97]) {
      const r = Math.sqrt(1 - q * q)
      rings.push([along(s) + toward * q * h * 0.9 - along(a), h * r, w * r])
    }
  }
  if (a === 0) dome(0, 1)
  rings.reverse()
  for (let s = Math.max(0, a - 0.01); s <= Math.min(1, b + 0.01) + 1e-9; s += 0.02) {
    const [h, w] = size(s)
    rings.push([along(s) - along(a), h, w])
  }
  if (b === 1) dome(1, -1)
  const points: string[] = []
  for (const [x, h, w] of rings)
    for (let k = 0; k < SIDES; k++) {
      const t = (k / SIDES) * Math.PI * 2
      const y = Math.sin(t) * h * (Math.sin(t) < 0 ? 0.85 : 1)
      points.push(`${n(x)} ${n(y)} ${n(Math.cos(t) * w)}`)
    }
  const faces: string[] = []
  const tint: number[] = []
  for (let r = 0; r + 1 < rings.length; r++)
    for (let k = 0; k < SIDES; k++) {
      const p = r * SIDES + k
      const q = r * SIDES + ((k + 1) % SIDES)
      faces.push(`${p} ${q} ${q + SIDES} ${p + SIDES} -1`)
      tint.push(Math.sin(((k + 0.5) / SIDES) * Math.PI * 2) < -0.5 ? 1 : 0)
    }
  // the domes close on their last ring
  const close = (r: number, flip: boolean) => {
    const ring = Array.from({ length: SIDES }, (_, k) => r * SIDES + k)
    faces.push(`${(flip ? ring.reverse() : ring).join(" ")} -1`)
    tint.push(0)
  }
  if (a === 0) close(0, true)
  if (b === 1) close(rings.length - 1, false)
  return `Shape { ${look(EMBER)} geometry IndexedFaceSet { coord Coordinate { point [${points.join(", ")}] } coordIndex [${faces.join(" ")}] color Color { color [${EMBER}, ${CREAM}] } colorPerVertex FALSE colorIndex [${tint.join(" ")}] } }`
}

/** A flattened sphere: a flipper or a fluke, rounded all round. */
const paddle = (rgb: string, at: number[], turn: number[], scale: number[]) =>
  `Transform { translation ${at.map(n).join(" ")} rotation ${turn.map(n).join(" ")} scale ${scale.map(n).join(" ")} children Shape { ${look(rgb)} geometry Sphere { radius 1 } } }`

/** What rides on a segment besides its body: the flippers on the second,
 * the flukes on the last. */
function riders(k: number) {
  if (k === 1)
    return [1, -1].map((side) =>
      paddle(
        CREAM,
        [along(0.4) - along(JOINTS[1]), -0.26, side * 0.32],
        [1, 0, side * 0.6, side * 0.7],
        [0.24, 0.035, 0.1],
      ),
    )
  if (k === JOINTS.length - 2)
    return [1, -1].map((side) =>
      paddle(EMBER, [along(1) - along(JOINTS[k]) - 0.1, 0, side * 0.17], [0, 1, 0, side * 0.5], [0.24, 0.03, 0.13]),
    )
  return []
}

const KEYS = Array.from({ length: 9 }, (_, i) => i / 8)

function segment(k: number): string {
  const inner = k + 2 < JOINTS.length ? segment(k + 1) : ""
  const at = k === 0 ? 0 : along(JOINTS[k]) - along(JOINTS[k - 1])
  return `DEF SEG${k} Transform { translation ${n(at)} 0 0 children [
${[body(JOINTS[k], JOINTS[k + 1]), ...riders(k), inner].filter(Boolean).join("\n")}
] }`
}

const wave = (k: number) =>
  KEYS.map((f) => `0 0 1 ${n(CURL[k] + SWING[k] * Math.sin(Math.PI * 2 * (f - 0.13 * k)))}`).join(", ")
const WANDER = Array.from({ length: 13 }, (_, i) => i / 12)

export const WHALE = `#VRML V2.0 utf8
DirectionalLight { direction -0.3 0.5 -0.8 intensity 0.5 }
DEF DRIFT Transform { children DEF WHALE Transform { children ${segment(0)} } }
DEF STROKE TimeSensor { cycleInterval ${STROKE_S} loop TRUE }
DEF ROAM TimeSensor { cycleInterval ${WANDER_S} loop TRUE }
DEF BOB PositionInterpolator { key [${KEYS.join(" ")}] keyValue [${KEYS.map((f) => `0 ${n(0.04 * Math.sin(Math.PI * 2 * (f + 0.25)))} 0`).join(", ")}] }
DEF PATH PositionInterpolator { key [${WANDER.join(" ")}] keyValue [${WANDER.map((f) => `${n(0.35 * Math.sin(Math.PI * 2 * f))} ${n(0.22 * Math.sin(Math.PI * 4 * f))} 0`).join(", ")}] }
DEF ROLL OrientationInterpolator { key [${WANDER.join(" ")}] keyValue [${WANDER.map((f) => `1 0 0 ${n(0.35 * Math.sin(Math.PI * 2 * f))}`).join(", ")}] }
ROUTE STROKE.fraction_changed TO BOB.set_fraction
ROUTE BOB.value_changed TO WHALE.set_translation
ROUTE ROAM.fraction_changed TO PATH.set_fraction
ROUTE PATH.value_changed TO DRIFT.set_translation
ROUTE ROAM.fraction_changed TO ROLL.set_fraction
ROUTE ROLL.value_changed TO DRIFT.set_rotation
${CURL.map(
  (_, k) => `DEF WAVE${k} OrientationInterpolator { key [${KEYS.join(" ")}] keyValue [${wave(k)}] }
ROUTE STROKE.fraction_changed TO WAVE${k}.set_fraction
ROUTE WAVE${k}.value_changed TO SEG${k}.set_rotation`,
).join("\n")}
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
