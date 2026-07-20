<script lang="ts">
  import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    LineChart,
    Line,
    XAxis,
    DitherButton,
    type DitherColor,
  } from "@dither-kit-svelte"
  import DemoCard from "./DemoCard.svelte"
  import PropsTable from "./PropsTable.svelte"
  import CodeBlock from "./CodeBlock.svelte"

  const GITHUB = "https://github.com/drvova/dither-ui"

  // Believable dashboard numbers, not sine waves.
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const revenue = [42, 51, 48, 63, 71, 68, 79, 86, 82, 94, 102, 118]
  const expenses = [31, 34, 33, 39, 44, 47, 46, 52, 55, 58, 61, 67]
  const rows = MONTHS.map((month, i) => ({ month, revenue: revenue[i], expenses: expenses[i] }))
  const config = {
    revenue: { label: "Revenue", color: "blue" as DitherColor },
    expenses: { label: "Expenses", color: "purple" as DitherColor },
  }

  const trafficRows = MONTHS.slice(0, 8).map((month, i) => ({
    month,
    organic: [820, 932, 901, 1290, 1330, 1320, 1450, 1682][i],
    paid: [420, 532, 501, 654, 690, 720, 810, 932][i],
  }))
  const trafficConfig = {
    organic: { label: "Organic", color: "green" as DitherColor },
    paid: { label: "Paid", color: "orange" as DitherColor },
  }

  // Master-seed playground: one integer drives texture, motion, easing, bloom.
  let masterSeed = $state(1984)
  let masterReplay = $state(0)
  function rollMaster() {
    masterSeed = Math.floor(Math.random() * 1_000_000)
    masterReplay++
  }

  // Motion demo — replay re-runs the entrance, duration is chosen live.
  let replayToken = $state(0)
  let motionDuration = $state(900)
  const DURATIONS = [300, 900, 2000]

  // Generative live-edge motion — a dedicated effect seed samples an infinite
  // space of behaviors; roll for a fresh one.
  let effectSeed = $state(7)
  const rollEffect = () => (effectSeed = Math.floor(Math.random() * 1_000_000))
  const effectData = MONTHS.map((month, i) => ({
    month,
    v: 8 + Math.sin(i * 0.7) * 3 + Math.sin(i * 1.9) * 1.5 + i * 0.4,
  }))
  const effectConfig = { v: { label: "signal", color: "blue" as DitherColor } }

  const motionRows = [
    { prop: "animate", type: "boolean", default: "true" },
    { prop: "animationDuration", type: "number (ms)", default: "900" },
    { prop: "animationDelay", type: "number (ms)", default: "0" },
    { prop: "replayToken", type: "number — bump to re-run", default: "0" },
    { prop: "effect", type: "number — dedicated edge-motion seed", default: "master seed / gentle" },
  ]

  const SNIPPETS = {
    install: `# 1 — copy the kit folder straight from the repo (degit grabs just the folder)
npx degit drvova/dither-ui/dither-kit-svelte src/dither-kit-svelte

# 2 — install the runtime deps (Svelte & Tailwind you already have)
npm i d3-scale d3-shape clsx tailwind-merge

# 3 — alias @dither-kit-svelte so imports stay clean
#     vite.config.ts \u2192 resolve.alias: { "@dither-kit-svelte": "/src/dither-kit-svelte" }
#     tsconfig.json  \u2192 paths:        { "@dither-kit-svelte": ["./src/dither-kit-svelte"] }

# 4 — use it
import { AreaChart, Area, DitherButton } from "@dither-kit-svelte"`,
    styling: `/* the kit reads shadcn-style tokens — theme by overriding them */
:root {
  --background: #08090b;   /* chart chrome: axes, legend, tooltip */
  --foreground: #ededed;
  --border: #22252b;
  --accent: #3f8ff3;
}

<!-- every component forwards class — compose with your utilities -->
<AreaChart class="rounded-lg border border-border/60 p-2" … />`,
    composition: `<AreaChart {data} {config}>          <!-- root: scales + context -->
  <Grid horizontal />                <!-- chrome registers first -->
  <XAxis dataKey="month" />
  <YAxis tickCount={4} />
  <Area dataKey="revenue" variant="gradient">
    <Dot variant="border" r={2} />   <!-- series children nest -->
  </Area>
  <Legend align="right" />           <!-- reads the same context -->
  <Tooltip labelKey="month" />
</AreaChart>`,
    accessibility: `<!-- one accessible node per chart, not 400 rects -->
<svg role="img" aria-label="Chart">…</svg>   <!-- provided by the root -->
<canvas aria-hidden="true" />                <!-- pixels stay silent -->

/* honored automatically — no opt-in props */
@media (prefers-reduced-motion: reduce)       { /* entrances snap  */ }
@media (prefers-reduced-transparency: reduce) { /* chrome goes solid */ }`,
    seeds: `<!-- one integer is a complete visual personality: -->
<AreaChart {data} {config} seed={1984}>
  <Area dataKey="revenue" variant={1984} />   <!-- texture  -->
</AreaChart>
<!-- seed derives duration · delay · easing · stagger · sparkles · bloom
     for every prop you leave unset; explicit props always win.
     Seeds also work per prop: bloom / easing / variant / color(hue). -->
<DitherButton bloom={1984}>Glow</DitherButton>`,
    motion: `let replayToken = $state(0)

<BarChart {data} {config}
  animationDuration={900} replayToken={replayToken}>
  <Bar dataKey="revenue" />
</BarChart>

<DitherButton onclick={() => replayToken++}>Replay</DitherButton>
<!-- prefers-reduced-motion is respected automatically:
     entrances snap, sparkles hold still -->`,
  }
