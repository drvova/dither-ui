<script setup lang="ts">
import { reactive, ref } from "vue"
import { DitherBracket, DitherSchedule, DitherShader, DitherVideoPlayer, DitherWorld, sampleShader, sampleWorld, type BracketMatch } from "@dither-kit"
import DemoCard from "../DemoCard.vue"
import PropsTable, { type PropRow } from "../PropsTable.vue"

/* Public-domain sample clip (MDN CC0) — swap for your own src. */
const VIDEO_SRC = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"

/* Bracket: picking a winner advances them into the next round. */
const rounds = reactive<BracketMatch[][]>([
  [
    { a: "Bayer", b: "Ordered" },
    { a: "Halftone", b: "Threshold" },
  ],
  [{ a: "—", b: "—" }],
])
function pick(r: number, m: number, side: "a" | "b") {
  const match = rounds[r][m]
  match.winner = side
  const winner = side === "a" ? match.a : match.b
  const next = rounds[r + 1]?.[Math.floor(m / 2)]
  if (next) {
    if (m % 2 === 0) next.a = winner
    else next.b = winner
  }
}
function resetBracket() {
  rounds[0].forEach((m) => delete m.winner)
  rounds[1][0] = { a: "—", b: "—" }
}

const scheduleNow = ref(13.5)

/* World: the seeded sample is real VRML97 text, so the code tab shows the file. */
const WORLD = sampleWorld(7)
const worldWire = ref(false)

/* Shader: the seeded sample is real Shadertoy-style GLSL, shown in the code tab. */
const SHADER = sampleShader(3)
const shaderMono = ref(false)

