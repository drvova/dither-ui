import { children, createMemo, createSignal, type JSX, onCleanup, onMount, Show } from "solid-js"
import { createStore, produce } from "solid-js/store"
import {
  DitherAurora,
  DitherBracket,
  DitherButton,
  DitherSchedule,
  DitherShader,
  DitherThumbnail,
  DitherWorld,
  sampleShader,
  sampleWorld,
  type BracketMatch,
  type ChannelInput,
} from "@dither-ui/kit"
import { launchAt, LAUNCH_S, ROCKET } from "@/pages/docs/components/rocket"
import { assetPath, routePath } from "@/shared/lib/routes"
import { CAPTURE_PATH } from "@/shared/ui/mascot-capture"
import { pixelPrefersReducedMotion } from "@dither-ui/kit/engine/pixel.ts"
import DemoCard from "../DemoCard"
import PropsTable, { kitTable, type PropRow } from "../PropsTable"
import thumbnailProps from "virtual:dither-props/DitherThumbnail"
import videoPlayerProps from "virtual:dither-props/DitherVideoPlayer"
import bracketProps from "virtual:dither-props/DitherBracket"
import scheduleProps from "virtual:dither-props/DitherSchedule"
import worldProps from "virtual:dither-props/DitherWorld"
import shaderProps from "virtual:dither-props/DitherShader"
import DocSection from "../DocSection"
import VideoPlayerExample from "./examples/video-player"
import videoPlayerCode from "./examples/video-player.tsx?raw"

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

export const API: Record<string, PropRow[]> = {
  thumbnail: kitTable(thumbnailProps),
  video: kitTable(videoPlayerProps, {
    // the player's keys
    add: {
      rows: [{ prop: "keyboard", type: "Space/K play, ←→ seek 5s, ↑↓ volume, M mute, F fullscreen", default: "" }],
    },
  }),
  bracket: kitTable(bracketProps),
  schedule: kitTable(scheduleProps, { join: [["from", "to"]] }),
  world: kitTable(worldProps, {
    join: [
      ["grain", "grainScale"],
      ["animate", "time"],
      ["yaw", "pitch", "zoom"],
      ["paused", "renderMode"],
    ],
  }),
  shader: kitTable(shaderProps, {
    join: [["paused", "renderMode"]],
    // what a shader's source may read
    add: {
      after: "channels",
      rows: [
        {
          prop: "uniforms",
          type: "iResolution, iTime, iTimeDelta, iFrame, iMouse, iDate, iColor, iSeed, iChannel0..3 and iChannelResolution, plus time/resolution/mouse and u_time/u_resolution/u_mouse; dk_bayer4(fragCoord) is the kit's Bayer threshold",
          default: "",
        },
      ],
    },
  }),
}

const SNIPPET_THUMBNAIL = `{/* a picture that is a link: it rests under a Bayer veil and wakes under a
     pointer, the picture scaling up a touch inside its frame as the veil goes */}
<div class="grid gap-4 sm:grid-cols-2">
  <DitherThumbnail src="/sprites.webp" alt="The sprite sheet, in the Image docs" href="/docs/image" />
  <DitherThumbnail
    src="/trailer/poster.webp"
    alt="The film's poster, in the Video player docs"
    href="/docs/video-player"
    ratio="16 / 9"
    veilCell={3}
  />
</div>`

const SNIPPET_BRACKET = `type Pairing = { a: string; b: string; winner?: "a" | "b" }

const [rounds, setRounds] = createSignal<Pairing[][]>([
  [{ a: "Bayer", b: "Ordered" }, { a: "Halftone", b: "Threshold" }],
  [{ a: "TBD", b: "TBD" }],
])

// you own the data: the winner advances into the next round
function pick(r: number, m: number, side: "a" | "b") {
  const next = rounds().map((round) => round.map((match) => ({ ...match })))
  const match = next[r][m]
  match.winner = side
  const ahead = next[r + 1]?.[Math.floor(m / 2)]
  if (ahead) ahead[m % 2 === 0 ? "a" : "b"] = match[side]
  setRounds(next)
}

<DitherBracket rounds={rounds()} interactive color="green" onPick={pick} />`

const SNIPPET_ROCKET = `// one clock from the key: the file's moment, then the burst
const [t, setT] = createSignal(0)
const scatter = createMemo(() => Math.min(1, Math.max(0, (t() - 2.4) / 0.6)))
function fire() {
  const t0 = performance.now()
  const step = (now) => {
    setT(Math.min(4.6, (now - t0) / 1000))
    if (t() < 4.6) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}
const rocket = \`${ROCKET}\`

<DitherWorld source={rocket} material animate time={t()} scatter={scatter()} bloom="low" zoom={0.62} yaw={20} pitch={8} />
<DitherButton color="orange" onClick={fire}>Launch</DitherButton>`

// A Gaussian capture: the mascot as splats, served by the build.
const CAPTURE = assetPath(`/${CAPTURE_PATH}`)
const SNIPPET_CAPTURE = `<DitherWorld src="${CAPTURE}" up="y" material autoRotate={20} fov={30} zoom={1.35} cell={2} class="h-72" />
{/* a Gaussian capture: a .splat file, or the .ply a trained capture writes.
     Each Gaussian lands as its footprint on the cells, near to far until a
     cell is opaque; its colour and its light go through the same dither.
     A capture's y runs down, so up defaults to -y; this one was made y up. */}`

