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
import { Line, LineChart } from "@/shared/ui/charts"
import DemoCard from "../DemoCard"
import { MONTHS } from "../demo-data"
import DocSection, { useOpened } from "../DocSection"
import PropsTable, { kitTable, type PropRow } from "../PropsTable"
import lineChartProps from "virtual:dither-props/LineChart"
import { docsCode } from "../snippet"
import type { DitherColor } from "@dither-ui/kit"
import SeedsExample from "./examples/seeds"
import seedsCode from "./examples/seeds.tsx?raw"
import MotionExample from "./examples/motion"
import motionCode from "./examples/motion.tsx?raw"

const EngineSection = lazyPart(() => import("./EngineSection"))
const VerificationSection = lazyPart(() => import("./VerificationSection"))
if (import.meta.env.SSR) await Promise.all([EngineSection.preload(), VerificationSection.preload()])

export const API: Record<string, PropRow[]> = {
  motion: kitTable(lineChartProps, {
    only: ["animate", "animationDuration", "animationDelay", "replayToken", "effect"],
  }),
}

const effectData = MONTHS.map((month, i) => ({
  month,
  v: 8 + Math.sin(i * 0.7) * 3 + Math.sin(i * 1.9) * 1.5 + i * 0.4,
}))
const effectConfig = { v: { label: "signal", color: "blue" as DitherColor } }

const SNIPPETS = {
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
}

export default function HandbookDocs() {
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
        <DemoCard code={seedsCode}>
          <SeedsExample />
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
        <DemoCard code={motionCode}>
          <MotionExample />
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
