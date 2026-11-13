import { children, createMemo, createSignal, type JSX, onCleanup, onMount, Show } from "solid-js"
import { createStore, produce } from "solid-js/store"
import {
  DitherAurora,
  DitherBracket,
  DitherButton,
  DitherSchedule,
  DitherShader,
  DitherVideoPlayer,
  DitherWorld,
  sampleShader,
  sampleWorld,
  type BracketMatch,
  type ChannelInput,
} from "@dither-ui/kit"
import { launchAt, LAUNCH_S, ROCKET } from "@/pages/docs/components/rocket"
import { assetPath } from "@/shared/lib/routes"
import { CAPTURE_PATH } from "@/shared/ui/mascot-capture"
import { pixelPrefersReducedMotion } from "@dither-ui/kit/engine/pixel.ts"
import DemoCard from "../DemoCard"
import PropsTable, { type PropRow } from "../PropsTable"

/* Public-domain sample clip (MDN CC0) — swap for your own src. */
const VIDEO_SRC = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"

/* World: the seeded sample is real VRML97 text (with its own TimeSensor →
   ROUTE animation), so the code tab shows the file. */
const WORLD = sampleWorld(7)
const RAMP = ["#0b1a3a", "#1f6fd6", "#9ec5ff", "#ffffff"]

/* A GLSL material over the world's target: ink where depth jumps, a dimmer
   body inside, nothing outside. */
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
/* The same ink over the skin: the channel sampled at the cell's texture coordinates. */
const INK_SKIN = INK.replace(
  "vec4(iColor, dk_shade(p) * 0.85)",
  "vec4(mix(iColor, dk_texture(p).rgb, dk_texture(p).a), dk_shade(p) * 0.85)",
)

/* The render graph: a kit surface bound as iChannel0 of a CRT shader. */
const CRT = `void mainImage(out vec4 o, in vec2 fc) {
  vec2 c = fc / iResolution.xy * 2.0 - 1.0;
  c *= 1.0 + 0.18 * dot(c, c);                       // barrel
  vec2 uv = c * 0.5 + 0.5;
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) { o = vec4(0.0); return; }
  vec3 col = texture(iChannel0, uv).rgb;              // the aurora, upright
  col *= 0.8 + 0.2 * sin(fc.y * 3.14159 + iTime * 2.0); // rolling scanlines
  col *= 1.0 - 0.45 * dot(c, c);                      // vignette
  o = vec4(col, 1.0);
}`

/* Shader: the seeded sample is real Shadertoy-style GLSL, shown in the code tab. */
const SHADER = sampleShader(3)

