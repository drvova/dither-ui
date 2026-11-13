import { createSignal, For, onCleanup, onMount } from "solid-js"
import {
  DitherAvatar,
  DitherBadge,
  DitherButton,
  DitherCanvas,
  DitherConsole,
  DitherGrid,
  DitherInfiniteCanvas,
  DitherRail,
  DitherShell,
  DitherSidebarItem,
  DitherTooltip,
  Sparkline,
  type ConsoleLine,
} from "@dither-ui/kit"
import DemoCard from "../DemoCard"
import PropsTable, { type PropRow } from "../PropsTable"

const TREND = [12, 14, 13, 17, 16, 19, 22, 21, 24, 27, 26, 31]

const API: Record<string, PropRow[]> = {
  shell: [
    { prop: "frame", type: "boolean (embedded card chrome: border, rounding, clip)", default: "false" },
    { prop: "topbar / aside / statusbar / children", type: "JSX.Element (children: content)", default: "" },
  ],
  rail: [
    { prop: "label", type: "string (aria-label for the nav landmark)", default: '"Rail"' },
    { prop: "side", type: '"left" | "right" (flips the border edge)', default: '"left"' },
    {
      prop: "header / footer / children",
      type: "JSX.Element (children: items, labels fold automatically)",
      default: "",
    },
  ],
  console: [
    { prop: "lines", type: "(string | { text, level?, at? })[] (level: info | success | warn | error)", default: "[]" },
    { prop: "title", type: "string (header caption)", default: '"console"' },
    { prop: "follow", type: "boolean (pin the view to the newest line)", default: "true" },
    { prop: "caret", type: "boolean (blinking block caret, still under reduced motion)", default: "true" },
    { prop: "actions", type: "JSX.Element (right side of the header)", default: "" },
  ],
  canvas: [
    { prop: "pattern", type: '"dots" | "grid" | "plain"', default: '"dots"' },
    { prop: "cell", type: "number (pattern pitch in px)", default: "16" },
  ],
  grid: [
    { prop: "min", type: "number (minimum card width, columns auto-fit)", default: "240" },
    { prop: "cols", type: "number (fixed column count, overrides min)", default: "" },
    { prop: "gap", type: "string (any CSS length)", default: '"0.75rem"' },
  ],
  infinite: [
    { prop: "zoom", type: "number (with onUpdateZoom)", default: "1" },
    { prop: "minZoom / maxZoom", type: "number (clamp range)", default: "0.25 / 3" },
    { prop: "pattern", type: '"dots" | "grid" | "plain"', default: '"dots"' },
    { prop: "cell", type: "number (pattern pitch at zoom 1, px)", default: "16" },
    { prop: "label", type: "string (aria-label for the surface)", default: '"Infinite canvas"' },
  ],
}

const SNIPPET_SHELL = `const items = ["Overview", "Deploys", "Data", "Alerts"]
const [active, setActive] = createSignal("Overview")
const stats = [
  { label: "Requests", value: "84k", color: "blue", trend: [62, 70, 66, 78, 74, 86, 84] },
  { label: "Errors", value: "0.2%", color: "red", trend: [0.4, 0.3, 0.5, 0.3, 0.2, 0.3, 0.2] },
  { label: "P95", value: "212ms", color: "green", trend: [260, 240, 251, 230, 222, 218, 212] },
]
const log = [
  { text: "$ deploy --prod", at: "12:01" },
  { text: "build ok (4.2s)", at: "12:01", level: "success" },
]

<DitherShell frame class="h-96"
  topbar={
    <div class="flex h-10 w-full items-center justify-between px-3 text-[12px]">
      acme ops
      <DitherAvatar name="Ada Byte" size={22} />
    </div>
  }
  aside={
    <>
      {/* items fold to icons */}
      <DitherRail label="Primary">
        <For each={items}>
          {(i) => (
            <DitherTooltip text={i}>
              <DitherSidebarItem label={i} active={active() === i} onSelect={() => setActive(i)} />
            </DitherTooltip>
          )}
        </For>
      </DitherRail>
    </>
  }
  statusbar={
    <div class="flex h-7 w-full items-center px-3 text-[10px]">production: all systems normal</div>
  }
>

  <DitherCanvas pattern="dots" class="h-full p-4">
    {/* stat cards */}
    <DitherGrid min={130}>
      <For each={stats}>
        {(s) => (
          <div class="rounded-md border bg-background/70 p-3 text-[12px]">
            {s.label} <b>{s.value}</b>
            <Sparkline data={s.trend} color={s.color} class="h-8" />
          </div>
        )}
      </For>
    </DitherGrid>
    <DitherConsole lines={log} title="deploys" class="mt-3 h-36" />
  </DitherCanvas>
</DitherShell>`

