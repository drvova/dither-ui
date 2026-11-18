// The World section's whale: a whale of our own (never another product's
// mark or mascot), written as a VRML97 file the kit reads like any other.
// A blunt head tapering to the tail stock, two eyes, two pectoral fins
// and broad flukes, built as a chain of segments, each hinged at its front
// joint inside the one before, so a wave that grows toward the tail bends the
// body as it swims (one TimeSensor, an OrientationInterpolator a segment,
// each a little later than the last). The example (`examples/world-4.tsx`)
// carries this file as written and cuts between poses through the kit's own
// dissolve. Guarded by `tests/whale.spec.ts`.

/** Seconds of one stroke of the tail. */
export const STROKE_S = 1.8

/** Half height and half width of the body along it, nose (0) to tail (1). */
const PROFILE: [s: number, h: number, w: number][] = [
  [0, 0.24, 0.2],
  [0.01, 0.32, 0.26],
  [0.03, 0.39, 0.31],
  [0.06, 0.44, 0.35],
  [0.1, 0.47, 0.38],
  [0.15, 0.49, 0.39],
  [0.28, 0.47, 0.37],
  [0.42, 0.39, 0.31],
  [0.56, 0.3, 0.24],
  [0.7, 0.2, 0.16],
  [0.82, 0.12, 0.1],
  [0.92, 0.07, 0.07],
  [1, 0.05, 0.05],
]
/** Where the segments meet, nose to tail; how far each is curled at rest
 * (the tail turned up, the body a crescent) and how far the stroke swings
 * it, in radians. */
const JOINTS = [0, 0.3, 0.5, 0.66, 0.8, 0.9, 1]
const CURL = [0, -0.1, -0.16, -0.22, -0.26, -0.3]
const BEND = [0.03, 0.05, 0.08, 0.12, 0.18, 0.26]
const LENGTH = 2.2
const SIDES = 16

const x = (s: number) => LENGTH / 2 - s * LENGTH
/** The body's half sizes at `s`, between the profile's stations. */
function size(s: number): [number, number] {
  const k = Math.max(
    1,
    PROFILE.findIndex(([at]) => at >= s),
  )
  const [s0, h0, w0] = PROFILE[k - 1]
  const [s1, h1, w1] = PROFILE[k]
  const f = s1 > s0 ? (s - s0) / (s1 - s0) : 0
  return [h0 + (h1 - h0) * f, w0 + (w1 - w0) * f]
}

const f3 = (n: number) => n.toFixed(3)
const f2 = (n: number) => String(+n.toFixed(2))
const material = (rgb: string) => `Appearance { material Material { diffuseColor ${rgb} } }`
const EMBER = material("1 0.42 0.17")
const DARK = material("0.12 0.13 0.14")
const CREAM = material("0.96 0.9 0.82")

/** The body between `a` and `b` (fractions nose to tail), in the frame of
 * the joint at `origin`: rings of an ellipse, the belly a little flatter,
 * capped where the body ends. */
function body(a: number, b: number, origin: number): string {
  const stations: number[] = []
  for (const [s] of PROFILE) if (s > a && s < b) stations.push(s)
  // a little past the joint, so a bend opens no gap
  const rings = [Math.max(0, a - 0.015), ...stations, Math.min(1, b + 0.015)]
  const points: string[] = []
  for (const s of rings) {
    const [h, w] = size(s)
    for (let k = 0; k < SIDES; k++) {
      const t = (k / SIDES) * Math.PI * 2
      const y = Math.sin(t) * h * (Math.sin(t) < 0 ? 0.85 : 1)
      points.push(`${f2(x(s) - x(origin))} ${f2(y)} ${f2(Math.cos(t) * w)}`)
    }
  }
  const faces: string[] = []
  // a face's colour: the cream belly under the body, ember over it
  const tint: number[] = []
  for (let r = 0; r + 1 < rings.length; r++)
    for (let k = 0; k < SIDES; k++) {
      const a0 = r * SIDES + k
      const a1 = r * SIDES + ((k + 1) % SIDES)
      faces.push(`${a0} ${a1} ${a1 + SIDES} ${a0 + SIDES} -1`)
      tint.push(Math.sin(((k + 0.5) / SIDES) * Math.PI * 2) < -0.5 ? 1 : 0)
    }
  // the nose and the tail stock close
  const cap = (ring: number, tip: number) => {
    const at = points.length
    const [h] = size(rings[ring])
    points.push(`${f2(x(rings[ring]) - x(origin) + tip * h * 0.35)} ${f2(tip > 0 ? -0.04 : 0)} 0`)
    for (let k = 0; k < SIDES; k++) {
      const p = ring * SIDES + k
      const q = ring * SIDES + ((k + 1) % SIDES)
      faces.push(tip > 0 ? `${q} ${p} ${at} -1` : `${p} ${q} ${at} -1`)
      tint.push(0)
    }
  }
  if (a === 0) cap(0, 1)
  if (b === 1) cap(rings.length - 1, -1)
  return `Shape { appearance ${EMBER} geometry IndexedFaceSet { coord Coordinate { point [${points.join(", ")}] } coordIndex [${faces.join(" ")}] color Color { color [1 0.42 0.17, 0.96 0.9 0.82] } colorPerVertex FALSE colorIndex [${tint.join(" ")}] } }`
}

