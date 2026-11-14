// The Handbook: how the kit is styled, composed, seeded, built, measured,
// moved and read. Prose and CodeBlocks, a demo where a claim is best seen;
// the Engine and the Verification read the model parsers and the world
// engine (the verification lab paints with them), so each is a chunk of its
// own, loaded only once its section opens (`useOpened`). A server renders a
// page whole, so it loads them first (as it does the packs).
import { DitherButton } from "@dither-ui/kit"
import { createSignal, For, Show } from "solid-js"
import { lazyPart } from "@/shared/lib"
import CodeBlock from "@/shared/ui/CodeBlock"
import { Area, AreaChart, Bar, BarChart, Line, LineChart, XAxis } from "@/shared/ui/charts"
import DemoCard from "../DemoCard"
import { config, MONTHS, rows, trafficConfig, trafficRows } from "../demo-data"
import DocSection, { useOpened } from "../DocSection"
import PropsTable, { type PropRow } from "../PropsTable"
import { dataCode, docsCode } from "../snippet"
import type { DitherColor } from "@dither-ui/kit"

const EngineSection = lazyPart(() => import("./EngineSection"))
const VerificationSection = lazyPart(() => import("./VerificationSection"))
if (import.meta.env.SSR) await Promise.all([EngineSection.preload(), VerificationSection.preload()])

const API: Record<string, PropRow[]> = {
  motion: [
    { prop: "animate", type: "boolean", default: "true" },
    { prop: "animationDuration", type: "number (ms)", default: "900" },
    { prop: "animationDelay", type: "number (ms)", default: "0" },
    { prop: "replayToken", type: "number (bump it to re-run)", default: "0" },
    { prop: "effect", type: "number (its own edge-motion seed)", default: "master seed / gentle" },
  ],
}

const DURATIONS = [300, 900, 2000]
const effectData = MONTHS.map((month, i) => ({
  month,
  v: 8 + Math.sin(i * 0.7) * 3 + Math.sin(i * 1.9) * 1.5 + i * 0.4,
}))
const effectConfig = { v: { label: "signal", color: "blue" as DitherColor } }

const SNIPPETS = {
  seeds: `${dataCode("rows", rows)}
${dataCode("config", config)}

{/* one integer is a complete visual personality */}
<AreaChart data={rows} config={config} seed={1984} class="h-52">
  <XAxis dataKey="month" maxTicks={6} />
  <Area dataKey="expenses" variant={1985} />
  <Area dataKey="revenue" variant={1984} />   {/* texture */}
</AreaChart>
{/* seed derives duration, delay, easing, stagger, sparkles and bloom
     for every prop you leave unset; explicit props always win.
     Seeds also work per prop: bloom, easing, variant, color (hue). */}
<DitherButton bloom={1984}>Glow</DitherButton>`,
  styling: `/* the kit reads shadcn-style tokens: theme by overriding them */
:root {
  --background: #08090b;   /* chart chrome: axes, legend, tooltip */
  --foreground: #ededed;
  --border: #22252b;
  --accent: #3f8ff3;
}

<!-- every component forwards class: compose with your utilities -->
<AreaChart class="rounded-lg border border-border/60 p-2" … />`,
  composition: `<AreaChart data={rows} config={config}>  {/* root: scales + context */}
  <Grid horizontal />                       {/* chrome registers first */}
  <XAxis dataKey="month" />
  <YAxis tickCount={4} />
  <Area dataKey="revenue" variant="gradient">
    <Dot variant="border" r={2} />         {/* series children nest */}
  </Area>
  <Legend align="right" />                  {/* reads the same context */}
  <Tooltip labelKey="month" />
</AreaChart>`,
  accessibility: `{/* one accessible node per chart, not 400 rects */}
<svg role="img" aria-label="Chart">…</svg>   {/* provided by the root */}
<canvas aria-hidden="true" />                {/* pixels stay silent */}

{/* honoured automatically, no opt-in props:
     @media (prefers-reduced-motion: reduce): entrances snap
     @media (prefers-reduced-transparency: reduce): chrome goes solid */}`,
  motion: `${dataCode("rows", trafficRows)}
${dataCode("config", trafficConfig)}
const [replayToken, setReplayToken] = createSignal(0)

<BarChart data={rows} config={config} class="h-48"
  animationDuration={900} replayToken={replayToken()}>
  <XAxis dataKey="month" />
  <Bar dataKey="organic" />
  <Bar dataKey="paid" />
</BarChart>

<DitherButton onClick={() => setReplayToken(replayToken() + 1)}>Replay</DitherButton>
{/* prefers-reduced-motion is respected automatically:
     entrances snap, sparkles hold still */}`,
}

