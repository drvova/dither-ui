import { createSignal, onCleanup, onMount } from "solid-js"
import { DitherWorld } from "@dither-kit"

// a whale of our own, written as a VRML97 file: a chain of segments, each
// hinged inside the one before, bent by a wave that grows toward the tail
const WHALE = `#VRML V2.0 utf8
DEF WHALE Transform {
  children [
DEF SEG0 Transform {
  translation 0 0 0
  children [
    Shape { appearance Appearance { material Material { diffuseColor 1 0.42 0.17 } } geometry IndexedFaceSet { coord Coordinate { point [0 0 0.14, 0 0.08 0.12, 0 0.14 0.07, 0 0.16 0, 0 0.14 -0.07, 0 0.08 -0.12, 0 0 -0.14, 0 -0.07 -0.12, 0 -0.12 -0.07, 0 -0.14 0, 0 -0.12 0.07, 0 -0.07 0.12, -0.09 0 0.26, -0.09 0.15 0.23, -0.09 0.26 0.13, -0.09 0.3 0, -0.09 0.26 -0.13, -0.09 0.15 -0.23, -0.09 0 -0.26, -0.09 -0.13 -0.23, -0.09 -0.22 -0.13, -0.09 -0.26 0, -0.09 -0.22 0.13, -0.09 -0.13 0.23, -0.26 0 0.32, -0.26 0.18 0.28, -0.26 0.32 0.16, -0.26 0.37 0, -0.26 0.32 -0.16, -0.26 0.18 -0.28, -0.26 0 -0.32, -0.26 -0.16 -0.28, -0.26 -0.27 -0.16, -0.26 -0.31 0, -0.26 -0.27 0.16, -0.26 -0.16 0.28, -0.55 0 0.33, -0.55 0.19 0.29, -0.55 0.34 0.17, -0.55 0.39 0, -0.55 0.34 -0.16, -0.55 0.19 -0.29, -0.55 0 -0.33, -0.55 -0.17 -0.29, -0.55 -0.29 -0.17, -0.55 -0.33 0, -0.55 -0.29 0.17, -0.55 -0.17 0.29, -0.69 0 0.32, -0.69 0.19 0.27, -0.69 0.33 0.16, -0.69 0.38 0, -0.69 0.33 -0.16, -0.69 0.19 -0.27, -0.69 0 -0.32, -0.69 -0.16 -0.27, -0.69 -0.28 -0.16, -0.69 -0.32 0, -0.69 -0.28 0.16, -0.69 -0.16 0.27, 0.1 0 0] } coordIndex [0 1 13 12 -1 1 2 14 13 -1 2 3 15 14 -1 3 4 16 15 -1 4 5 17 16 -1 5 6 18 17 -1 6 7 19 18 -1 7 8 20 19 -1 8 9 21 20 -1 9 10 22 21 -1 10 11 23 22 -1 11 0 12 23 -1 12 13 25 24 -1 13 14 26 25 -1 14 15 27 26 -1 15 16 28 27 -1 16 17 29 28 -1 17 18 30 29 -1 18 19 31 30 -1 19 20 32 31 -1 20 21 33 32 -1 21 22 34 33 -1 22 23 35 34 -1 23 12 24 35 -1 24 25 37 36 -1 25 26 38 37 -1 26 27 39 38 -1 27 28 40 39 -1 28 29 41 40 -1 29 30 42 41 -1 30 31 43 42 -1 31 32 44 43 -1 32 33 45 44 -1 33 34 46 45 -1 34 35 47 46 -1 35 24 36 47 -1 36 37 49 48 -1 37 38 50 49 -1 38 39 51 50 -1 39 40 52 51 -1 40 41 53 52 -1 41 42 54 53 -1 42 43 55 54 -1 43 44 56 55 -1 44 45 57 56 -1 45 46 58 57 -1 46 47 59 58 -1 47 36 48 59 -1 1 0 60 -1 2 1 60 -1 3 2 60 -1 4 3 60 -1 5 4 60 -1 6 5 60 -1 7 6 60 -1 8 7 60 -1 9 8 60 -1 10 9 60 -1 11 10 60 -1 0 11 60 -1] } }
    Transform { translation -0.440 -0.05 0.310 children Shape { appearance Appearance { material Material { diffuseColor 0.12 0.13 0.14 } } geometry Sphere { radius 0.035 } } }
    Transform { translation -0.440 -0.05 -0.310 children Shape { appearance Appearance { material Material { diffuseColor 0.12 0.13 0.14 } } geometry Sphere { radius 0.035 } } }
    DEF SEG1 Transform {
  translation -0.660 0 0
  children [
    Shape { appearance Appearance { material Material { diffuseColor 1 0.42 0.17 } } geometry IndexedFaceSet { coord Coordinate { point [0.03 0 0.32, 0.03 0.19 0.28, 0.03 0.33 0.16, 0.03 0.38 0, 0.03 0.33 -0.16, 0.03 0.19 -0.28, 0.03 0 -0.32, 0.03 -0.16 -0.28, 0.03 -0.28 -0.16, 0.03 -0.33 0, 0.03 -0.28 0.16, 0.03 -0.16 0.28, -0.22 0 0.3, -0.22 0.18 0.26, -0.22 0.31 0.15, -0.22 0.36 0, -0.22 0.31 -0.15, -0.22 0.18 -0.26, -0.22 0 -0.3, -0.22 -0.15 -0.26, -0.22 -0.27 -0.15, -0.22 -0.31 0, -0.22 -0.27 0.15, -0.22 -0.15 0.26, -0.47 0 0.25, -0.47 0.15 0.22, -0.47 0.27 0.13, -0.47 0.31 0, -0.47 0.27 -0.13, -0.47 0.15 -0.22, -0.47 0 -0.25, -0.47 -0.13 -0.22, -0.47 -0.23 -0.13, -0.47 -0.26 0, -0.47 -0.23 0.13, -0.47 -0.13 0.22] } coordIndex [0 1 13 12 -1 1 2 14 13 -1 2 3 15 14 -1 3 4 16 15 -1 4 5 17 16 -1 5 6 18 17 -1 6 7 19 18 -1 7 8 20 19 -1 8 9 21 20 -1 9 10 22 21 -1 10 11 23 22 -1 11 0 12 23 -1 12 13 25 24 -1 13 14 26 25 -1 14 15 27 26 -1 15 16 28 27 -1 16 17 29 28 -1 17 18 30 29 -1 18 19 31 30 -1 19 20 32 31 -1 20 21 33 32 -1 21 22 34 33 -1 22 23 35 34 -1 23 12 24 35 -1] } }
    Shape { appearance Appearance { material Material { diffuseColor 1 0.42 0.17 } } geometry IndexedFaceSet { solid FALSE coord Coordinate { point [-0.066 -0.200 0.260, -0.326 -0.360 0.440, -0.406 -0.400 0.400, -0.246 -0.240 0.240] } coordIndex [0 1 2 3 -1] } }
    Shape { appearance Appearance { material Material { diffuseColor 1 0.42 0.17 } } geometry IndexedFaceSet { solid FALSE coord Coordinate { point [-0.066 -0.200 -0.260, -0.326 -0.360 -0.440, -0.406 -0.400 -0.400, -0.246 -0.240 -0.240] } coordIndex [0 1 2 3 -1] } }
    DEF SEG2 Transform {
  translation -0.440 0 0
  children [
    Shape { appearance Appearance { material Material { diffuseColor 1 0.42 0.17 } } geometry IndexedFaceSet { coord Coordinate { point [0.03 0 0.27, 0.03 0.16 0.23, 0.03 0.28 0.13, 0.03 0.32 0, 0.03 0.28 -0.13, 0.03 0.16 -0.23, 0.03 0 -0.27, 0.03 -0.14 -0.23, 0.03 -0.24 -0.13, 0.03 -0.27 0, 0.03 -0.24 0.13, 0.03 -0.14 0.23, -0.11 0 0.24, -0.11 0.14 0.21, -0.11 0.25 0.12, -0.11 0.29 0, -0.11 0.25 -0.12, -0.11 0.14 -0.21, -0.11 0 -0.24, -0.11 -0.12 -0.21, -0.11 -0.21 -0.12, -0.11 -0.25 0, -0.11 -0.21 0.12, -0.11 -0.12 0.21, -0.39 0 0.17, -0.39 0.11 0.15, -0.39 0.19 0.09, -0.39 0.21 0, -0.39 0.19 -0.09, -0.39 0.11 -0.15, -0.39 0 -0.17, -0.39 -0.09 -0.15, -0.39 -0.16 -0.09, -0.39 -0.18 0, -0.39 -0.16 0.09, -0.39 -0.09 0.15] } coordIndex [0 1 13 12 -1 1 2 14 13 -1 2 3 15 14 -1 3 4 16 15 -1 4 5 17 16 -1 5 6 18 17 -1 6 7 19 18 -1 7 8 20 19 -1 8 9 21 20 -1 9 10 22 21 -1 10 11 23 22 -1 11 0 12 23 -1 12 13 25 24 -1 13 14 26 25 -1 14 15 27 26 -1 15 16 28 27 -1 16 17 29 28 -1 17 18 30 29 -1 18 19 31 30 -1 19 20 32 31 -1 20 21 33 32 -1 21 22 34 33 -1 22 23 35 34 -1 23 12 24 35 -1] } }
    DEF SEG3 Transform {
  translation -0.352 0 0
  children [
    Shape { appearance Appearance { material Material { diffuseColor 1 0.42 0.17 } } geometry IndexedFaceSet { coord Coordinate { point [0.03 0 0.19, 0.03 0.12 0.16, 0.03 0.2 0.09, 0.03 0.23 0, 0.03 0.2 -0.09, 0.03 0.12 -0.16, 0.03 0 -0.19, 0.03 -0.1 -0.16, 0.03 -0.17 -0.09, 0.03 -0.2 0, 0.03 -0.17 0.09, 0.03 -0.1 0.16, -0.09 0 0.16, -0.09 0.1 0.14, -0.09 0.17 0.08, -0.09 0.2 0, -0.09 0.17 -0.08, -0.09 0.1 -0.14, -0.09 0 -0.16, -0.09 -0.09 -0.14, -0.09 -0.15 -0.08, -0.09 -0.17 0, -0.09 -0.15 0.08, -0.09 -0.09 0.14, -0.34 0 0.1, -0.34 0.06 0.09, -0.34 0.11 0.05, -0.34 0.12 0, -0.34 0.11 -0.05, -0.34 0.06 -0.09, -0.34 0 -0.1, -0.34 -0.05 -0.09, -0.34 -0.09 -0.05, -0.34 -0.1 0, -0.34 -0.09 0.05, -0.34 -0.05 0.09] } coordIndex [0 1 13 12 -1 1 2 14 13 -1 2 3 15 14 -1 3 4 16 15 -1 4 5 17 16 -1 5 6 18 17 -1 6 7 19 18 -1 7 8 20 19 -1 8 9 21 20 -1 9 10 22 21 -1 10 11 23 22 -1 11 0 12 23 -1 12 13 25 24 -1 13 14 26 25 -1 14 15 27 26 -1 15 16 28 27 -1 16 17 29 28 -1 17 18 30 29 -1 18 19 31 30 -1 19 20 32 31 -1 20 21 33 32 -1 21 22 34 33 -1 22 23 35 34 -1 23 12 24 35 -1] } }
    DEF SEG4 Transform {
  translation -0.308 0 0
  children [
    Shape { appearance Appearance { material Material { diffuseColor 1 0.42 0.17 } } geometry IndexedFaceSet { coord Coordinate { point [0.03 0 0.12, 0.03 0.07 0.1, 0.03 0.12 0.06, 0.03 0.14 0, 0.03 0.12 -0.06, 0.03 0.07 -0.1, 0.03 0 -0.12, 0.03 -0.06 -0.1, 0.03 -0.11 -0.06, 0.03 -0.12 0, 0.03 -0.11 0.06, 0.03 -0.06 0.1, -0.04 0 0.1, -0.04 0.06 0.09, -0.04 0.1 0.05, -0.04 0.12 0, -0.04 0.1 -0.05, -0.04 0.06 -0.09, -0.04 0 -0.1, -0.04 -0.05 -0.09, -0.04 -0.09 -0.05, -0.04 -0.1 0, -0.04 -0.09 0.05, -0.04 -0.05 0.09, -0.25 0 0.07, -0.25 0.04 0.06, -0.25 0.06 0.04, -0.25 0.07 0, -0.25 0.06 -0.04, -0.25 0.04 -0.06, -0.25 0 -0.07, -0.25 -0.03 -0.06, -0.25 -0.05 -0.04, -0.25 -0.06 0, -0.25 -0.05 0.04, -0.25 -0.03 0.06] } coordIndex [0 1 13 12 -1 1 2 14 13 -1 2 3 15 14 -1 3 4 16 15 -1 4 5 17 16 -1 5 6 18 17 -1 6 7 19 18 -1 7 8 20 19 -1 8 9 21 20 -1 9 10 22 21 -1 10 11 23 22 -1 11 0 12 23 -1 12 13 25 24 -1 13 14 26 25 -1 14 15 27 26 -1 15 16 28 27 -1 16 17 29 28 -1 17 18 30 29 -1 18 19 31 30 -1 19 20 32 31 -1 20 21 33 32 -1 21 22 34 33 -1 22 23 35 34 -1 23 12 24 35 -1] } }
    DEF SEG5 Transform {
  translation -0.220 0 0
  children [
    Shape { appearance Appearance { material Material { diffuseColor 1 0.42 0.17 } } geometry IndexedFaceSet { coord Coordinate { point [0.03 0 0.08, 0.03 0.04 0.07, 0.03 0.08 0.04, 0.03 0.09 0, 0.03 0.08 -0.04, 0.03 0.04 -0.07, 0.03 0 -0.08, 0.03 -0.04 -0.07, 0.03 -0.06 -0.04, 0.03 -0.07 0, 0.03 -0.06 0.04, 0.03 -0.04 0.07, -0.04 0 0.07, -0.04 0.03 0.06, -0.04 0.06 0.04, -0.04 0.07 0, -0.04 0.06 -0.03, -0.04 0.03 -0.06, -0.04 0 -0.07, -0.04 -0.03 -0.06, -0.04 -0.05 -0.04, -0.04 -0.06 0, -0.04 -0.05 0.04, -0.04 -0.03 0.06, -0.22 0 0.05, -0.22 0.02 0.04, -0.22 0.04 0.03, -0.22 0.05 0, -0.22 0.04 -0.02, -0.22 0.02 -0.04, -0.22 0 -0.05, -0.22 -0.02 -0.04, -0.22 -0.04 -0.03, -0.22 -0.04 0, -0.22 -0.04 0.03, -0.22 -0.02 0.04, -0.25 0 0] } coordIndex [0 1 13 12 -1 1 2 14 13 -1 2 3 15 14 -1 3 4 16 15 -1 4 5 17 16 -1 5 6 18 17 -1 6 7 19 18 -1 7 8 20 19 -1 8 9 21 20 -1 9 10 22 21 -1 10 11 23 22 -1 11 0 12 23 -1 12 13 25 24 -1 13 14 26 25 -1 14 15 27 26 -1 15 16 28 27 -1 16 17 29 28 -1 17 18 30 29 -1 18 19 31 30 -1 19 20 32 31 -1 20 21 33 32 -1 21 22 34 33 -1 22 23 35 34 -1 23 12 24 35 -1 24 25 36 -1 25 26 36 -1 26 27 36 -1 27 28 36 -1 28 29 36 -1 29 30 36 -1 30 31 36 -1 31 32 36 -1 32 33 36 -1 33 34 36 -1 34 35 36 -1 35 24 36 -1] } }
    Shape { appearance Appearance { material Material { diffuseColor 1 0.42 0.17 } } geometry IndexedFaceSet { solid FALSE coord Coordinate { point [-0.180 0.000 0.020, -0.280 0.000 0.300, -0.480 0.000 0.460, -0.420 0.000 0.140, -0.460 0.000 0.000] } coordIndex [0 1 2 3 4 -1] } }
    Shape { appearance Appearance { material Material { diffuseColor 1 0.42 0.17 } } geometry IndexedFaceSet { solid FALSE coord Coordinate { point [-0.180 0.000 -0.020, -0.280 0.000 -0.300, -0.480 0.000 -0.460, -0.420 0.000 -0.140, -0.460 0.000 0.000] } coordIndex [0 1 2 3 4 -1] } }
  ]
}
  ]
}
  ]
}
  ]
}
  ]
}
  ]
}
  ]
}
DEF STROKE TimeSensor { cycleInterval 1.8 loop TRUE }
DEF BOB PositionInterpolator { key [0 0.125 0.25 0.375 0.5 0.625 0.75 0.875 1] keyValue [0 0.040 0, 0 0.028 0, 0 0.000 0, 0 -0.028 0, 0 -0.040 0, 0 -0.028 0, 0 -0.000 0, 0 0.028 0, 0 0.040 0] }
ROUTE STROKE.fraction_changed TO BOB.set_fraction
ROUTE BOB.value_changed TO WHALE.set_translation
DEF WAVE0 OrientationInterpolator { key [0 0.125 0.25 0.375 0.5 0.625 0.75 0.875 1] keyValue [0 0 1 0.000, 0 0 1 0.035, 0 0 1 0.050, 0 0 1 0.035, 0 0 1 0.000, 0 0 1 -0.035, 0 0 1 -0.050, 0 0 1 -0.035, 0 0 1 -0.000] }
ROUTE STROKE.fraction_changed TO WAVE0.set_fraction
ROUTE WAVE0.value_changed TO SEG0.set_rotation
DEF WAVE1 OrientationInterpolator { key [0 0.125 0.25 0.375 0.5 0.625 0.75 0.875 1] keyValue [0 0 1 -0.044, 0 0 1 -0.002, 0 0 1 0.041, 0 0 1 0.060, 0 0 1 0.044, 0 0 1 0.002, 0 0 1 -0.041, 0 0 1 -0.060, 0 0 1 -0.044] }
ROUTE STROKE.fraction_changed TO WAVE1.set_fraction
ROUTE WAVE1.value_changed TO SEG1.set_rotation
DEF WAVE2 OrientationInterpolator { key [0 0.125 0.25 0.375 0.5 0.625 0.75 0.875 1] keyValue [0 0 1 -0.100, 0 0 1 -0.075, 0 0 1 -0.006, 0 0 1 0.066, 0 0 1 0.100, 0 0 1 0.075, 0 0 1 0.006, 0 0 1 -0.066, 0 0 1 -0.100] }
ROUTE STROKE.fraction_changed TO WAVE2.set_fraction
ROUTE WAVE2.value_changed TO SEG2.set_rotation
DEF WAVE3 OrientationInterpolator { key [0 0.125 0.25 0.375 0.5 0.625 0.75 0.875 1] keyValue [0 0 1 -0.102, 0 0 1 -0.159, 0 0 1 -0.123, 0 0 1 -0.015, 0 0 1 0.102, 0 0 1 0.159, 0 0 1 0.123, 0 0 1 0.015, 0 0 1 -0.102] }
ROUTE STROKE.fraction_changed TO WAVE3.set_fraction
ROUTE WAVE3.value_changed TO SEG3.set_rotation
DEF WAVE4 OrientationInterpolator { key [0 0.125 0.25 0.375 0.5 0.625 0.75 0.875 1] keyValue [0 0 1 0.030, 0 0 1 -0.147, 0 0 1 -0.238, 0 0 1 -0.190, 0 0 1 -0.030, 0 0 1 0.147, 0 0 1 0.238, 0 0 1 0.190, 0 0 1 0.030] }
ROUTE STROKE.fraction_changed TO WAVE4.set_fraction
ROUTE WAVE4.value_changed TO SEG4.set_rotation
DEF WAVE5 OrientationInterpolator { key [0 0.125 0.25 0.375 0.5 0.625 0.75 0.875 1] keyValue [0 0 1 0.275, 0 0 1 0.053, 0 0 1 -0.200, 0 0 1 -0.336, 0 0 1 -0.275, 0 0 1 -0.053, 0 0 1 0.200, 0 0 1 0.336, 0 0 1 0.275] }
ROUTE STROKE.fraction_changed TO WAVE5.set_fraction
ROUTE WAVE5.value_changed TO SEG5.set_rotation
`

