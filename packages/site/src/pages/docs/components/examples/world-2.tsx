import { createMemo, createSignal, onCleanup } from "solid-js"
import { DitherButton, DitherWorld } from "@dither-kit"

// a rocket of our own, written as a VRML97 file: its pieces, a flame that
// flickers by its own TimeSensor, a climb, and a fireball that swells at the top
const ROCKET = `#VRML V2.0 utf8
DEF ROCKET Transform {
  translation 0 -0.45 0
  children [
    Shape { appearance Appearance { material Material { diffuseColor 0.83 0.86 0.88 } } geometry Cylinder { radius 0.14 height 1.0 } }
    Transform { translation 0 0.68 0 children Shape { appearance Appearance { material Material { diffuseColor 1 0.42 0.17 } } geometry Cone { bottomRadius 0.14 height 0.36 } } }
    Transform { translation 0 0.12 0 children Shape { appearance Appearance { material Material { diffuseColor 0.15 0.16 0.18 } } geometry Cylinder { radius 0.148 height 0.06 } } }
    Transform { translation 0 0.3 0.12 rotation 1 0 0 1.5708 children Shape { appearance Appearance { material Material { diffuseColor 0.35 0.55 0.75 } } geometry Cylinder { radius 0.055 height 0.05 } } }
    Transform { rotation 0 1 0 0.0000 children Transform { translation 0.19 -0.4 0 rotation 0 0 1 -0.4 children Shape { appearance Appearance { material Material { diffuseColor 1 0.42 0.17 } } geometry Box { size 0.16 0.32 0.03 } } } }
    Transform { rotation 0 1 0 2.0944 children Transform { translation 0.19 -0.4 0 rotation 0 0 1 -0.4 children Shape { appearance Appearance { material Material { diffuseColor 1 0.42 0.17 } } geometry Box { size 0.16 0.32 0.03 } } } }
    Transform { rotation 0 1 0 4.1888 children Transform { translation 0.19 -0.4 0 rotation 0 0 1 -0.4 children Shape { appearance Appearance { material Material { diffuseColor 1 0.42 0.17 } } geometry Box { size 0.16 0.32 0.03 } } } }
    Transform { translation 0 -0.58 0 rotation 1 0 0 3.1416 children Shape { appearance Appearance { material Material { diffuseColor 0.15 0.16 0.18 } } geometry Cone { bottomRadius 0.1 height 0.18 } } }
    DEF FLAME Transform { translation 0 -0.84 0 rotation 1 0 0 3.1416 children Shape { appearance Appearance { material Material { diffuseColor 1 0.62 0.2 emissiveColor 1 0.62 0.2 } } geometry Cone { bottomRadius 0.08 height 0.36 } } }
  ]
}
DEF FIREBALL Transform {
  translation 0 -0.1 0
  scale 0.001 0.001 0.001
  children Shape { appearance Appearance { material Material { diffuseColor 1 0.62 0.25 emissiveColor 1 0.62 0.25 } } geometry Sphere { radius 0.5 } }
}
DEF CLIMB TimeSensor { cycleInterval 2.4 loop FALSE }
DEF RISE PositionInterpolator { key [0 0.2 0.4 0.6 0.8 1] keyValue [0 -0.450 0, 0.012 -0.438 0, -0.012 -0.402 0, 0.012 -0.342 0, -0.012 -0.258 0, 0.012 -0.150 0] }
DEF FLICKER TimeSensor { cycleInterval 0.24 loop TRUE }
DEF BURN PositionInterpolator { key [0 0.25 0.5 0.75 1] keyValue [1 1 1, 1.1 1.45 1.1, 0.9 0.8 0.9, 1.05 1.3 1.05, 1 1 1] }
DEF BOOM TimeSensor { cycleInterval 4.6 loop FALSE }
DEF SWELL PositionInterpolator {
  key [0 0.522 0.554 0.652 0.804 1]
  keyValue [0.001 0.001 0.001, 0.001 0.001 0.001, 0.6 0.6 0.6, 1 1 1, 0.001 0.001 0.001, 0.001 0.001 0.001]
}
ROUTE CLIMB.fraction_changed TO RISE.set_fraction
ROUTE RISE.value_changed TO ROCKET.set_translation
ROUTE FLICKER.fraction_changed TO BURN.set_fraction
ROUTE BURN.value_changed TO FLAME.set_scale
ROUTE BOOM.fraction_changed TO SWELL.set_fraction
ROUTE SWELL.value_changed TO FIREBALL.set_scale
`

export default function Example() {
  // one clock from the key: the file's moment, then the burst
  const CLIMB = 2.4
  const LAUNCH = 4.6
  const [t, setT] = createSignal(0)
  const time = createMemo(() => Math.max(0, Math.min(LAUNCH, t())))
  // the pieces fly apart over 0.6s from the top of the climb, and stay apart
  const scatter = createMemo(() => 1 - (1 - Math.max(0, Math.min(1, (time() - CLIMB) / 0.6))) ** 3)
  const flying = () => t() > 0 && t() < LAUNCH
  let raf = 0
  function fire() {
    cancelAnimationFrame(raf)
    // under reduced motion the key goes straight to the debris
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
      setT(LAUNCH)
      return
    }
    const t0 = performance.now()
    const step = (now: number) => {
      setT(Math.min(LAUNCH, (now - t0) / 1000))
      raf = t() < LAUNCH ? requestAnimationFrame(step) : 0
    }
    raf = requestAnimationFrame(step)
  }
  onCleanup(() => cancelAnimationFrame(raf))

  return (
    <div class="mx-auto max-w-md">
      <DitherWorld
        source={ROCKET}
        material
        animate
        time={time()}
        scatter={scatter()}
        bloom="low"
        zoom={0.62}
        yaw={20}
        pitch={8}
        cell={2}
        color="grey"
        label="A rocket that climbs and bursts"
        class="h-[280px]"
      />
      <div class="mt-3 flex justify-center">
        <DitherButton color="orange" disabled={flying()} onClick={fire}>
          {t() >= LAUNCH ? "Launch again" : "Launch"}
        </DitherButton>
      </div>
    </div>
  )
}