const API: Record<string, PropRow[]> = {
  video: [
    { prop: "src", type: "string — no src renders an honest empty face", default: "undefined" },
    { prop: "poster", type: "string", default: "undefined" },
    { prop: "label", type: "string — accessible name", default: '"Video"' },
    { prop: "color", type: "PixelColor — scrubber and volume hue", default: '"blue"' },
    { prop: "keyboard", type: "Space/K play · ←→ seek 5s · ↑↓ volume · M mute · F fullscreen", default: "—" },
  ],
  bracket: [
    { prop: "rounds", type: "{ a, b, winner? }[][] — columns left to right", default: "required" },
    { prop: "color", type: "PixelColor — winner accent", default: '"green"' },
    { prop: "interactive", type: "boolean — click a side to pick", default: "false" },
    { prop: "@pick", type: "(round, match, side) — consumer advances the data", default: "—" },
  ],
  schedule: [
    { prop: "events", type: "{ start, end, label, color? }[] — fractional hours", default: "required" },
    { prop: "from / to", type: "number — day window", default: "8 / 18" },
    { prop: "now", type: "number — draws the now line; omit to hide", default: "undefined" },
  ],
  world: [
    { prop: "src", type: "string — URL of a .wrl (VRML97 / VRML 1.0), .obj or .stl", default: "undefined" },
    { prop: "source", type: "string — inline model text; wins over src", default: "undefined" },
    { prop: "format", type: '"auto" | "vrml" | "obj" | "stl"', default: '"auto"' },
    { prop: "up", type: '"auto" | "y" | "z" — the file\'s up axis (STL defaults to z)', default: '"auto"' },
    { prop: "color", type: "PixelColor — the dither fill", default: '"blue"' },
    { prop: "material", type: "boolean — use the file's own colours", default: "false" },
    { prop: "wire", type: "boolean — polygon outlines, hidden lines removed", default: "false" },
    { prop: "seed", type: "number — dither matrix + the sample world", default: "undefined" },
    { prop: "cell", type: "number — backing cell in CSS px", default: "3" },
    { prop: "autoRotate", type: "number — degrees per second, 0 holds", default: "12" },
    { prop: "yaw / pitch / zoom", type: "number — the pose; unset, the file's Viewpoint decides", default: "30 / 20 / 1" },
    { prop: "fov", type: "number — vertical field of view, degrees", default: "40" },
    { prop: "shade", type: "number — alpha of unlit cells inside the silhouette", default: "0.18" },
    { prop: "fog", type: "number — depth fade of the lighting", default: "0.3" },
    { prop: "interactive", type: "boolean — drag or arrow keys orbit", default: "true" },
    { prop: "label", type: "string — accessible name", default: '"3D model"' },
    { prop: "frameRate", type: "number — stop-motion cadence in fps (0 = smooth)", default: "0" },
    { prop: "paused / renderMode", type: 'boolean / "live" | "static"', default: 'false / "live"' },
  ],
  shader: [
    { prop: "src", type: "string — URL of a .frag / .glsl file", default: "undefined" },
    { prop: "source", type: "string — inline GLSL: Shadertoy mainImage or a raw main; wins over src", default: "undefined" },
    { prop: "uniforms", type: "iResolution · iTime · iTimeDelta · iFrame · iMouse · iDate, plus time/resolution/mouse and u_time/u_resolution/u_mouse", default: "—" },
    { prop: "color", type: "PixelColor — the mono tint", default: '"blue"' },
    { prop: "mono", type: "boolean — 1-bit luminance in color instead of the shader's colours", default: "false" },
    { prop: "dither", type: "number — 0 smooth → 1 fully quantized", default: "1" },
    { prop: "levels", type: "number — colour levels per channel (2 = eight colours)", default: "2" },
    { prop: "shade", type: "number — mono: alpha floor of unlit cells", default: "0" },
    { prop: "speed", type: "number — multiplies iTime", default: "1" },
    { prop: "seed", type: "number — dither matrix + the sample shader", default: "undefined" },
    { prop: "cell", type: "number — backing cell in CSS px; the shader runs at this resolution", default: "3" },
    { prop: "interactive", type: "boolean — the pointer feeds iMouse", default: "true" },
    { prop: "label", type: "string — accessible name", default: '"Shader"' },
    { prop: "frameRate", type: "number — stop-motion cadence in fps (0 = smooth)", default: "0" },
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
<\\/script>`

const SNIPPET_WORLD = `<DitherWorld src="/models/rover.wrl" color="blue" :auto-rotate="12" wire />
<!-- .wrl (VRML97 / 1.0), .obj and .stl, by URL or inline. Rasterized on the
     CPU through the Bayer engine: no GPU needed, the same bytes everywhere,
     frame-exact in the video export. Drag or use the arrow keys to orbit. -->

<DitherWorld :source="world" />

<script setup>
// The default content is this seeded VRML97 file, parsed like any other:
const world = \`${WORLD}\`
<\/script>`

const SNIPPET_SHADER = `<DitherShader src="/shaders/plasma.frag" :levels="2" />
<!-- Shadertoy conventions (mainImage, iTime, iResolution, iMouse) or a raw
     main(); runs at the cell resolution, read back and ordered-dithered.
     Needs WebGL; iTime follows the kit clock, so it seeks and renders. -->

<DitherShader :source="shader" mono color="blue" />

<script setup>
// The default content is this seeded shader, compiled like any other:
const shader = \`${SHADER}\`
<\/script>`

const SNIPPET_SCHEDULE = `<DitherSchedule
  :events="[
    { start: 9, end: 10.5, label: 'Standup', color: 'blue' },
    { start: 11, end: 12.5, label: 'Design review', color: 'purple' },
    { start: 14, end: 16, label: 'Focus block', color: 'green' },
  ]"
  :from="8" :to="18" :now="13.5"
/>
<!-- fractional hours: 13.5 is half past one -->`
</script>

<template>
  <!-- Video player -->
  <section id="video-player" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Video player</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A native video under dither chrome — play, a dithered scrubber that
      really seeks, a volume slider, playback speed, mute, fullscreen, and
      player keyboard (Space, arrows, M, F). Without a source it shows an
      honest empty face instead of a broken box.
    </p>
    <DemoCard :code="SNIPPET_VIDEO">
      <div class="mx-auto max-w-md">
        <DitherVideoPlayer :src="VIDEO_SRC" label="Flower sample clip" color="blue" />
      </div>
    </DemoCard>
    <PropsTable :rows="API.video" />
  </section>

  <!-- Bracket -->
  <section id="bracket" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Bracket</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A knockout bracket — winners carry the accent, losers strike through,
      connector rails bridge the rounds. This one is interactive: pick every
      winner and the final fills itself.
    </p>
    <DemoCard :code="SNIPPET_BRACKET">
      <div class="grid place-items-center gap-3">
        <DitherBracket :rounds="rounds" interactive color="green" @pick="pick" />
        <button
          type="button"
          class="text-[10px] text-muted-foreground transition-colors hover:text-foreground"
          @click="resetBracket"
        >
          Reset bracket
        </button>
      </div>
    </DemoCard>
    <PropsTable :rows="API.bracket" />
  </section>

  <!-- Schedule -->
  <section id="schedule" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Schedule</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A day timeline — events sit proportionally on the hour rail, each with
      its swatch rail, and the red now line slides as the day moves. Drag the
      hour to move time.
    </p>
    <DemoCard :code="SNIPPET_SCHEDULE">
      <div class="mx-auto max-w-md">
        <label class="flex items-center gap-2 text-[11px] text-muted-foreground">
          now
          <input v-model.number="scheduleNow" type="range" min="8" max="18" step="0.25" class="w-40 accent-[var(--accent)]" />
          <span class="tabular-nums">{{ Math.floor(scheduleNow) }}:{{ String(Math.round((scheduleNow % 1) * 60)).padStart(2, "0") }}</span>
        </label>
        <DitherSchedule
          class="mt-3"
          :events="[
            { start: 9, end: 10.5, label: 'Standup', color: 'blue' },
            { start: 11, end: 12.5, label: 'Design review', color: 'purple' },
            { start: 14, end: 16, label: 'Focus block', color: 'green' },
            { start: 16.5, end: 17.5, label: 'Client call', color: 'orange' },
          ]"
          :from="8"
          :to="18"
          :now="scheduleNow"
        />
      </div>
    </DemoCard>
    <PropsTable :rows="API.schedule" />
  </section>

  <!-- World (3D) -->
  <section id="world" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">World (3D)</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A 3D model viewer in the house raster: VRML97 and VRML 1.0 .wrl files,
      OBJ and STL, by URL or inline, orbited by a camera and drawn through
      the Bayer engine on the CPU, so the dither is the shading and no WebGL
      is involved. Drag to orbit; the file's materials, lights and viewpoint
      are honoured when present.
    </p>
    <DemoCard :code="SNIPPET_WORLD">
      <div class="mx-auto max-w-md">
        <DitherWorld :source="WORLD" :wire="worldWire" color="blue" label="Sample probe, seed 7" class="h-[280px]" />
        <label class="mt-3 flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
          <input v-model="worldWire" type="checkbox" class="accent-[var(--accent)]" />
          wire
        </label>
      </div>
    </DemoCard>
    <PropsTable :rows="API.world" />
  </section>

  <!-- Shader (GLSL) -->
  <section id="shader" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Shader (GLSL)</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A fragment shader in the house raster: Shadertoy-style mainImage or a
      raw main, by URL or inline, run on the GPU at the cell resolution and
      ordered-dithered on the way back — one bit per channel for the
      eight-colour look, or luminance in a single tint. iTime follows the kit
      clock, so it seeks and renders to video like everything else, and the
      pointer feeds iMouse.
    </p>
    <DemoCard :code="SNIPPET_SHADER">
      <div class="mx-auto max-w-md">
        <DitherShader :source="SHADER" :mono="shaderMono" color="blue" label="Sample plasma, seed 3" class="h-[280px]" />
        <label class="mt-3 flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
          <input v-model="shaderMono" type="checkbox" class="accent-[var(--accent)]" />
          mono
        </label>
      </div>
    </DemoCard>
    <PropsTable :rows="API.shader" />
  </section>
</template>