/** The poses it cuts between, and how each cut dissolves: the cells grow
 * coarse and the pieces drift apart, the pose changes at the coarsest, and
 * it settles back. */
const SHOTS = [
  { yaw: -30, pitch: 12 },
  { yaw: 150, pitch: -8 },
  { yaw: 95, pitch: 26 },
  { yaw: 205, pitch: 4 },
  { yaw: -70, pitch: -16 },
]
const DISSOLVE = [
  { cell: 4, scatter: 0.06 },
  { cell: 7, scatter: 0.14 },
  { cell: 11, scatter: 0.22 },
  { cell: 7, scatter: 0.14 },
  { cell: 4, scatter: 0.06 },
  { cell: 2, scatter: 0 },
]
const HOLD_MS = 2600
const STEP_MS = 70

export default function Example() {
  const [shot, setShot] = createSignal(0)
  const [cut, setCut] = createSignal({ cell: 2, scatter: 0 })
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
    DISSOLVE.forEach((step, i) =>
      timers.push(
        window.setTimeout(() => {
          setCut(step)
          if (i === 2) setShot((s) => (s + 1) % SHOTS.length)
        }, i * STEP_MS),
      ),
    )
    timers.push(window.setTimeout(next, HOLD_MS + DISSOLVE.length * STEP_MS))
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
      <DitherWorld
        source={WHALE}
        material
        animate
        yaw={SHOTS[shot()].yaw}
        pitch={SHOTS[shot()].pitch}
        autoRotate={6}
        zoom={1.5}
        fov={35}
        cell={cut().cell}
        scatter={cut().scatter}
        color="orange"
        label="A whale swimming"
        class="h-[320px]"
      />
    </div>
  )
}