</script>

<!-- Quick start -->
<section id="getting-started" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Quick start</h2>
  <p class="mt-3 text-[13px] leading-relaxed text-muted-foreground">
    The kit is a folder, not a package. Copy
    <code class="text-foreground/80">dither-kit-svelte/</code> straight from the
    <a
      href={GITHUB}
      target="_blank"
      rel="noreferrer"
      class="text-foreground/80 underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground/60"
      >GitHub repo</a
    >, install the runtime deps, and alias it — Svelte 5 and Tailwind you
    already have.
  </p>
  <div class="mt-5"><CodeBlock code={SNIPPETS.install} /></div>
  <p class="mt-4 text-[12px] leading-relaxed text-muted-foreground/80">
    Prefer to read the source first? Every component lives under
    <a
      href="{GITHUB}/tree/master/dither-kit-svelte"
      target="_blank"
      rel="noreferrer"
      class="text-foreground/80 underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground/60"
      >dither-kit-svelte/</a
    > — no build step, no black box.
  </p>
</section>

<!-- Styling -->
<section id="styling" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Styling</h2>
  <p class="mt-3 text-[13px] leading-relaxed text-muted-foreground">
    Pixels come from the palette seeds; chrome — axes, legend, tooltip, borders
    — reads shadcn-style CSS tokens. Override the tokens to theme, pass
    <code class="text-foreground/80">class</code> to compose with your own utilities.
  </p>
  <div class="mt-5"><CodeBlock code={SNIPPETS.styling} /></div>
</section>

<!-- Composition -->
<section id="composition" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Composition</h2>
  <p class="mt-3 text-[13px] leading-relaxed text-muted-foreground">
    A chart is a root plus parts. The root measures, builds scales and provides
    context; children register themselves — grid and axes as chrome,
    <code class="text-foreground/80">Area</code>/<code class="text-foreground/80">Line</code>/<code class="text-foreground/80">Bar</code>
    as series, <code class="text-foreground/80">Dot</code> nested inside a series.
    Order in the template is paint order.
  </p>
  <div class="mt-5"><CodeBlock code={SNIPPETS.composition} /></div>
</section>

