// The World section's rocket: an atomic-age rocket of our own (no flag, no
// marking, no real vehicle), written as a VRML97 file the kit reads like
// any other. A chrome body, an ember nose and three swept fins, a band, a
// porthole and a nozzle, each its own piece; a flame that flickers under it
// by its own TimeSensor, a climb, and a fireball the file swells where it
// bursts. The page drives one clock (`launchAt`): the file's moment, and
// the build's scatter that blows the pieces apart as the fireball swells.
// Guarded by `tests/rocket.spec.ts`.

/** Seconds of the climb; the burst comes at its top. */
export const CLIMB_S = 2.4
/** Seconds from the key to the debris settling. */
export const LAUNCH_S = 4.6
/** Seconds the pieces take to fly apart. */
const BURST_S = 0.6

const material = (rgb: string, glow = false) =>
  `Appearance { material Material { diffuseColor ${rgb}${glow ? ` emissiveColor ${rgb}` : ""} } }`
const CHROME = material("0.83 0.86 0.88")
const EMBER = material("1 0.42 0.17")
const GRAPHITE = material("0.15 0.16 0.18")
const GLASS = material("0.35 0.55 0.75")
const FLAME = material("1 0.62 0.2", true)
const FIRE = material("1 0.62 0.25", true)

/** A fin, turned `angle` about the body, swept back. */
const fin = (angle: number) =>
  `Transform { rotation 0 1 0 ${angle.toFixed(4)} children Transform { translation 0.19 -0.4 0 rotation 0 0 1 -0.4 children Shape { appearance ${EMBER} geometry Box { size 0.16 0.32 0.03 } } } }`

/** The climb: slow off the pad, quicker as it goes, a shudder in x. */
const RISE_KEYS = [0, 0.2, 0.4, 0.6, 0.8, 1]
const RISE = RISE_KEYS.map(
  (k, i) => `${(i % 2 ? 0.012 : -0.012) * (i > 0 ? 1 : 0)} ${(-0.45 + k * k * 0.3).toFixed(3)} 0`,
)

export const ROCKET = `#VRML V2.0 utf8
DEF ROCKET Transform {
  translation 0 -0.45 0
  children [
    Shape { appearance ${CHROME} geometry Cylinder { radius 0.14 height 1.0 } }
    Transform { translation 0 0.68 0 children Shape { appearance ${EMBER} geometry Cone { bottomRadius 0.14 height 0.36 } } }
    Transform { translation 0 0.12 0 children Shape { appearance ${GRAPHITE} geometry Cylinder { radius 0.148 height 0.06 } } }
    Transform { translation 0 0.3 0.12 rotation 1 0 0 1.5708 children Shape { appearance ${GLASS} geometry Cylinder { radius 0.055 height 0.05 } } }
    ${fin(0)}
    ${fin((Math.PI * 2) / 3)}
    ${fin((Math.PI * 4) / 3)}
    Transform { translation 0 -0.58 0 rotation 1 0 0 3.1416 children Shape { appearance ${GRAPHITE} geometry Cone { bottomRadius 0.1 height 0.18 } } }
    DEF FLAME Transform { translation 0 -0.84 0 rotation 1 0 0 3.1416 children Shape { appearance ${FLAME} geometry Cone { bottomRadius 0.08 height 0.36 } } }
  ]
}
DEF FIREBALL Transform {
  translation 0 -0.1 0
  scale 0.001 0.001 0.001
  children Shape { appearance ${FIRE} geometry Sphere { radius 0.5 } }
}
DEF CLIMB TimeSensor { cycleInterval ${CLIMB_S} loop FALSE }
DEF RISE PositionInterpolator { key [${RISE_KEYS.join(" ")}] keyValue [${RISE.join(", ")}] }
DEF FLICKER TimeSensor { cycleInterval 0.24 loop TRUE }
DEF BURN PositionInterpolator { key [0 0.25 0.5 0.75 1] keyValue [1 1 1, 1.1 1.45 1.1, 0.9 0.8 0.9, 1.05 1.3 1.05, 1 1 1] }
DEF BOOM TimeSensor { cycleInterval ${LAUNCH_S} loop FALSE }
DEF SWELL PositionInterpolator {
  key [0 ${(CLIMB_S / LAUNCH_S).toFixed(3)} ${((CLIMB_S + 0.15) / LAUNCH_S).toFixed(3)} ${((CLIMB_S + 0.6) / LAUNCH_S).toFixed(3)} ${((CLIMB_S + 1.3) / LAUNCH_S).toFixed(3)} 1]
  keyValue [0.001 0.001 0.001, 0.001 0.001 0.001, 0.6 0.6 0.6, 1 1 1, 0.001 0.001 0.001, 0.001 0.001 0.001]
}
ROUTE CLIMB.fraction_changed TO RISE.set_fraction
ROUTE RISE.value_changed TO ROCKET.set_translation
ROUTE FLICKER.fraction_changed TO BURN.set_fraction
ROUTE BURN.value_changed TO FLAME.set_scale
ROUTE BOOM.fraction_changed TO SWELL.set_fraction
ROUTE SWELL.value_changed TO FIREBALL.set_scale
`

/** The launch at `t` seconds after the key: the file's moment, and how far
 * the pieces have blown apart (0 whole, 1 apart), held once it has burst. */
export function launchAt(t: number): { time: number; scatter: number } {
  const time = Math.max(0, Math.min(LAUNCH_S, t))
  const burst = Math.max(0, Math.min(1, (time - CLIMB_S) / BURST_S))
  return { time, scatter: 1 - (1 - burst) ** 3 }
}