/** A flat blade, seen from both sides: a fin or a fluke's lobe. */
const blade = (look: string, points: number[][]) =>
  `Shape { appearance ${look} geometry IndexedFaceSet { solid FALSE coord Coordinate { point [${points.map((p) => p.map(f3).join(" ")).join(", ")}] } coordIndex [${points.map((_, k) => k).join(" ")} -1] } }`

/** What rides on each segment besides its body. */
function extras(k: number): string[] {
  if (k === 0)
    return [1, -1].map(
      (side) =>
        `Transform { translation ${f3(x(0.2) - x(0))} -0.05 ${f3(side * 0.31)} children Shape { appearance ${DARK} geometry Sphere { radius 0.035 } } }`,
    )
  if (k === 1) {
    const root = x(0.34) - x(JOINTS[1])
    return [1, -1].map((side) =>
      blade(CREAM, [
        [root, -0.24, side * 0.28],
        [root - 0.3, -0.48, side * 0.5],
        [root - 0.42, -0.52, side * 0.46],
        [root - 0.22, -0.3, side * 0.27],
      ]),
    )
  }
  if (k === BEND.length - 1) {
    const end = x(1) - x(JOINTS[k])
    return [1, -1].map((side) =>
      blade(EMBER, [
        [end + 0.04, 0, side * 0.02],
        [end - 0.06, 0, side * 0.3],
        [end - 0.26, 0, side * 0.46],
        [end - 0.2, 0, side * 0.14],
        [end - 0.24, 0, 0],
      ]),
    )
  }
  return []
}

/** A segment's bend at each of the stroke's keys: a wave travelling to the tail. */
const KEYS = Array.from({ length: 9 }, (_, i) => i / 8)
const bendKeys = (k: number) =>
  KEYS.map((f) => `0 0 1 ${f3(CURL[k] + BEND[k] * Math.sin(Math.PI * 2 * (f - 0.13 * k)))}`).join(", ")

function segment(k: number): string {
  const from = JOINTS[k]
  const to = JOINTS[k + 1]
  const inner = k + 1 < BEND.length ? [segment(k + 1)] : []
  const at = k === 0 ? "0 0 0" : `${f3(x(from) - x(JOINTS[k - 1]))} 0 0`
  return `DEF SEG${k} Transform {
  translation ${at}
  children [
    ${[body(from, to, from), ...extras(k), ...inner].join("\n    ")}
  ]
}`
}

/** Seconds of one wander round the frame. */
export const WANDER_S = 12
const WANDER = Array.from({ length: 13 }, (_, i) => i / 12)

export const WHALE = `#VRML V2.0 utf8
DirectionalLight { direction -0.3 0.5 -0.8 intensity 0.5 }
DEF DRIFT Transform {
  children [
DEF WHALE Transform {
  children [
${segment(0)}
  ]
}
  ]
}
DEF STROKE TimeSensor { cycleInterval ${STROKE_S} loop TRUE }
DEF ROAM TimeSensor { cycleInterval ${WANDER_S} loop TRUE }
DEF BOB PositionInterpolator { key [${KEYS.join(" ")}] keyValue [${KEYS.map((f) => `0 ${f3(0.04 * Math.sin(Math.PI * 2 * (f + 0.25)))} 0`).join(", ")}] }
ROUTE STROKE.fraction_changed TO BOB.set_fraction
ROUTE BOB.value_changed TO WHALE.set_translation
DEF PATH PositionInterpolator { key [${WANDER.join(" ")}] keyValue [${WANDER.map((f) => `${f3(0.35 * Math.sin(Math.PI * 2 * f))} ${f3(0.22 * Math.sin(Math.PI * 4 * f))} 0`).join(", ")}] }
DEF ROLL OrientationInterpolator { key [${WANDER.join(" ")}] keyValue [${WANDER.map((f) => `1 0 0 ${f3(0.35 * Math.sin(Math.PI * 2 * f))}`).join(", ")}] }
ROUTE ROAM.fraction_changed TO PATH.set_fraction
ROUTE PATH.value_changed TO DRIFT.set_translation
ROUTE ROAM.fraction_changed TO ROLL.set_fraction
ROUTE ROLL.value_changed TO DRIFT.set_rotation
${BEND.map(
  (_, k) => `DEF WAVE${k} OrientationInterpolator { key [${KEYS.join(" ")}] keyValue [${bendKeys(k)}] }
ROUTE STROKE.fraction_changed TO WAVE${k}.set_fraction
ROUTE WAVE${k}.value_changed TO SEG${k}.set_rotation`,
).join("\n")}
`