const API: Record<string, PropRow[]> = {
  video: [
    { prop: "src", type: "string: no src renders an honest empty face", default: "undefined" },
    { prop: "poster", type: "string", default: "undefined" },
    { prop: "label", type: "string: accessible name", default: '"Video"' },
    { prop: "color", type: "PixelColor: scrubber and volume hue", default: '"blue"' },
    { prop: "keyboard", type: "Space/K play, ←→ seek 5s, ↑↓ volume, M mute, F fullscreen", default: "" },
  ],
  bracket: [
    { prop: "rounds", type: "{ a, b, winner? }[][]: columns left to right", default: "required" },
    { prop: "color", type: "PixelColor: winner accent", default: '"green"' },
    { prop: "interactive", type: "boolean: click a side to pick", default: "false" },
    { prop: "onPick", type: "(round, match, side): consumer advances the data", default: "" },
  ],
  schedule: [
    { prop: "events", type: "{ start, end, label, color? }[]: fractional hours", default: "required" },
    { prop: "from / to", type: "number: day window", default: "8 / 18" },
    { prop: "now", type: "number: draws the now line; omit to hide", default: "undefined" },
  ],
  world: [
    {
      prop: "src",
      type: "string: URL of .wrl (VRML97 / 1.0 / X3D classic), .x3d, .gltf / .glb (+ .bin), .obj (+ .mtl), .stl, .ply, .off, or a Gaussian capture (.splat, a trained .ply)",
      default: "undefined",
    },
    { prop: "source", type: "string: inline model text; wins over src", default: "undefined" },
    { prop: "format", type: '"auto" | "vrml" | "x3d" | "gltf" | "obj" | "stl" | "ply" | "off"', default: '"auto"' },
    {
      prop: "up",
      type: '"auto" | "y" | "z" | "-y": the file\'s up axis (STL defaults to z, a capture to -y)',
      default: '"auto"',
    },
    {
      prop: "engine",
      type: '"auto" | "cpu" | "gpu": the CPU engine is byte-exact everywhere, the GPU (WebGL) engine rasterizes big meshes; auto picks the GPU above ~40k triangles',
      default: '"auto"',
    },
    { prop: "color", type: "PixelColor: the dither fill", default: '"blue"' },
    {
      prop: "colors",
      type: "PixelColor[]: a toon ramp, dark to light; lighting picks the band, the Bayer cell dithers between bands",
      default: "undefined",
    },
    { prop: "dither", type: "number: ramp mode, 0 smooth → 1 banded", default: "1" },
    {
      prop: "material",
      type: "boolean: the file's own colours (materials, face and vertex colours)",
      default: "false",
    },
    { prop: "wire", type: "boolean: polygon outlines, hidden lines removed", default: "false" },
    {
      prop: "shader",
      type: "string: a GLSL material over the finished target. mainMaterial(out vec4, in vec2) reads dk_shade, dk_depth, dk_covered and dk_color per cell and returns rgb + the shade the Bayer cell thresholds (WebGL)",
      default: "undefined",
    },
    {
      prop: "channels",
      type: "ChannelInput[]: kit surfaces (pulled at the same clock time), canvases, images or videos; the first is the model's skin through its texture coordinates, a shader reads them as iChannel0..3 at dk_uv(p)",
      default: "undefined",
    },
    {
      prop: "grain / grainScale",
      type: "number: fbm grain over the model's own space, and its frequency",
      default: "0 / 4",
    },
    { prop: "bloom", type: '"off" | "low" | "high" | "aura" | config | seed: the glow layer', default: '"off"' },
    {
      prop: "animate / time",
      type: "boolean / number: play the file's animations (VRML ROUTEs, glTF) on the clock, or pin a moment",
      default: "true / undefined",
    },
    { prop: "seed", type: "number: dither matrix, grain + the sample world", default: "undefined" },
    { prop: "cell", type: "number: backing cell in CSS px", default: "3" },
    { prop: "autoRotate", type: "number: degrees per second, 0 holds", default: "12" },
    {
      prop: "yaw / pitch / zoom",
      type: "number: the pose; unset, the file's Viewpoint decides",
      default: "30 / 20 / 1",
    },
    { prop: "fov", type: "number: vertical field of view, degrees", default: "40" },
    { prop: "shade", type: "number: alpha of unlit cells inside the silhouette", default: "0.18" },
    { prop: "fog", type: "number: depth fade of the lighting", default: "0.3" },
    { prop: "interactive", type: "boolean: drag or arrow keys orbit", default: "true" },
    {
      prop: "build",
      type: "number: the model as a build, 0-1; its separate pieces rise from a dotted wire cage bottom to top, each flying in hot until it lands",
      default: "1",
    },
    { prop: "scatter", type: "number: the pieces blown apart and turned, 0 together → 1 apart", default: "0" },
    { prop: "heat", type: "PixelColor: the colour a piece glows in while it flies in", default: '"orange"' },
    { prop: "nudge", type: "boolean: pieces under the pointer lean away from it, then settle", default: "false" },
    { prop: "label", type: "string: accessible name", default: '"3D model"' },
    { prop: "frameRate", type: "number: stop-motion cadence in fps (0 = smooth)", default: "0" },
    { prop: "paused / renderMode", type: 'boolean / "live" | "static"', default: 'false / "live"' },
  ],
  shader: [
    { prop: "src", type: "string: URL of a .frag / .glsl file", default: "undefined" },
    {
      prop: "source",
      type: "string: inline GLSL (Shadertoy mainImage or a raw main); wins over src",
      default: "undefined",
    },
    {
      prop: "channels",
      type: "(surface | component | canvas | image | video)[]: bound as iChannel0..3; a kit surface is pulled at the same clock time, so the graph seeks and renders as one",
      default: "undefined",
    },
    {
      prop: "uniforms",
      type: "iResolution, iTime, iTimeDelta, iFrame, iMouse, iDate, iColor, iSeed, iChannel0..3 and iChannelResolution, plus time/resolution/mouse and u_time/u_resolution/u_mouse; dk_bayer4(fragCoord) is the kit's Bayer threshold",
      default: "",
    },
    { prop: "color", type: "PixelColor: the mono tint and iColor", default: '"blue"' },
    {
      prop: "colors",
      type: "PixelColor[]: a palette ramp; luminance picks the band, the Bayer cell dithers between bands",
      default: "undefined",
    },
    { prop: "mono", type: "boolean: 1-bit luminance in color instead of the shader's colours", default: "false" },
    { prop: "dither", type: "number: 0 smooth → 1 fully quantized", default: "1" },
    { prop: "levels", type: "number: colour levels per channel (2 = eight colours)", default: "2" },
    { prop: "shade", type: "number: in mono, the alpha floor of unlit cells", default: "0" },
    { prop: "speed", type: "number: multiplies iTime", default: "1" },
    { prop: "seed", type: "number: dither matrix + the sample shader", default: "undefined" },
    { prop: "cell", type: "number: backing cell in CSS px; the shader runs at this resolution", default: "3" },
    { prop: "interactive", type: "boolean: the pointer feeds iMouse", default: "true" },
    { prop: "label", type: "string: accessible name", default: '"Shader"' },
    { prop: "frameRate", type: "number: stop-motion cadence in fps (0 = smooth)", default: "0" },
    { prop: "paused / renderMode", type: 'boolean / "live" | "static"', default: 'false / "live"' },
  ],
}