const SNIPPET_RAIL = `import { DitherRail, DitherTooltip, DitherSidebarItem, DitherAvatar } from "@dither-kit"
const items = [
  { label: "Home", color: "blue" },
  { label: "Library", color: "blue", badge: 3 },
  { label: "Exports", color: "purple" },
]
const [active, setActive] = createSignal("Home")

{/* the rail provides the sidebar's collapsed context:
     DitherSidebarItem folds its label with zero extra props */}
<div class="flex h-72 overflow-hidden rounded-lg border">
  <DitherRail label="Primary"
    header={
      <div class="grid h-8 place-items-center"><span class="size-2.5 rounded-[2px] bg-foreground" /></div>
    }
    footer={<DitherAvatar name="Ada Byte" size={22} />}
  >
    {/* labels ride tooltips */}
    <For each={items}>
      {(i) => (
        <DitherTooltip text={i.label}>
          <DitherSidebarItem label={i.label} badge={i.badge} color={i.color}
            active={active() === i.label} onSelect={() => setActive(i.label)} />
        </DitherTooltip>
      )}
    </For>
  </DitherRail>
  <div class="grid flex-1 place-items-center text-[12px]">{active()}</div>
</div>`

const SNIPPET_CONSOLE = `const [lines, setLines] = createSignal([
  { text: "$ deploy --prod", at: "12:01" },
  { text: "building 34 routes…", at: "12:01" },
  { text: "build ok (4.2s)", at: "12:01", level: "success" },
])
const [deploying, setDeploying] = createSignal(false)

function deploy() {
  setDeploying(true)
  const steps = [
    { text: "uploading assets…" },
    { text: "warn: chunk over 300kB", level: "warn" },
    { text: "deployed to dither-ui.com", level: "success" },
  ]
  steps.forEach((line, i) =>
    setTimeout(() => {
      setLines([...lines(), { ...line, at: new Date().toTimeString().slice(0, 5) }])
      if (i === steps.length - 1) setDeploying(false)
    }, 450 * (i + 1)),
  )
}

{/* lines: strings or { text, level, at }; level tints through the palette
     (success, warn, error); follow keeps the newest line in view, and the
     caret blinks (held still under reduced motion) */}
<DitherConsole lines={lines()} title="deploy" class="h-48"
  actions={
    <DitherButton color="green" onClick={deploy} disabled={deploying()}>Run</DitherButton>
  }
/>`

const SNIPPET_CANVAS = `const [pattern, setPattern] = createSignal("dots")

<For each={['dots', 'grid', 'plain']}>
  {(p) => (
    <button type="button" class="px-2 text-[11px]"
      aria-pressed={pattern() === p} onClick={() => setPattern(p)}>{p}</button>
  )}
</For>

{/* inked with var(--border), content floats above */}
<DitherCanvas pattern={pattern()} cell={16} class="mt-3 h-56 rounded-lg border p-5">
  <div class="w-40 rounded-md border bg-background/80 p-3 text-[12px]">
    Artboard
    <p class="mt-1">Floats above the field</p>
  </div>
</DitherCanvas>`

const SNIPPET_GRID = `const [min, setMin] = createSignal(140)

<label class="flex items-center gap-2 text-[11px]">
  min card width
  <input value={min()} onInput={(e) => setMin(Number(e.currentTarget.value))} type="range" min="100" max="240" step="10" />
  {min()}px
</label>

{/* auto-fit by min card width */}
<DitherGrid min={min()} class="mt-3">
  <For each={Array.from({ length: 6 }, (_, k) => k + 1)}>{(i) => <div class="rounded-md border p-3 text-[10px]">Card {i}</div>}</For>
</DitherGrid>

{/* or a deliberate fixed count */}
<DitherGrid cols={3} gap="1rem" class="mt-3">
  <div class="col-span-2 rounded-md border p-3">wide</div>
  <div class="rounded-md border p-3">narrow</div>
</DitherGrid>`

