import { children, createSignal, type JSX, onCleanup, onMount } from "solid-js"
import { DitherAurora, DitherShader, type ChannelInput } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

// The default content is this seeded shader, compiled like any other:
const SHADER = `// dither-kit sample shader, seed 3 — Shadertoy conventions
vec3 palette(float t) {
  return vec3(0.561, 0.458, 0.449) + 0.5 * cos(6.28318 * (vec3(1.497, 1.341, 1.150) * t + vec3(0.662, 0.678, 0.219)));
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
  vec2 m = (iMouse.xy - 0.5 * iResolution.xy) / iResolution.y;
  float t = iTime * 0.434;
  float d = length(uv);
  float a = atan(uv.y, uv.x);
  float v = sin(d * 3.002 - t) + 0.723 * sin(a * 2.0 + t * 0.5) + sin(uv.x * 4.223 + uv.y * 4.134 + t * 0.7);
  v += 0.6 * exp(-6.0 * length(uv - m)) * step(0.5, iMouse.z);
  vec3 col = palette(v * 0.25 + t * 0.05) * smoothstep(1.2, 0.45, d);
  fragColor = vec4(col, 1.0);
}
`

// the render graph: a kit surface bound as iChannel0 of a CRT shader
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
  const [mono, setMono] = createSignal(false)
  const [aurora, setAurora] = createSignal<ChannelInput>(null)

  return (
    <div class="mx-auto max-w-md">
      {/* Shadertoy conventions (mainImage, iTime, iResolution, iMouse) or a raw
           main(), by URL (src) or inline (source); runs at the cell resolution, read
           back and ordered-dithered. Needs WebGL; iTime follows the kit clock, so it
           seeks and renders. */}
      <DitherShader source={SHADER} mono={mono()} color="blue" label="Sample plasma, seed 3" class="h-[280px]" />
      <label class="mt-3 flex min-h-6 items-center justify-center gap-2 text-[11px] text-muted-foreground">
        <input
          checked={mono()}
          onChange={(e) => setMono(e.currentTarget.checked)}
          type="checkbox"
          class="accent-[var(--accent)]"
        />
        mono
      </label>
      {/* channels bind any kit surface (or a canvas, image, video) as
           iChannel0..3, pulled at the same clock time, so the chain seeks as one */}
      <div class="mt-4 grid grid-cols-[1fr_3fr] items-end gap-3" data-graph>
        <div>
          <p class="mb-1 text-[10px] text-muted-foreground">source: aurora</p>
          <Source ref={setAurora}>
            <DitherAurora colors={["#1f6fd6", "#9ec5ff", "#ffffff"]} speed={0.8} class="h-[70px]" />
          </Source>
        </div>
        <div>
          <p class="mb-1 text-[10px] text-muted-foreground">iChannel0 through a CRT shader</p>
          <DitherShader channels={[aurora()]} source={CRT} label="Aurora through a CRT shader" class="h-[200px]" />
        </div>
      </div>
    </div>
  )
}

export const meta = defineExample({
  component: DitherShader,
  title: "Shader (GLSL)",
  studio: {
    group: "display",
    frame: { w: 320, h: 240 },
    controls: {
      src: { kind: "url", demo: "" },
      source: { demo: "" },
      color: {},
      colors: { kind: "list", demo: [] },
      mono: {},
      dither: { min: 0, max: 1, step: 0.05 },
      levels: { min: 2, max: 8, step: 1 },
      shade: { min: 0, max: 1, step: 0.02 },
      speed: { min: 0, max: 4, step: 0.1 },
      cell: { min: 1, max: 8, step: 1 },
      interactive: {},
      frameRate: { min: 0, max: 60, step: 1 },
      paused: {},
    },
  },
})