const SNIPPET_VIDEO = `<DitherVideoPlayer
  src="/clips/launch.mp4"
  label="Launch recap"
  color="blue"
/>
<!-- native <video> under dither chrome: play · dithered scrubber ·
     tabular time · mute · fullscreen. No src = honest empty face. -->`

const SNIPPET_BRACKET = `<DitherBracket :rounds="rounds" interactive @pick="pick" />

<script setup>
function pick(r, m, side) {          // you own the data — advance the winner
  const match = rounds[r][m]
  match.winner = side
  const next = rounds[r + 1]?.[Math.floor(m / 2)]
  if (next) m % 2 === 0 ? (next.a = win(match)) : (next.b = win(match))
}
</script>`

const SNIPPET_ROCKET = `<script setup>
// one clock from the key: the file's moment, then the burst
const t = ref(0)
const scatter = computed(() => Math.min(1, Math.max(0, (t.value - 2.4) / 0.6)))
function fire() {
  const t0 = performance.now()
  const step = (now) => {
    t.value = Math.min(4.6, (now - t0) / 1000)
    if (t.value < 4.6) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}
const rocket = \`${ROCKET}\`
</script>

<DitherWorld :source="rocket" material animate :time="t" :scatter="scatter" bloom="low" :zoom="0.62" :yaw="20" :pitch="8" />
<DitherButton color="orange" @click="fire">Launch</DitherButton>`

// A Gaussian capture: the mascot as splats, served by the build.
const CAPTURE = assetPath(`/${CAPTURE_PATH}`)
const SNIPPET_CAPTURE = `<DitherWorld src="${CAPTURE}" up="y" material :auto-rotate="20" :fov="30" :zoom="1.35" :cell="2" />
<!-- a Gaussian capture: a .splat file, or the .ply a trained capture writes.
     Each Gaussian lands as its footprint on the cells, near to far until a
     cell is opaque; its colour and its light go through the same dither.
     A capture's y runs down, so up defaults to -y; this one was made y up. -->`

