// The 3D surface's default content (`world.ts`): seeded VRML97 text, parsed
// by `models.ts` like any file.

import { xorshift32 } from "./pixel"
import { hsvToRgb } from "./palette"

/** VRML97 text for a seeded probe: a body, a tilted ring, arms with tips
 * that the file itself revolves and an antenna it bobs (TimeSensor →
 * interpolators → ROUTEs) — a point in a form space, not a preset, written
 * as a real .wrl so the default content exercises the parser, the palette
 * and the clock. */
export function sampleWorld(seed = 0): string {
  const rand = xorshift32(Math.round(seed) || 0x2545f491)
  const pick = <T>(xs: T[]) => xs[Math.floor(rand() * xs.length)]
  const n = (v: number) => String(Math.round(v * 1000) / 1000)
  const tone = (h: number, s: number, v: number) =>
    hsvToRgb(((h % 360) + 360) % 360, s, v)
      .map((c) => n(c / 255))
      .join(" ")
  const hue = rand() * 360
  const body = pick(["sphere", "box", "cylinder"])
  const arms = 2 + Math.floor(rand() * 4)
  const reach = 1.3 + rand() * 1.1
  const tilt = (rand() - 0.5) * 1.3
  const ringR = 1.4 + rand() * 0.8
  const tip = pick(["cone", "sphere", "box"])
  const cycle = 4 + Math.round(rand() * 6)
  const segments = 24
  const ring: string[] = []
  const faces: string[] = []
  for (let j = 0; j < segments; j++) {
    const th = (2 * Math.PI * j) / segments
    ring.push(
      `${n(ringR * Math.cos(th))} 0 ${n(ringR * Math.sin(th))}`,
      `${n((ringR - 0.22) * Math.cos(th))} 0 ${n((ringR - 0.22) * Math.sin(th))}`,
    )
    const k = (j + 1) % segments
    faces.push(`${j * 2} ${k * 2} ${k * 2 + 1} ${j * 2 + 1} -1`)
  }
  const shape = (geometry: string, color: string) =>
    `Shape { appearance Appearance { material Material { diffuseColor ${color} } } geometry ${geometry} }`
  const bodyGeometry =
    body === "sphere"
      ? "Sphere { radius 1 }"
      : body === "box"
        ? "Box { size 1.6 1.6 1.6 }"
        : "Cylinder { radius 0.9 height 1.4 }"
  const tipGeometry =
    tip === "cone"
      ? "Cone { bottomRadius 0.22 height 0.5 }"
      : tip === "sphere"
        ? "Sphere { radius 0.24 }"
        : "Box { size 0.36 0.36 0.36 }"
  const ringShape = shape(
    `IndexedFaceSet { solid FALSE coord Coordinate { point [ ${ring.join(", ")} ] } coordIndex [ ${faces.join(" ")} ] }`,
    tone(hue + 40, 0.4, 0.8),
  )
  const top = body === "box" ? 1.1 : 1.2
  const lines = [
    "#VRML V2.0 utf8",
    `# dither-kit sample world, seed ${Math.round(seed)}`,
    `DEF Body Transform { children ${shape(bodyGeometry, tone(hue, 0.55, 0.95))} }`,
    `Transform { rotation 1 0 0 ${n(tilt)} children ${ringShape} }`,
    `DEF Arm Group { children [`,
    `  Transform { translation ${n(reach / 2)} 0 0 rotation 0 0 1 -1.5708 children ${shape(`Cylinder { radius 0.07 height ${n(reach)} }`, tone(hue + 180, 0.3, 0.7))} }`,
    `  Transform { translation ${n(reach)} 0 0 rotation 0 0 1 -1.5708 children ${shape(tipGeometry, tone(hue + 200, 0.6, 0.9))} }`,
    `] }`,
    `DEF Arms Transform { children [ USE Arm`,
  ]
  for (let a = 1; a < arms; a++)
    lines.push(`  Transform { rotation 0 1 0 ${n((2 * Math.PI * a) / arms)} children USE Arm }`)
  lines.push(
    `] }`,
    `DEF Antenna Transform { translation 0 ${n(top)} 0 children ${shape("Cone { bottomRadius 0.18 height 0.5 }", tone(hue + 20, 0.5, 1))} }`,
    `DEF Clock TimeSensor { cycleInterval ${cycle} loop TRUE }`,
    `DEF Spin OrientationInterpolator { key [ 0 0.5 1 ] keyValue [ 0 1 0 0, 0 1 0 3.14159, 0 1 0 6.28318 ] }`,
    `DEF Bob PositionInterpolator { key [ 0 0.5 1 ] keyValue [ 0 ${n(top)} 0, 0 ${n(top + 0.3)} 0, 0 ${n(top)} 0 ] }`,
    `ROUTE Clock.fraction_changed TO Spin.set_fraction`,
    `ROUTE Spin.value_changed TO Arms.set_rotation`,
    `ROUTE Clock.fraction_changed TO Bob.set_fraction`,
    `ROUTE Bob.value_changed TO Antenna.set_translation`,
  )
  return lines.join("\n") + "\n"
}
