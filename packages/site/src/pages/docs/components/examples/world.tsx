import { children, createSignal, For, type JSX, onCleanup, onMount, Show } from "solid-js"
import { DitherAurora, DitherWorld, type ChannelInput } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

// The default content is this seeded VRML97 file, parsed like any other:
const WORLD = `#VRML V2.0 utf8
# dither-kit sample world, seed 7
DEF Body Transform { children Shape { appearance Appearance { material Material { diffuseColor 0.949 0.427 0.427 } } geometry Sphere { radius 1 } } }
Transform { rotation 1 0 0 0.214 children Shape { appearance Appearance { material Material { diffuseColor 0.8 0.694 0.478 } } geometry IndexedFaceSet { solid FALSE coord Coordinate { point [ 1.791 0 0, 1.571 0 0, 1.73 0 0.463, 1.517 0 0.407, 1.551 0 0.895, 1.36 0 0.785, 1.266 0 1.266, 1.111 0 1.111, 0.895 0 1.551, 0.785 0 1.36, 0.463 0 1.73, 0.407 0 1.517, 0 0 1.791, 0 0 1.571, -0.463 0 1.73, -0.407 0 1.517, -0.895 0 1.551, -0.785 0 1.36, -1.266 0 1.266, -1.111 0 1.111, -1.551 0 0.895, -1.36 0 0.785, -1.73 0 0.463, -1.517 0 0.407, -1.791 0 0, -1.571 0 0, -1.73 0 -0.463, -1.517 0 -0.407, -1.551 0 -0.895, -1.36 0 -0.785, -1.266 0 -1.266, -1.111 0 -1.111, -0.895 0 -1.551, -0.785 0 -1.36, -0.463 0 -1.73, -0.407 0 -1.517, 0 0 -1.791, 0 0 -1.571, 0.463 0 -1.73, 0.407 0 -1.517, 0.895 0 -1.551, 0.785 0 -1.36, 1.266 0 -1.266, 1.111 0 -1.111, 1.551 0 -0.895, 1.36 0 -0.785, 1.73 0 -0.463, 1.517 0 -0.407 ] } coordIndex [ 0 2 3 1 -1 2 4 5 3 -1 4 6 7 5 -1 6 8 9 7 -1 8 10 11 9 -1 10 12 13 11 -1 12 14 15 13 -1 14 16 17 15 -1 16 18 19 17 -1 18 20 21 19 -1 20 22 23 21 -1 22 24 25 23 -1 24 26 27 25 -1 26 28 29 27 -1 28 30 31 29 -1 30 32 33 31 -1 32 34 35 33 -1 34 36 37 35 -1 36 38 39 37 -1 38 40 41 39 -1 40 42 43 41 -1 42 44 45 43 -1 44 46 47 45 -1 46 0 1 47 -1 ] } } }
DEF Arm Group { children [
  Transform { translation 1.043 0 0 rotation 0 0 1 -1.5708 children Shape { appearance Appearance { material Material { diffuseColor 0.49 0.698 0.702 } } geometry Cylinder { radius 0.07 height 2.086 } } }
  Transform { translation 2.086 0 0 rotation 0 0 1 -1.5708 children Shape { appearance Appearance { material Material { diffuseColor 0.361 0.718 0.902 } } geometry Cone { bottomRadius 0.22 height 0.5 } } }
] }
DEF Arms Transform { children [ USE Arm
  Transform { rotation 0 1 0 1.257 children USE Arm }
  Transform { rotation 0 1 0 2.513 children USE Arm }
  Transform { rotation 0 1 0 3.77 children USE Arm }
  Transform { rotation 0 1 0 5.027 children USE Arm }
] }
DEF Antenna Transform { translation 0 1.2 0 children Shape { appearance Appearance { material Material { diffuseColor 1 0.667 0.502 } } geometry Cone { bottomRadius 0.18 height 0.5 } } }
DEF Clock TimeSensor { cycleInterval 5 loop TRUE }
DEF Spin OrientationInterpolator { key [ 0 0.5 1 ] keyValue [ 0 1 0 0, 0 1 0 3.14159, 0 1 0 6.28318 ] }
DEF Bob PositionInterpolator { key [ 0 0.5 1 ] keyValue [ 0 1.2 0, 0 1.5 0, 0 1.2 0 ] }
ROUTE Clock.fraction_changed TO Spin.set_fraction
ROUTE Spin.value_changed TO Arms.set_rotation
ROUTE Clock.fraction_changed TO Bob.set_fraction
ROUTE Bob.value_changed TO Antenna.set_translation
`

// a GLSL material: ink where the depth jumps, a dimmer body inside
const INK = `void mainMaterial(out vec4 o, in vec2 p) {
  float d = dk_depth(p);
  float edge = 0.0;
  edge = max(edge, abs(dk_depth(p + vec2(1.0, 0.0)) - d));
  edge = max(edge, abs(dk_depth(p - vec2(1.0, 0.0)) - d));
  edge = max(edge, abs(dk_depth(p + vec2(0.0, 1.0)) - d));
  edge = max(edge, abs(dk_depth(p - vec2(0.0, 1.0)) - d));
  if (edge > 0.05) { o = vec4(1.0, 1.0, 1.0, 1.0); return; }
  o = dk_covered(p) ? vec4(iColor, dk_shade(p) * 0.85) : vec4(0.0);
}`
// the same ink over the skin: the channel sampled at the cell's texture coordinates
const INK_SKIN = INK.replace(
  "vec4(iColor, dk_shade(p) * 0.85)",
  "vec4(mix(iColor, dk_texture(p).rgb, dk_texture(p).a), dk_shade(p) * 0.85)",
)
const RAMP = ["#0b1a3a", "#1f6fd6", "#9ec5ff", "#ffffff"]