const SNIPPET_WORLD = `<DitherWorld src="/models/rover.glb" color="blue" :auto-rotate="12" wire />
<!-- .wrl (VRML97 / 1.0), .x3d, .gltf / .glb, .obj + .mtl, .stl, .ply, .off, .splat — by
     URL or inline. The file's materials, lights, viewpoint and animations are
     honoured. CPU engine by default (same bytes everywhere, frame-exact in
     the video export); engine="gpu" rasterizes big meshes through WebGL into
     the same dither. Drag or use the arrow keys to orbit. -->

<DitherWorld :source="world" :colors="['#0b1a3a', '#1f6fd6', '#9ec5ff', '#fff']" :grain="0.5" bloom="low" />
<!-- the kit's other engines in the shade: a palette ramp, fbm grain, bloom -->

<DitherWorld :source="world" :shader="ink" />
<!-- a GLSL material over the finished target: dk_depth / dk_shade / dk_covered /
     dk_color per cell; its alpha is the shade the Bayer cell thresholds -->

<DitherAurora ref="aurora" />
<DitherWorld :source="world" :channels="[aurora]" />
<!-- any kit surface (or an image, canvas, video) wrapped onto the model through
     its texture coordinates: primitives, OBJ vt, glTF TEXCOORD_0, VRML
     TextureCoordinate, PLY s/t. In a material the channels are iChannel0..3:
     dk_texture(p) samples the first at the cell's dk_uv(p) -->

<DitherWorld :source="world" :build="progress" :scatter="apart" heat="orange" nudge />
<!-- the model as a build: it comes apart along its own seams (each connected
     run of triangles is a piece), rises from a dotted wire cage bottom to top
     with the pieces in flight glowing in heat, blows apart with scatter, and
     leans away from the pointer with nudge. Drive build from a scroll. -->

<script setup>
// The default content is this seeded VRML97 file, parsed like any other:
const world = \`${WORLD}\`
</script>`

const SNIPPET_SHADER = `<DitherShader src="/shaders/plasma.frag" :levels="2" />
<!-- Shadertoy conventions (mainImage, iTime, iResolution, iMouse) or a raw
     main(); runs at the cell resolution, read back and ordered-dithered.
     Needs WebGL; iTime follows the kit clock, so it seeks and renders. -->

<DitherAurora ref="aurora" />
<DitherShader :channels="[aurora]" :source="crt" />
<!-- the render graph: any kit surface (or canvas, image, video) is iChannel0..3;
     a kit surface is pulled at the same clock time, so the chain seeks as one -->

<DitherShader :source="shader" mono color="blue" />

<script setup>
// The default content is this seeded shader, compiled like any other:
const shader = \`${SHADER}\`
</script>`

const SNIPPET_SCHEDULE = `<DitherSchedule
  :events="[
    { start: 9, end: 10.5, label: 'Standup', color: 'blue' },
    { start: 11, end: 12.5, label: 'Design review', color: 'purple' },
    { start: 14, end: 16, label: 'Focus block', color: 'green' },
  ]"
  :from="8" :to="18" :now="13.5"
/>
<!-- fractional hours: 13.5 is half past one -->`

/** A kit surface as a channel: its element goes to `ref` once it stands
 * (null again when it leaves), as a Vue template ref gave the consumer the
 * component, which the channels read by its element. */
function Source(props: { ref: (source: ChannelInput) => void; children: JSX.Element }) {
  const surface = children(() => props.children)
  onMount(() => {
    const el = surface()
    props.ref(el instanceof Element ? { $el: el } : null)
    onCleanup(() => props.ref(null))
  })
  return <>{surface()}</>
}