const SNIPPET_WORLD = `// The default content is this seeded VRML97 file, parsed like any other:
const world = \`${WORLD}\`
// a GLSL material: ink where the depth jumps, a dimmer body inside
const ink = \`${INK}\`
const [built, setBuilt] = createSignal(0.6)

{/* .wrl (VRML97 / 1.0), .x3d, .gltf / .glb, .obj + .mtl, .stl, .ply, .off, .splat:
     by URL (src) or inline (source). The file's materials, lights, viewpoint
     and animations are honoured. CPU engine by default (same bytes everywhere,
     frame-exact in the video export); engine="gpu" rasterizes big meshes
     through WebGL into the same dither. Drag or use the arrow keys to orbit. */}
<div class="grid grid-cols-2 gap-3">
  <DitherWorld source={world} color="blue" autoRotate={12} wire class="h-40" />

  {/* the kit's other engines in the shade: a palette ramp, fbm grain, bloom */}
  <DitherWorld source={world} colors={['#0b1a3a', '#1f6fd6', '#9ec5ff', '#fff']} grain={0.5} bloom="low" class="h-40" />

  {/* a GLSL material over the finished target: dk_depth, dk_shade, dk_covered
       and dk_color per cell; its alpha is the shade the Bayer cell thresholds.
       channels wrap any kit surface (or an image, canvas, video) onto the model
       through its texture coordinates (primitives, OBJ vt, glTF TEXCOORD_0, VRML
       TextureCoordinate, PLY s/t): in a material they are iChannel0..3, and
       dk_texture(p) samples the first at the cell's dk_uv(p) */}
  <DitherWorld source={world} shader={ink} class="h-40" />

  {/* the model as a build: it comes apart along its own seams (each connected
       run of triangles is a piece), rises from a dotted wire cage bottom to top
       with the pieces in flight glowing in heat, blows apart with scatter, and
       leans away from the pointer with nudge. Drive build from a scroll. */}
  <DitherWorld source={world} build={built()} heat="orange" nudge class="h-40" />
</div>
<input value={built()} onInput={(e) => setBuilt(Number(e.currentTarget.value))} type="range" min="0" max="1" step="0.01" aria-label="Build" class="mt-3 w-full" />`

const SNIPPET_SHADER = `// The default content is this seeded shader, compiled like any other:
const shader = \`${SHADER}\`

<DitherShader source={shader} levels={2} class="h-64" />
{/* Shadertoy conventions (mainImage, iTime, iResolution, iMouse) or a raw
     main(), by URL (src) or inline (source); runs at the cell resolution, read
     back and ordered-dithered. Needs WebGL; iTime follows the kit clock, so it
     seeks and renders. channels bind any kit surface (or a canvas, image,
     video) as iChannel0..3, pulled at the same clock time, so the chain seeks
     as one */}

<DitherShader source={shader} mono color="blue" class="mt-3 h-64" />`

const SNIPPET_SCHEDULE = `<DitherSchedule
  events={[
    { start: 9, end: 10.5, label: 'Standup', color: 'blue' },
    { start: 11, end: 12.5, label: 'Design review', color: 'purple' },
    { start: 14, end: 16, label: 'Focus block', color: 'green' },
  ]}
  from={8} to={18} now={13.5}
/>
{/* fractional hours: 13.5 is half past one */}`

/** A kit surface as a channel: its element goes to `ref` once it stands
 * (null again when it leaves), which the channels read. */
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
      {/* Thumbnail */}
      <DocSection id="thumbnail">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A picture that is a link. It rests sunk under a Bayer veil and wakes under a pointer: the picture scales up a
          touch inside its frame as the veil dissolves, and the frame keeps its ratio (phi unless you pick one). The
          picture's words name the link.
        </p>
        <DemoCard code={SNIPPET_THUMBNAIL}>
          <div class="mx-auto grid max-w-xl gap-4 sm:grid-cols-2">
            <DitherThumbnail
              src={assetPath("/sprites.webp")}
              alt="The sprite sheet, in the Image docs"
              href={routePath("/docs/image")}
            />
            <DitherThumbnail
              src={assetPath("/trailer/poster.webp")}
              alt="The film's poster, in the Video player docs"
              href={routePath("/docs/video-player")}
              ratio="16 / 9"
              veilCell={3}
            />
          </div>
        </DemoCard>
        <PropsTable rows={API.thumbnail} />
      </DocSection>

      {/* Video player */}
      <DocSection id="video-player">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A native video under dither chrome: play, a dithered scrubber that really seeks, a volume slider, playback
          speed, mute, fullscreen, and player keyboard (Space, arrows, M, F). Without a source it shows an honest empty
          face instead of a broken box.
        </p>
        <DemoCard code={videoPlayerCode}>
          <div class="mx-auto max-w-md">
            <VideoPlayerExample />
          </div>
        </DemoCard>
        <PropsTable rows={API.video} />
      </DocSection>

      {/* Bracket */}
      <DocSection id="bracket">
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
      </DocSection>

      {/* Schedule */}
      <DocSection id="schedule">
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
      </DocSection>

      {/* World (3D) */}
      <DocSection id="world">
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
      </DocSection>

      {/* Shader (GLSL) */}
      <DocSection id="shader">
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
      </DocSection>
    </>
  )
}