/** A kit surface as a channel: its element goes to `ref` once it stands. */
function Source(props: { ref: (source: ChannelInput) => void; children: JSX.Element }) {
  const surface = children(() => props.children)
  onMount(() => {
    const el = surface()
    props.ref(el instanceof Element ? { $el: el } : null)
    onCleanup(() => props.ref(null))
  })
  return <>{surface()}</>
}

export default function Example() {
  const [wire, setWire] = createSignal(false)
  const [ink, setInk] = createSignal(false)
  const [texture, setTexture] = createSignal(false)
  const [ramp, setRamp] = createSignal(false)
  const [grain, setGrain] = createSignal(false)
  const [bloom, setBloom] = createSignal(false)
  const [nudge, setNudge] = createSignal(false)
  const [build, setBuild] = createSignal(1)
  const [scatter, setScatter] = createSignal(0)
  const [engine, setEngine] = createSignal<"cpu" | "gpu">("cpu")
  const [skin, setSkin] = createSignal<ChannelInput>(null)
  const toggles = [
    ["wire", wire, setWire],
    ["ink", ink, setInk],
    ["texture", texture, setTexture],
    ["ramp", ramp, setRamp],
    ["grain", grain, setGrain],
    ["bloom", bloom, setBloom],
    ["nudge", nudge, setNudge],
  ] as const

  return (
    <div class="mx-auto max-w-md">
      {/* channels wrap any kit surface (or an image, canvas, video) onto the model
           through its texture coordinates; dk_texture(p) samples the first */}
      <Show when={texture()}>
        <Source ref={setSkin}>
          <DitherAurora colors={["#1f6fd6", "#9ec5ff", "#ffffff"]} speed={0.8} class="mb-2 h-[48px]" />
        </Source>
      </Show>
      {/* .wrl (VRML97 / 1.0), .x3d, .gltf / .glb, .obj + .mtl, .stl, .ply, .off, .splat:
           by URL (src) or inline (source). The file's materials, lights, viewpoint
           and animations are honoured. CPU engine by default (same bytes everywhere,
           frame-exact in the video export); engine="gpu" rasterizes big meshes
           through WebGL into the same dither. Drag or use the arrow keys to orbit.
           build raises the model from a wire cage along its own seams, scatter
           blows it apart and nudge leans it away from the pointer. */}
      <DitherWorld
        source={WORLD}
        wire={wire()}
        colors={ramp() ? RAMP : undefined}
        grain={grain() ? 0.6 : 0}
        bloom={bloom() ? "low" : "off"}
        engine={engine()}
        shader={ink() ? (texture() ? INK_SKIN : INK) : undefined}
        channels={texture() ? [skin()] : undefined}
        build={build()}
        scatter={scatter()}
        nudge={nudge()}
        color="blue"
        label="Sample probe, seed 7"
        class="h-[280px]"
      />
      <div class="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] text-muted-foreground">
        <For each={toggles}>
          {([name, on, set]) => (
            <label class="flex min-h-6 items-center gap-2">
              <input
                checked={on()}
                onChange={(e) => set(e.currentTarget.checked)}
                type="checkbox"
                class="accent-[var(--accent)]"
              />{" "}
              {name}
            </label>
          )}
        </For>
        <label class="flex min-h-6 items-center gap-2">
          build
          <input
            value={build()}
            onInput={(e) => setBuild(e.currentTarget.valueAsNumber)}
            type="range"
            min="0"
            max="1"
            step="0.01"
            class="w-24"
          />
        </label>
        <label class="flex min-h-6 items-center gap-2">
          scatter
          <input
            value={scatter()}
            onInput={(e) => setScatter(e.currentTarget.valueAsNumber)}
            type="range"
            min="0"
            max="1"
            step="0.01"
            class="w-24"
          />
        </label>
        <label class="flex min-h-6 items-center gap-2">
          engine
          <select
            value={engine()}
            onChange={(e) => setEngine(e.currentTarget.value as "cpu" | "gpu")}
            class="h-6 rounded border border-border bg-background px-1 text-[11px] text-foreground"
          >
            <option value="cpu">cpu</option>
            <option value="gpu">gpu</option>
          </select>
        </label>
      </div>
    </div>
  )
}

export const meta = defineExample({
  component: DitherWorld,
  title: "World (3D)",
  studio: {
    group: "display",
    frame: { w: 320, h: 240 },
    controls: {
      src: { kind: "url", demo: "" },
      source: { demo: "" },
      format: { options: ["auto", "vrml", "x3d", "gltf", "obj", "stl", "ply", "off"] },
      engine: {},
      color: {},
      colors: { kind: "list", demo: [] },
      dither: { min: 0, max: 1, step: 0.05 },
      cell: { min: 1, max: 8, step: 1 },
      autoRotate: { min: 0, max: 90, step: 1 },
      yaw: { min: -180, max: 180, step: 1 },
      pitch: { min: -89, max: 89, step: 1 },
      zoom: { min: 0.3, max: 4, step: 0.1 },
      fov: { min: 10, max: 120, step: 1 },
      shade: { min: 0, max: 1, step: 0.02 },
      fog: { min: 0, max: 1, step: 0.05 },
      grain: { min: 0, max: 1, step: 0.05 },
      grainScale: { min: 0.5, max: 16, step: 0.5 },
      material: {},
      wire: {},
      shader: { demo: "" },
      bloom: { kind: "select", options: ["off", "low", "high", "aura"] },
      animate: {},
      interactive: {},
      frameRate: { min: 0, max: 60, step: 1 },
      paused: {},
    },
  },
})