export default function MediaDocs() {
  /* Bracket: picking a winner advances them into the next round. */
  const [rounds, setRounds] = createStore<BracketMatch[][]>([
    [
      { a: "Bayer", b: "Ordered" },
      { a: "Halftone", b: "Threshold" },
    ],
    [{ a: "TBD", b: "TBD" }],
  ])
  function pick(r: number, m: number, side: "a" | "b") {
    setRounds(
      produce((rounds) => {
        const match = rounds[r][m]
        match.winner = side
        const winner = side === "a" ? match.a : match.b
        const next = rounds[r + 1]?.[Math.floor(m / 2)]
        if (next) {
          if (m % 2 === 0) next.a = winner
          else next.b = winner
        }
      }),
    )
  }
  function resetBracket() {
    setRounds(
      produce((rounds) => {
        rounds[0].forEach((m) => delete m.winner)
        rounds[1][0] = { a: "TBD", b: "TBD" }
      }),
    )
  }

  const [scheduleNow, setScheduleNow] = createSignal(13.5)

  const [worldWire, setWorldWire] = createSignal(false)
  const [worldRamp, setWorldRamp] = createSignal(false)
  const [worldGrain, setWorldGrain] = createSignal(false)
  const [worldBloom, setWorldBloom] = createSignal(false)
  const [worldEngine, setWorldEngine] = createSignal<"cpu" | "gpu">("cpu")
  const [worldInk, setWorldInk] = createSignal(false)
  const [worldTexture, setWorldTexture] = createSignal(false)
  const [worldBuild, setWorldBuild] = createSignal(1)
  const [worldScatter, setWorldScatter] = createSignal(0)
  const [worldNudge, setWorldNudge] = createSignal(false)
  /* The texture demo: a kit surface wrapped onto the probe through the
     primitives' own texture coordinates. */
  const [worldTexRef, setWorldTexRef] = createSignal<ChannelInput>(null)

  /* The render graph: a kit surface bound as iChannel0 of a CRT shader. */
  const [auroraRef, setAuroraRef] = createSignal<ChannelInput>(null)

  const [shaderMono, setShaderMono] = createSignal(false)

  // The rocket: one clock from the key, the file's moment and the burst;
  // under reduced motion the key goes straight to the debris.
  const [launchT, setLaunchT] = createSignal(0)
  const launch = createMemo(() => launchAt(launchT()))
  const flying = createMemo(() => launchT() > 0 && launchT() < LAUNCH_S)
  let launchRaf = 0
  function fire() {
    cancelAnimationFrame(launchRaf)
    if (pixelPrefersReducedMotion()) {
      setLaunchT(LAUNCH_S)
      return
    }
    const t0 = performance.now()
    const step = (now: number) => {
      setLaunchT(Math.min(LAUNCH_S, (now - t0) / 1000))
      launchRaf = launchT() < LAUNCH_S ? requestAnimationFrame(step) : 0
    }
    launchRaf = requestAnimationFrame(step)
  }
  onMount(() => onCleanup(() => cancelAnimationFrame(launchRaf)))

  const [captureColor, setCaptureColor] = createSignal(true)

  return (
    <>
      {/* Video player */}
      <section id="video-player" class="mt-16 scroll-mt-24">
        <h2 class="text-lg tracking-tight">Video player</h2>
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A native video under dither chrome: play, a dithered scrubber that really seeks, a volume slider, playback
          speed, mute, fullscreen, and player keyboard (Space, arrows, M, F). Without a source it shows an honest empty
          face instead of a broken box.
        </p>
        <DemoCard code={SNIPPET_VIDEO}>
          <div class="mx-auto max-w-md">
            <DitherVideoPlayer src={VIDEO_SRC} label="Flower sample clip" color="blue" />
          </div>
        </DemoCard>
        <PropsTable rows={API.video} />
      </section>

      {/* Bracket */}
      <section id="bracket" class="mt-16 scroll-mt-24">
        <h2 class="text-lg tracking-tight">Bracket</h2>
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A knockout bracket: winners carry the accent, losers strike through, connector rails bridge the rounds. This
          one is interactive: pick every winner and the final fills itself.
        </p>
        <DemoCard code={SNIPPET_BRACKET}>
          <div class="grid justify-items-center gap-3">
            {/* Centred while it fits; on the narrowest phones it scrolls. */}
            <div class="w-full overflow-x-auto">
              <div class="mx-auto w-max">
                <DitherBracket rounds={rounds} interactive color="green" onPick={pick} />
              </div>
            </div>
            <button
              type="button"
              class="text-[10px] text-muted-foreground transition-colors hover:text-foreground"
              onClick={resetBracket}
            >
              Reset bracket
            </button>
          </div>
        </DemoCard>
        <PropsTable rows={API.bracket} />
      </section>

      {/* Schedule */}
      <section id="schedule" class="mt-16 scroll-mt-24">
        <h2 class="text-lg tracking-tight">Schedule</h2>
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A day timeline: events sit proportionally on the hour rail, each with its swatch rail, and the red now line
          slides as the day moves. Drag the hour to move time.
        </p>
        <DemoCard code={SNIPPET_SCHEDULE}>
          <div class="mx-auto max-w-md">
            <label class="flex items-center gap-2 text-[11px] text-muted-foreground">
              now
              <input
                value={scheduleNow()}
                onInput={(e) => setScheduleNow(e.currentTarget.valueAsNumber)}
                type="range"
                min="8"
                max="18"
                step="0.25"
                class="h-6 w-40 accent-[var(--accent)]"
              />
              <span class="tabular-nums">
                {Math.floor(scheduleNow())}:{String(Math.round((scheduleNow() % 1) * 60)).padStart(2, "0")}
              </span>
            </label>
            <DitherSchedule
              class="mt-3"
              events={[
                { start: 9, end: 10.5, label: "Standup", color: "blue" },
                { start: 11, end: 12.5, label: "Design review", color: "purple" },
                { start: 14, end: 16, label: "Focus block", color: "green" },
                { start: 16.5, end: 17.5, label: "Client call", color: "orange" },
              ]}
              from={8}
              to={18}
              now={scheduleNow()}
            />
          </div>
        </DemoCard>
        <PropsTable rows={API.schedule} />
      </section>

      {/* World (3D) */}
      <section id="world" class="mt-16 scroll-mt-24">
        <h2 class="text-lg tracking-tight">World (3D)</h2>
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A 3D model viewer in the house raster: VRML, X3D, glTF / GLB, OBJ with its MTL, STL, PLY, OFF and Gaussian
          splats, by URL or inline, drawn on the CPU or through WebGL for big meshes. Files bring their own materials,
          lights and animations, played on the kit clock; any kit surface can skin the model (the aurora below), and any
          model comes apart along its seams and builds itself back. Drag to orbit.
        </p>
        <DemoCard code={SNIPPET_WORLD}>
          <div class="mx-auto max-w-md">
            <Show when={worldTexture()}>
              <Source ref={setWorldTexRef}>
                <DitherAurora colors={["#1f6fd6", "#9ec5ff", "#ffffff"]} speed={0.8} class="mb-2 h-[48px]" />
              </Source>
            </Show>
            <DitherWorld
              source={WORLD}
              wire={worldWire()}
              colors={worldRamp() ? RAMP : undefined}
              grain={worldGrain() ? 0.6 : 0}
              bloom={worldBloom() ? "low" : "off"}
              engine={worldEngine()}
              shader={worldInk() ? (worldTexture() ? INK_SKIN : INK) : undefined}
              channels={worldTexture() ? [worldTexRef()] : undefined}
              build={worldBuild()}
              scatter={worldScatter()}
              nudge={worldNudge()}
              color="blue"
              label="Sample probe, seed 7"
              class="h-[280px]"
            />
            <div class="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] text-muted-foreground">
              <label class="flex min-h-6 items-center gap-2">
                <input
                  checked={worldWire()}
                  onChange={(e) => setWorldWire(e.currentTarget.checked)}
                  type="checkbox"
                  class="accent-[var(--accent)]"
                />{" "}
                wire
              </label>
              <label class="flex min-h-6 items-center gap-2">
                <input
                  checked={worldInk()}
                  onChange={(e) => setWorldInk(e.currentTarget.checked)}
                  type="checkbox"
                  class="accent-[var(--accent)]"
                />{" "}
                ink
              </label>
              <label class="flex min-h-6 items-center gap-2">
                <input
                  checked={worldTexture()}
                  onChange={(e) => setWorldTexture(e.currentTarget.checked)}
                  type="checkbox"
                  class="accent-[var(--accent)]"
                />{" "}
                texture
              </label>
              <label class="flex min-h-6 items-center gap-2">
                <input
                  checked={worldRamp()}
                  onChange={(e) => setWorldRamp(e.currentTarget.checked)}
                  type="checkbox"
                  class="accent-[var(--accent)]"
                />{" "}
                ramp
              </label>
              <label class="flex min-h-6 items-center gap-2">
                <input
                  checked={worldGrain()}
                  onChange={(e) => setWorldGrain(e.currentTarget.checked)}
                  type="checkbox"
                  class="accent-[var(--accent)]"
                />{" "}
                grain
              </label>
              <label class="flex min-h-6 items-center gap-2">
                <input
                  checked={worldBloom()}
                  onChange={(e) => setWorldBloom(e.currentTarget.checked)}
                  type="checkbox"
                  class="accent-[var(--accent)]"
                />{" "}
                bloom
              </label>
              <label class="flex min-h-6 items-center gap-2">
                <input
                  checked={worldNudge()}
                  onChange={(e) => setWorldNudge(e.currentTarget.checked)}
                  type="checkbox"
                  class="accent-[var(--accent)]"
                />{" "}
                nudge
              </label>
              <label class="flex min-h-6 items-center gap-2">
                build
                <input
                  value={worldBuild()}
                  onInput={(e) => setWorldBuild(e.currentTarget.valueAsNumber)}
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
                  value={worldScatter()}
                  onInput={(e) => setWorldScatter(e.currentTarget.valueAsNumber)}
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
                  value={worldEngine()}
                  onChange={(e) => setWorldEngine(e.currentTarget.value as "cpu" | "gpu")}
                  class="h-6 rounded border border-border bg-background px-1 text-[11px] text-foreground"
                >
                  <option value="cpu">cpu</option>
                  <option value="gpu">gpu</option>
                </select>
              </label>
            </div>
          </div>
        </DemoCard>
        <p class="mt-6 text-[13px] leading-relaxed text-muted-foreground">
          A model's own animation and a build share one clock. This rocket is a VRML file: its flame flickers by its own
          TimeSensor, it climbs off the pad, and at the top the file swells a fireball while the page blows its pieces
          apart with scatter.
        </p>
        <DemoCard code={SNIPPET_ROCKET}>
          <div class="mx-auto max-w-md">
            <DitherWorld
              source={ROCKET}
              material
              animate
              time={launch().time}
              scatter={launch().scatter}
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
                {launchT() >= LAUNCH_S ? "Launch again" : "Launch"}
              </DitherButton>
            </div>
          </div>
        </DemoCard>
        <p class="mt-6 text-[13px] leading-relaxed text-muted-foreground">
          Gaussian splats print too: a capture is a cloud of soft ellipsoids, each laid on the cells as its footprint,
          near to far until a cell is opaque, and its colour and light go through the same dither. This one is our
          mascot, grown from its cell table into a body of splats with three electrons ringing it. Give it a .splat file
          or the .ply a trained capture writes.
        </p>
        <DemoCard code={SNIPPET_CAPTURE}>
          <div class="mx-auto max-w-md">
            <DitherWorld
              src={CAPTURE}
              up="y"
              material={captureColor()}
              autoRotate={20}
              fov={30}
              zoom={1.35}
              cell={2}
              color="grey"
              label="The mascot as a Gaussian capture"
              class="h-[280px]"
            />
            <div class="mt-3 flex justify-center text-[11px] text-muted-foreground">
              <label class="flex min-h-6 items-center gap-2">
                <input
                  checked={captureColor()}
                  onChange={(e) => setCaptureColor(e.currentTarget.checked)}
                  type="checkbox"
                  class="accent-current"
                />{" "}
                its own colours
              </label>
            </div>
          </div>
        </DemoCard>
        <PropsTable rows={API.world} />
      </section>

      {/* Shader (GLSL) */}
      <section id="shader" class="mt-16 scroll-mt-24">
        <h2 class="text-lg tracking-tight">Shader (GLSL)</h2>
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A fragment shader in the house raster: Shadertoy-style mainImage or a raw main, by URL or inline, run on the
          GPU at the cell resolution and dithered on the way back, one bit per channel or one tint. iTime is the kit
          clock, so it seeks and renders to video, and any kit surface can feed it as iChannel0..3. Below, an aurora
          through a CRT.
        </p>
        <DemoCard code={SNIPPET_SHADER}>
          <div class="mx-auto max-w-md">
            <DitherShader
              source={SHADER}
              mono={shaderMono()}
              color="blue"
              label="Sample plasma, seed 3"
              class="h-[280px]"
            />
            <label class="mt-3 flex min-h-6 items-center justify-center gap-2 text-[11px] text-muted-foreground">
              <input
                checked={shaderMono()}
                onChange={(e) => setShaderMono(e.currentTarget.checked)}
                type="checkbox"
                class="accent-[var(--accent)]"
              />
              mono
            </label>
            <div class="mt-4 grid grid-cols-[1fr_3fr] items-end gap-3" data-graph>
              <div>
                <p class="mb-1 text-[10px] text-muted-foreground">source: aurora</p>
                <Source ref={setAuroraRef}>
                  <DitherAurora colors={["#1f6fd6", "#9ec5ff", "#ffffff"]} speed={0.8} class="h-[70px]" />
                </Source>
              </div>
              <div>
                <p class="mb-1 text-[10px] text-muted-foreground">iChannel0 through a CRT shader</p>
                <DitherShader
                  channels={[auroraRef()]}
                  source={CRT}
                  label="Aurora through a CRT shader"
                  class="h-[200px]"
                />
              </div>
            </div>
          </div>
        </DemoCard>
        <PropsTable rows={API.shader} />
      </section>
    </>
  )
}