<!-- Seeds -->
<section id="seeds" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Seeds</h2>
  <p class="mt-3 text-[13px] leading-relaxed text-muted-foreground">
    Everything visual in the kit resolves from deterministic seeds — avatars
    from names, colors from hues, textures, bloom, easing and motion from
    integers. Give a chart a <code class="text-foreground/80">seed</code> and it
    derives a whole personality for every prop you left unset; the same seed
    reproduces it forever. Explicit props always win.
  </p>
  <DemoCard code={SNIPPETS.seeds}>
    <div class="grid gap-5">
      <div class="h-52">
        {#key masterSeed}
          <AreaChart data={rows} {config} seed={masterSeed} interactive={false} replayToken={masterReplay}>
            <XAxis dataKey="month" maxTicks={6} />
            <Area dataKey="expenses" variant={masterSeed + 1} />
            <Area dataKey="revenue" variant={masterSeed} />
          </AreaChart>
        {/key}
      </div>
      <div class="flex flex-wrap items-center justify-center gap-3">
        <DitherButton color="blue" variant="gradient" onclick={rollMaster}>Roll a personality</DitherButton>
        <span class="font-mono text-[11px] text-muted-foreground tabular-nums">seed: {masterSeed}</span>
        <DitherButton color="purple" variant="dotted" bloom={masterSeed}>seeded bloom</DitherButton>
      </div>
    </div>
  </DemoCard>
</section>

<!-- Accessibility -->
<section id="accessibility" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Accessibility</h2>
  <p class="mt-3 text-[13px] leading-relaxed text-muted-foreground">
    Canvases are decoration and stay <code class="text-foreground/80">aria-hidden</code>;
    each chart exposes a single labelled node instead of hundreds of shapes.
    Legends are real buttons. Reduced motion snaps entrances and stills the
    sparkles; reduced transparency solidifies floating chrome — both from the OS
    setting, no props required.
  </p>
  <div class="mt-5"><CodeBlock code={SNIPPETS.accessibility} /></div>
</section>

<!-- Motion -->
<section id="motion" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Motion</h2>
  <p class="mt-3 text-[13px] leading-relaxed text-muted-foreground">
    Entrances draw the dither field in; bump
    <code class="text-foreground/80">replayToken</code> to run one again. When the
    OS asks for reduced motion, entrances snap and sparkles hold still — no opt-in
    needed.
  </p>
  <DemoCard code={SNIPPETS.motion}>
    <div class="grid gap-5">
      <div class="h-48">
        <BarChart data={trafficRows} config={trafficConfig} interactive={false} animationDuration={motionDuration} replayToken={replayToken}>
          <XAxis dataKey="month" />
          <Bar dataKey="organic" />
          <Bar dataKey="paid" />
        </BarChart>
      </div>
      <div class="flex flex-wrap items-center justify-center gap-3">
        <DitherButton color="blue" variant="gradient" onclick={() => replayToken++}>Replay</DitherButton>
        <div class="flex items-center gap-1 rounded-md border border-border/60 p-1">
          {#each DURATIONS as d (d)}
            <button
              type="button"
              class="rounded px-2.5 py-1 text-[11px] tabular-nums transition-colors {motionDuration === d
                ? 'bg-card text-foreground'
                : 'text-muted-foreground hover:text-foreground'}"
              onclick={() => { motionDuration = d; replayToken++ }}
            >
              {d}ms
            </button>
          {/each}
        </div>
      </div>
    </div>
  </DemoCard>
  <h3 class="mt-8 text-[10px] uppercase tracking-[0.25em] text-muted-foreground/70">live-edge motion</h3>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    The live edge isn't a preset — it's a point in a continuous space of motion
    (drift, gravity, twinkle, trail, flow) AND particle shape (a generated glyph:
    dot, plus, x, streak, asterisk). A dedicated
    <code class="text-foreground/80">effect</code> seed samples one of infinitely
    many; roll for a fresh one.
  </p>
  <div class="mt-4 rounded-lg border border-border/60 p-4">
    <div class="h-44">
      {#key effectSeed}
        <LineChart data={effectData} config={effectConfig} effect={effectSeed} interactive={false}>
          <Line dataKey="v" />
        </LineChart>
      {/key}
    </div>
    <div class="mt-4 flex flex-wrap items-center justify-center gap-3">
      <DitherButton color="blue" variant="gradient" onclick={rollEffect}>Roll a motion</DitherButton>
      <span class="font-mono text-[11px] text-muted-foreground tabular-nums">effect: {effectSeed}</span>
    </div>
  </div>
  <PropsTable rows={motionRows} />
</section>