export default function HandbookDocs() {
  // Master-seed playground: one integer drives texture, motion, easing, bloom.
  const [masterSeed, setMasterSeed] = createSignal(1984)
  const [masterReplay, setMasterReplay] = createSignal(0)
  function rollMaster() {
    setMasterSeed(Math.floor(Math.random() * 1_000_000))
    setMasterReplay((n) => n + 1)
  }

  // Motion demo — replay re-runs the entrance, duration is chosen live.
  const [replayToken, setReplayToken] = createSignal(0)
  const [motionDuration, setMotionDuration] = createSignal(900)

  // Generative live-edge motion — a dedicated effect seed samples an infinite
  // space of behaviors; roll for a fresh one.
  const [effectSeed, setEffectSeed] = createSignal(7)
  const rollEffect = () => setEffectSeed(Math.floor(Math.random() * 1_000_000))

  // The code blocks follow the styling switch like DemoCard tabs do.
  const fw = docsCode

  const engineOpen = useOpened("engine")
  const verificationOpen = useOpened("verification")

  return (
    <>
      {/* Styling */}
      <DocSection defer id="styling">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Pixels come from the palette seeds; chrome (axes, legend, tooltip, borders) reads shadcn-style CSS tokens.
          Override the tokens to theme, pass <code class="text-foreground/80">class</code> to compose with your own
          utilities.
        </p>
        <div class="mt-5">
          <CodeBlock code={fw(SNIPPETS.styling)} />
        </div>
      </DocSection>

      {/* Composition */}
      <DocSection defer id="composition">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A chart is a root plus parts. The root measures, builds scales and provides context; children register
          themselves: grid and axes as chrome, <code class="text-foreground/80">Area</code>/
          <code class="text-foreground/80">Line</code>/<code class="text-foreground/80">Bar</code> as series,{" "}
          <code class="text-foreground/80">Dot</code> nested inside a series. Order in the markup is paint order.
        </p>
        <div class="mt-5">
          <CodeBlock code={fw(SNIPPETS.composition)} />
        </div>
      </DocSection>

      {/* Seeds */}
      <DocSection defer id="seeds">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Everything visual in the kit resolves from deterministic seeds: avatars from names, colors from hues,
          textures, bloom, easing and motion from integers. Give a chart a <code class="text-foreground/80">seed</code>{" "}
          and it derives a whole personality for every prop you left unset; the same seed reproduces it forever.
          Explicit props always win.
        </p>
        <DemoCard code={SNIPPETS.seeds}>
          <div class="grid gap-5">
            <div class="h-52">
              {/* a new seed is a new chart */}
              <For each={[masterSeed()]}>
                {(seed) => (
                  <AreaChart data={rows} config={config} seed={seed} interactive={false} replayToken={masterReplay()}>
                    <XAxis dataKey="month" maxTicks={6} />
                    <Area dataKey="expenses" variant={seed + 1} />
                    <Area dataKey="revenue" variant={seed} />
                  </AreaChart>
                )}
              </For>
            </div>
            <div class="flex flex-wrap items-center justify-center gap-3">
              <DitherButton color="blue" variant="gradient" onClick={rollMaster}>
                Roll a personality
              </DitherButton>
              <span class="font-mono text-[11px] text-muted-foreground tabular-nums">seed: {masterSeed()}</span>
              <DitherButton color="purple" variant="dotted" bloom={masterSeed()}>
                seeded bloom
              </DitherButton>
            </div>
          </div>
        </DemoCard>
      </DocSection>

      {/* Engine: the parts under every surface, a figure each */}
      <Show when={engineOpen()}>
        <EngineSection />
      </Show>

      {/* Verification: the kit's claims measured in the reader's browser */}
      <Show when={verificationOpen()}>
        <VerificationSection />
      </Show>

      {/* Motion */}
      <DocSection defer id="motion">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Entrances draw the dither field in; bump <code class="text-foreground/80">replayToken</code> to run one again.
          When the OS asks for reduced motion, entrances snap and sparkles hold still. No opt-in needed.
        </p>
        <DemoCard code={SNIPPETS.motion}>
          <div class="grid gap-5">
            <div class="h-48">
              <BarChart
                data={trafficRows}
                config={trafficConfig}
                interactive={false}
                animationDuration={motionDuration()}
                replayToken={replayToken()}
              >
                <XAxis dataKey="month" />
                <Bar dataKey="organic" />
                <Bar dataKey="paid" />
              </BarChart>
            </div>
            <div class="flex flex-wrap items-center justify-center gap-3">
              <DitherButton color="blue" variant="gradient" onClick={() => setReplayToken((n) => n + 1)}>
                Replay
              </DitherButton>
              <div class="flex items-center gap-1 rounded-md border border-border/60 p-1">
                <For each={DURATIONS}>
                  {(d) => (
                    <button
                      type="button"
                      class={`rounded px-2.5 py-1 text-[11px] tabular-nums transition-colors ${
                        motionDuration() === d
                          ? "bg-card text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      onClick={() => {
                        setMotionDuration(d)
                        setReplayToken((n) => n + 1)
                      }}
                    >
                      {d}ms
                    </button>
                  )}
                </For>
              </div>
            </div>
          </div>
        </DemoCard>
        <h3 class="mt-8 text-[12px] text-muted-foreground">Live-edge motion</h3>
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          The live edge isn't a preset. It's a point in a continuous space of motion (drift, gravity, twinkle, trail,
          flow) AND particle shape (a generated glyph: dot, plus, x, streak, asterisk). A dedicated{" "}
          <code class="text-foreground/80">effect</code> seed samples one of infinitely many; roll for a fresh one.
        </p>
        <div class="mt-4 rounded-lg border border-border/60 p-4">
          <div class="h-44">
            {/* a new seed is a new chart */}
            <For each={[effectSeed()]}>
              {(seed) => (
                <LineChart data={effectData} config={effectConfig} effect={seed} interactive={false}>
                  <Line dataKey="v" />
                </LineChart>
              )}
            </For>
          </div>
          <div class="mt-4 flex flex-wrap items-center justify-center gap-3">
            <DitherButton color="blue" variant="gradient" onClick={rollEffect}>
              Roll a motion
            </DitherButton>
            <span class="font-mono text-[11px] text-muted-foreground tabular-nums">effect: {effectSeed()}</span>
          </div>
        </div>
        <PropsTable rows={API.motion} />
      </DocSection>

      {/* Accessibility */}
      <DocSection defer id="accessibility">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Canvases are decoration and stay <code class="text-foreground/80">aria-hidden</code>; each chart exposes a
          single labelled node instead of hundreds of shapes. Legends are real buttons. Reduced motion snaps entrances
          and stills the sparkles; reduced transparency solidifies floating chrome. Both follow the OS setting, no props
          required.
        </p>
        <div class="mt-5">
          <CodeBlock code={fw(SNIPPETS.accessibility)} />
        </div>
      </DocSection>
    </>
  )
}
