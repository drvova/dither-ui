import { createSignal, For } from "solid-js"
import {
  Area,
  AreaChart,
  DitherAvatar,
  DitherGradient,
  DitherScreen,
  SCREEN_KINDS,
  type DitherColor,
  type ScreenKind,
} from "@dither-ui/kit"
import DemoCard from "../DemoCard"
import { dataCode } from "../snippet"
import PropsTable, { type PropRow } from "../PropsTable"

const LABELS: Record<ScreenKind, string> = {
  bayer: "Bayer",
  line: "Line",
  diagonal: "Hatch",
  dot: "Dot",
  cross: "Cross",
}
const ROWS = [12, 18, 15, 24, 21, 30, 27, 36].map((sessions, i) => ({
  day: i + 1,
  sessions,
  signups: Math.round(sessions * 0.55 + 4),
}))
const CHART = {
  sessions: { label: "Sessions", color: "blue" as DitherColor },
  signups: { label: "Signups", color: "orange" as DitherColor },
}

const CHIP = "rounded border px-2 py-1 text-[11px]"
const PICKED = "border-accent bg-accent/80 text-accent-foreground"
const UNPICKED = "border-border/60 text-muted-foreground hover:bg-accent/40"

const SNIPPET = `${dataCode("rows", ROWS)}
${dataCode("config", CHART)}

<DitherScreen screen="diagonal">
  <div class="grid gap-3 sm:grid-cols-[1fr_auto]">
    <AreaChart :data="rows" :config="config" class="h-36">
      <Area data-key="sessions" />
      <Area data-key="signups" />
    </AreaChart>
    <div class="flex items-center gap-3 sm:flex-col">
      <DitherAvatar name="print" :size="64" />
      <div class="relative h-16 w-28 overflow-hidden rounded-md">
        <DitherGradient from="purple" direction="right" />
      </div>
    </div>
  </div>
</DitherScreen>

<!-- or the matrices alone, for your own painter: screenMatrix("dot", seed)
     gives the 4x4 thresholds, read as m[y & 3][x & 3] -->`

const API: PropRow[] = [
  { prop: "screen", type: "'bayer' | 'line' | 'diagonal' | 'dot' | 'cross'", default: "'diagonal'" },
  { prop: "children", type: "content (every surface inside prints through the screen)", default: "" },
]

export default function ScreensSection() {
  /* One DitherScreen around three different surfaces: picking a screen
     reprints all of them, the chart's series included. */
  const [screen, setScreen] = createSignal<ScreenKind>("diagonal")

  return (
    <section id="print-screens" class="mt-16 scroll-mt-24">
      <h2 class="text-lg tracking-tight">Print screens</h2>
      <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
        Every surface thresholds its density through a 4x4 matrix, the Bayer one unless told otherwise.{" "}
        <code class="text-foreground/80">DitherScreen</code> swaps it for a printer's screen for everything inside it:
        lines, a falling hatch, clustered dots or a cross-hatch, charts included. A surface's seed still jitters
        whichever screen it prints through, and <code class="text-foreground/80">screenMatrix</code> hands the same
        thresholds to a painter of your own.
      </p>
      <DemoCard code={SNIPPET}>
        <div class="flex w-full flex-col gap-3">
          <DitherScreen screen={screen()}>
            <div class="grid gap-3 sm:grid-cols-[1fr_auto]">
              <div class="h-36 rounded-md bg-card p-2">
                <AreaChart data={ROWS} config={CHART} class="h-full">
                  <Area dataKey="sessions" />
                  <Area dataKey="signups" />
                </AreaChart>
              </div>
              <div class="flex items-center gap-3 sm:flex-col">
                <DitherAvatar name="print" size={64} />
                <div class="relative h-16 w-28 overflow-hidden rounded-md">
                  <DitherGradient from="purple" direction="right" />
                </div>
              </div>
            </div>
          </DitherScreen>
          <div class="flex flex-wrap justify-center gap-2">
            <For each={SCREEN_KINDS}>
              {(kind) => (
                <button
                  type="button"
                  class={`${CHIP} ${screen() === kind ? PICKED : UNPICKED}`}
                  aria-pressed={screen() === kind}
                  onClick={() => setScreen(kind)}
                >
                  {LABELS[kind]}
                </button>
              )}
            </For>
          </div>
        </div>
      </DemoCard>
      <PropsTable rows={API} />
    </section>
  )
}