const SNIPPET_INFINITE = `const [zoom, setZoom] = createSignal(1)

{/* drag pans, the wheel zooms toward the cursor, and the dot field
     rides the same transform, so space feels real */}
<p class="text-[11px]">drag to pan, wheel to zoom: {Math.round(zoom() * 100)}%</p>
<DitherInfiniteCanvas zoom={zoom()} onUpdateZoom={setZoom} class="mt-2 h-64 rounded-lg border">
  <div class="absolute w-40 rounded-md border bg-background/80 p-3 text-[12px]" style="left: 32px; top: 32px">
    Artboard A
  </div>
  <div class="absolute w-40 rounded-md border bg-background/80 p-3 text-[12px]" style="left: 280px; top: 150px">
    Artboard B
  </div>
</DitherInfiniteCanvas>`

const SHELL_STATS = [
  ["Requests", "84k", "blue"],
  ["Errors", "0.2%", "red"],
  ["P95", "212ms", "green"],
] as const

export default function LayoutDocs() {
  const [shellActive, setShellActive] = createSignal("Overview")

  /* Console demo: a fake deploy streams lines in. */
  const [consoleLines, setConsoleLines] = createSignal<ConsoleLine[]>([
    { text: "$ deploy --prod", at: "12:01" },
    { text: "building 34 routes…", at: "12:01" },
    { text: "build ok (4.2s)", at: "12:01", level: "success" },
  ])
  const [deploying, setDeploying] = createSignal(false)
  const deployTimers: number[] = []
  function deploy() {
    if (deploying()) return
    setDeploying(true)
    const at = () => new Date().toTimeString().slice(0, 5)
    const STEPS: ConsoleLine[] = [
      { text: "$ deploy --prod" },
      { text: "linting… 0 problems" },
      { text: "bundling client…" },
      { text: "warn: chunk over 300kB", level: "warn" },
      { text: "uploading assets…" },
      { text: "deployed to dither-ui.com", level: "success" },
    ]
    STEPS.forEach((s, i) =>
      deployTimers.push(
        window.setTimeout(
          () => {
            setConsoleLines([...consoleLines(), { ...s, at: at() }])
            if (i === STEPS.length - 1) setDeploying(false)
          },
          450 * (i + 1),
        ),
      ),
    )
  }
  onMount(() => onCleanup(() => deployTimers.forEach((t) => window.clearTimeout(t))))

  const [canvasPattern, setCanvasPattern] = createSignal<"dots" | "grid" | "plain">("dots")
  const [gridMin, setGridMin] = createSignal(140)
  const [canvasZoom, setCanvasZoom] = createSignal(1)

  return (
    <>
      {/* Shell */}
      <section id="dither-shell" class="mt-16 scroll-mt-24">
        <h2 class="text-lg tracking-tight">Shell</h2>
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          The app frame: topbar over an aside + content pair, statusbar under, every region a prop. Below, a whole SaaS
          dashboard from the layout family: rail, canvas, grid, sparkline cards, a live console.
        </p>
        <DemoCard code={SNIPPET_SHELL}>
          <DitherShell
            frame
            class="mx-auto h-[26rem] max-w-2xl"
            topbar={
              <div class="flex h-10 w-full items-center gap-2 px-3">
                <span class="inline-block size-2.5 rounded-[2px] bg-foreground" />
                <span class="text-[12px] tracking-tight text-foreground">acme ops</span>
                <span class="ml-auto rounded border border-border/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  ⌘K
                </span>
                <DitherAvatar name="Ada Byte" size={22} />
              </div>
            }
            aside={
              <DitherRail
                label="Primary"
                footer={
                  <div class="grid place-items-center border-t border-border/60 pt-2">
                    <DitherAvatar name="Rei Toma" size={20} color="purple" />
                  </div>
                }
              >
                <For each={["Overview", "Deploys", "Data", "Alerts"]}>
                  {(i) => (
                    <DitherTooltip text={i}>
                      <DitherSidebarItem
                        label={i}
                        color={i === "Alerts" ? "red" : "blue"}
                        badge={i === "Alerts" ? 2 : undefined}
                        active={shellActive() === i}
                        onSelect={() => setShellActive(i)}
                      />
                    </DitherTooltip>
                  )}
                </For>
              </DitherRail>
            }
            statusbar={
              <div class="flex h-7 w-full items-center gap-2 px-3 text-[10px] text-muted-foreground">
                <span class="size-1.5 rounded-full" style={{ background: "var(--swatch-green)" }} aria-hidden="true" />
                production: all systems normal
                <span class="ml-auto tabular-nums">{shellActive()}</span>
              </div>
            }
          >
            <DitherCanvas pattern="dots" class="h-full p-3">
              <DitherGrid min={130}>
                <For each={SHELL_STATS}>
                  {(s) => (
                    <div class="rounded-md border border-border/60 bg-background/70 p-2.5">
                      <div class="flex items-baseline justify-between">
                        <span class="text-[10px] text-muted-foreground">{s[0]}</span>
                        <span class="text-[13px] tabular-nums text-foreground">{s[1]}</span>
                      </div>
                      <Sparkline data={TREND} color={s[2]} class="mt-1.5 h-6" />
                    </div>
                  )}
                </For>
              </DitherGrid>
              <DitherConsole
                lines={consoleLines()}
                title="deploys"
                caret={false}
                class="mt-3 h-36"
                actions={
                  <DitherBadge color="green" class="text-[9px]">
                    live
                  </DitherBadge>
                }
              />
            </DitherCanvas>
          </DitherShell>
        </DemoCard>
        <PropsTable rows={API.shell} />
      </section>

      {/* Rail */}
      <section id="rail" class="mt-16 scroll-mt-24">
        <h2 class="text-lg tracking-tight">Rail</h2>
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          The permanent icon rail as a first-class piece. It provides the sidebar's collapsed context, so plain sidebar
          items fold their labels with zero extra props. Tooltips carry the words.
        </p>
        <DemoCard code={SNIPPET_RAIL}>
          <div class="mx-auto flex h-72 max-w-sm overflow-hidden rounded-lg border border-border/60">
            <DitherRail
              label="Demo rail"
              header={
                <div class="grid h-8 place-items-center">
                  <span class="inline-block size-2.5 rounded-[2px] bg-foreground" />
                </div>
              }
              footer={
                <div class="grid place-items-center border-t border-border/60 pt-2">
                  <DitherAvatar name="Ada Byte" size={22} />
                </div>
              }
            >
              <For each={["Home", "Library", "Exports"]}>
                {(i) => (
                  <DitherTooltip text={i}>
                    <DitherSidebarItem label={i} active={i === "Home"} />
                  </DitherTooltip>
                )}
              </For>
            </DitherRail>
            <div class="grid min-w-0 flex-1 place-items-center text-[12px] text-muted-foreground">Content</div>
          </div>
        </DemoCard>
        <PropsTable rows={API.rail} />
      </section>

      {/* Console */}
      <section id="console" class="mt-16 scroll-mt-24">
        <h2 class="text-lg tracking-tight">Console</h2>
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A monospace log surface: lines tint by level, follow mode pins the newest output, the caret blinks politely.
          Run the deploy and watch it stream.
        </p>
        <DemoCard code={SNIPPET_CONSOLE}>
          <div class="mx-auto max-w-lg">
            <DitherConsole
              lines={consoleLines()}
              title="deploy"
              class="h-52"
              actions={
                <DitherButton color="green" class="px-2 py-0.5 text-[10px]" disabled={deploying()} onClick={deploy}>
                  Run
                </DitherButton>
              }
            />
          </div>
        </DemoCard>
        <PropsTable rows={API.console} />
      </section>

      {/* Canvas */}
      <section id="canvas" class="mt-16 scroll-mt-24">
        <h2 class="text-lg tracking-tight">Canvas</h2>
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          The work surface a dashboard sits on: a dotted or ruled field inked with the border token, content floating
          above.
        </p>
        <DemoCard code={SNIPPET_CANVAS}>
          <div class="mx-auto max-w-lg">
            <div class="flex gap-1 rounded-md border border-border/60 p-0.5" role="group" aria-label="Pattern">
              <For each={["dots", "grid", "plain"] as const}>
                {(p) => (
                  <button
                    type="button"
                    aria-pressed={canvasPattern() === p}
                    class={`rounded px-2 py-0.5 text-[11px] transition-colors ${canvasPattern() === p ? "bg-card text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                    onClick={() => setCanvasPattern(p)}
                  >
                    {p}
                  </button>
                )}
              </For>
            </div>
            <DitherCanvas pattern={canvasPattern()} class="mt-3 h-56 rounded-lg border border-border/60 p-5">
              <div class="w-40 rounded-md border border-border/60 bg-background/80 p-3">
                <div class="text-[12px] text-muted-foreground">Artboard</div>
                <div class="mt-1 text-[12px] text-foreground">Floats above the field</div>
              </div>
            </DitherCanvas>
          </div>
        </DemoCard>
        <PropsTable rows={API.canvas} />
      </section>

      {/* Grid */}
      <section id="grid" class="mt-16 scroll-mt-24">
        <h2 class="text-lg tracking-tight">Grid</h2>
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Dashboard columns without media queries: cards auto-fit to a minimum width, or take a deliberate fixed count.
          Drag the number and watch the flow.
        </p>
        <DemoCard code={SNIPPET_GRID}>
          <div class="mx-auto max-w-lg">
            <label class="flex items-center gap-2 text-[11px] text-muted-foreground">
              min card width
              <input
                value={gridMin()}
                onInput={(e) => setGridMin(e.currentTarget.valueAsNumber)}
                type="range"
                min="100"
                max="240"
                step="10"
                class="h-6 w-40 accent-[var(--accent)]"
              />
              <span class="tabular-nums">{gridMin()}px</span>
            </label>
            <DitherGrid min={gridMin()} class="mt-3">
              <For each={[1, 2, 3, 4, 5, 6]}>
                {(i) => (
                  <div class="rounded-md border border-border/60 bg-background/60 p-3">
                    <div class="text-[10px] text-muted-foreground">Card {i}</div>
                    <div class="mt-1 h-2 w-2/3 rounded-sm bg-border/50" aria-hidden="true" />
                  </div>
                )}
              </For>
            </DitherGrid>
          </div>
        </DemoCard>
        <PropsTable rows={API.grid} />
      </section>

      {/* Infinite canvas */}
      <section id="infinite-canvas" class="mt-16 scroll-mt-24">
        <h2 class="text-lg tracking-tight">Infinite canvas</h2>
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A pannable, zoomable work surface: drag to pan, wheel to zoom toward the cursor, and the dot field rides the
          same transform so space feels real. The zoom is two-way: zoom with onUpdateZoom.
        </p>
        <DemoCard code={SNIPPET_INFINITE}>
          <div class="mx-auto max-w-lg">
            <div class="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>drag to pan, wheel to zoom</span>
              <span class="tabular-nums">{Math.round(canvasZoom() * 100)}%</span>
            </div>
            <DitherInfiniteCanvas
              zoom={canvasZoom()}
              onUpdateZoom={setCanvasZoom}
              class="mt-2 h-64 rounded-lg border border-border/60"
            >
              <div
                class="absolute w-40 rounded-md border border-border/60 bg-background/80 p-3"
                style={{ left: "32px", top: "32px" }}
              >
                <div class="text-[12px] text-muted-foreground">Artboard A</div>
                <div class="mt-1 text-[12px] text-foreground">Drag the field</div>
              </div>
              <div
                class="absolute w-40 rounded-md border border-border/60 bg-background/80 p-3"
                style={{ left: "280px", top: "150px" }}
              >
                <div class="text-[12px] text-muted-foreground">Artboard B</div>
                <div class="mt-1 text-[12px] text-foreground">Zoom finds me</div>
              </div>
            </DitherInfiniteCanvas>
          </div>
        </DemoCard>
        <PropsTable rows={API.infinite} />
      </section>
    </>
  )
}
