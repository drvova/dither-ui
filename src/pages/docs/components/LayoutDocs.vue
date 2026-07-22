<script setup lang="ts">
import { onUnmounted, ref } from "vue"
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
} from "@dither-kit"
import DemoCard from "../DemoCard.vue"
import PropsTable, { type PropRow } from "../PropsTable.vue"

const shellActive = ref("Overview")

/* Console demo: a fake deploy streams lines in. */
const consoleLines = ref<ConsoleLine[]>([
  { text: "$ deploy --prod", at: "12:01" },
  { text: "building 34 routes…", at: "12:01" },
  { text: "build ok (4.2s)", at: "12:01", level: "success" },
])
const deploying = ref(false)
let deployTimers: number[] = []
function deploy() {
  if (deploying.value) return
  deploying.value = true
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
      window.setTimeout(() => {
        consoleLines.value = [...consoleLines.value, { ...s, at: at() }]
        if (i === STEPS.length - 1) deploying.value = false
      }, 450 * (i + 1))
    )
  )
}
onUnmounted(() => deployTimers.forEach((t) => window.clearTimeout(t)))

const canvasPattern = ref<"dots" | "grid" | "plain">("dots")
const gridMin = ref(140)
const canvasZoom = ref(1)

const TREND = [12, 14, 13, 17, 16, 19, 22, 21, 24, 27, 26, 31]

const API: Record<string, PropRow[]> = {
  shell: [
    { prop: "frame", type: "boolean — embedded card chrome (border, rounding, clip)", default: "false" },
    { prop: "slots", type: "topbar · aside · statusbar · default (content)", default: "—" },
  ],
  rail: [
    { prop: "label", type: "string — aria-label for the nav landmark", default: '"Rail"' },
    { prop: "side", type: '"left" | "right" — flips the border edge', default: '"left"' },
    { prop: "slots", type: "header · footer · default (items — labels fold automatically)", default: "—" },
  ],
  console: [
    { prop: "lines", type: "(string | { text, level?, at? })[] — level: info | success | warn | error", default: "[]" },
    { prop: "title", type: "string — header caption", default: '"console"' },
    { prop: "follow", type: "boolean — pin the view to the newest line", default: "true" },
    { prop: "caret", type: "boolean — blinking block caret (still under reduced motion)", default: "true" },
    { prop: "slots", type: "actions — right side of the header", default: "—" },
  ],
  canvas: [
    { prop: "pattern", type: '"dots" | "grid" | "plain"', default: '"dots"' },
    { prop: "cell", type: "number — pattern pitch in px", default: "16" },
  ],
  grid: [
    { prop: "min", type: "number — minimum card width; columns auto-fit", default: "240" },
    { prop: "cols", type: "number — fixed column count (overrides min)", default: "—" },
    { prop: "gap", type: "string — any CSS length", default: '"0.75rem"' },
  ],
  infinite: [
    { prop: "zoom", type: "number (v-model:zoom)", default: "1" },
    { prop: "minZoom / maxZoom", type: "number — clamp range", default: "0.25 / 3" },
    { prop: "pattern", type: '"dots" | "grid" | "plain"', default: '"dots"' },
    { prop: "cell", type: "number — pattern pitch at zoom 1, px", default: "16" },
    { prop: "label", type: "string — aria-label for the surface", default: '"Infinite canvas"' },
  ],
}

const SNIPPET_SHELL = `<DitherShell frame class="h-96">
  <template #topbar>…brand · search · avatar…</template>
  <template #aside>
    <DitherRail label="Primary">          <!-- items fold to icons -->
      <DitherTooltip v-for="i in items" :text="i">
        <DitherSidebarItem :label="i" :active="active === i" @select="active = i" />
      </DitherTooltip>
    </DitherRail>
  </template>

  <DitherCanvas pattern="dots" class="h-full p-4">
    <DitherGrid :min="140">               <!-- stat cards -->
      <div v-for="s in stats" class="rounded-md border bg-background/70 p-3">
        {{ s.label }} <b>{{ s.value }}</b>
        <Sparkline :data="s.trend" :color="s.color" class="h-8" />
      </div>
    </DitherGrid>
    <DitherConsole :lines="log" class="mt-3 h-40" />
  </DitherCanvas>

  <template #statusbar>…env · status…</template>
</DitherShell>`

const SNIPPET_RAIL = `<DitherRail label="Primary">
  <template #header>…glyph…</template>
  <DitherTooltip v-for="i in items" :text="i.label">   <!-- labels ride tooltips -->
    <DitherSidebarItem :label="i.label" :badge="i.badge" :color="i.color"
      :active="active === i.label" @select="active = i.label" />
  </DitherTooltip>
  <template #footer><DitherAvatar name="Ada Byte" :size="22" /></template>
</DitherRail>

<!-- provides the sidebar's collapsed context —
     DitherSidebarItem folds its label with zero extra props -->`

const SNIPPET_CONSOLE = `<DitherConsole :lines="lines" title="deploy" class="h-48">
  <template #actions>
    <DitherButton color="green" @click="deploy" :disabled="deploying">Run</DitherButton>
  </template>
</DitherConsole>

<!-- lines: strings or { text, level, at } —
     level tints via the palette: success · warn · error.
     follow keeps the newest line in view; caret blinks (reduced motion: still) -->`

const SNIPPET_CANVAS = `<DitherCanvas :pattern="pattern" :cell="16" class="h-64 p-6">
  …artboards, cards, anything…
</DitherCanvas>

<!-- pattern: dots | grid | plain — inked with var(--border), content above -->`

const SNIPPET_GRID = `<DitherGrid :min="140">          <!-- auto-fit by min card width -->
  <div v-for="c in cards" class="rounded-md border p-3">{{ c }}</div>
</DitherGrid>

<DitherGrid :cols="3" gap="1rem">  <!-- or a deliberate fixed count -->
  <div class="col-span-2">wide</div>
  <div>narrow</div>
</DitherGrid>`

const SNIPPET_INFINITE = `<DitherInfiniteCanvas v-model:zoom="zoom" class="h-72 rounded-lg border">
  <div class="absolute" style="left: 40px; top: 40px">…an artboard…</div>
  <div class="absolute" style="left: 320px; top: 160px">…another…</div>
</DitherInfiniteCanvas>

<!-- drag pans · wheel zooms toward the cursor · the dot field
     rides the same transform, so space feels real -->`
</script>

<template>
  <!-- Shell -->
  <section id="dither-shell" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Shell</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      The app frame — topbar over an aside + content pair, statusbar under,
      every region a slot. Below: a whole SaaS dashboard from the layout
      family — rail, canvas, grid, sparkline cards, a live console.
    </p>
    <DemoCard :code="SNIPPET_SHELL">
      <DitherShell frame class="mx-auto h-[26rem] max-w-2xl">
        <template #topbar>
          <div class="flex h-10 w-full items-center gap-2 px-3">
            <span class="inline-block size-2.5 rounded-[2px] bg-foreground" />
            <span class="text-[12px] tracking-tight text-foreground">acme ops</span>
            <span class="ml-auto rounded border border-border/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">⌘K</span>
            <DitherAvatar name="Ada Byte" :size="22" />
          </div>
        </template>
        <template #aside>
          <DitherRail label="Primary">
            <DitherTooltip v-for="i in ['Overview', 'Deploys', 'Data', 'Alerts']" :key="i" :text="i">
              <DitherSidebarItem
                :label="i"
                :color="i === 'Alerts' ? 'red' : 'blue'"
                :badge="i === 'Alerts' ? 2 : undefined"
                :active="shellActive === i"
                @select="shellActive = i"
              />
            </DitherTooltip>
            <template #footer>
              <div class="grid place-items-center border-t border-border/60 pt-2">
                <DitherAvatar name="Rei Toma" :size="20" color="purple" />
              </div>
            </template>
          </DitherRail>
        </template>
        <DitherCanvas pattern="dots" class="h-full p-3">
          <DitherGrid :min="130">
            <div v-for="s in [['Requests', '84k', 'blue'], ['Errors', '0.2%', 'red'], ['P95', '212ms', 'green']]" :key="s[0]" class="rounded-md border border-border/60 bg-background/70 p-2.5">
              <div class="flex items-baseline justify-between">
                <span class="text-[10px] text-muted-foreground">{{ s[0] }}</span>
                <span class="text-[13px] tabular-nums text-foreground">{{ s[1] }}</span>
              </div>
              <Sparkline :data="TREND" :color="s[2] as 'blue'" class="mt-1.5 h-6" />
            </div>
          </DitherGrid>
          <DitherConsole :lines="consoleLines" title="deploys" :caret="false" class="mt-3 h-36">
            <template #actions>
              <DitherBadge color="green" class="text-[9px]">live</DitherBadge>
            </template>
          </DitherConsole>
        </DitherCanvas>
        <template #statusbar>
          <div class="flex h-7 w-full items-center gap-2 px-3 text-[10px] text-muted-foreground">
            <span class="size-1.5 rounded-full" :style="{ background: 'var(--swatch-green)' }" aria-hidden="true" />
            production — all systems normal
            <span class="ml-auto tabular-nums">{{ shellActive }}</span>
          </div>
        </template>
      </DitherShell>
    </DemoCard>
    <PropsTable :rows="API.shell" />
  </section>

  <!-- Rail -->
  <section id="rail" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Rail</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      The permanent icon rail as a first-class piece — it provides the
      sidebar's collapsed context, so plain sidebar items fold their labels
      with zero extra props. Tooltips carry the words.
    </p>
    <DemoCard :code="SNIPPET_RAIL">
      <div class="mx-auto flex h-72 max-w-sm overflow-hidden rounded-lg border border-border/60">
        <DitherRail label="Demo rail">
          <template #header>
            <div class="grid h-8 place-items-center">
              <span class="inline-block size-2.5 rounded-[2px] bg-foreground" />
            </div>
          </template>
          <DitherTooltip v-for="i in ['Home', 'Library', 'Exports']" :key="i" :text="i">
            <DitherSidebarItem :label="i" :active="i === 'Home'" />
          </DitherTooltip>
          <template #footer>
            <div class="grid place-items-center border-t border-border/60 pt-2">
              <DitherAvatar name="Ada Byte" :size="22" />
            </div>
          </template>
        </DitherRail>
        <div class="grid min-w-0 flex-1 place-items-center text-[12px] text-muted-foreground">Content</div>
      </div>
    </DemoCard>
    <PropsTable :rows="API.rail" />
  </section>

  <!-- Console -->
  <section id="console" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Console</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A monospace log surface — lines tint by level, follow mode pins the
      newest output, the caret blinks politely. Run the deploy and watch it
      stream.
    </p>
    <DemoCard :code="SNIPPET_CONSOLE">
      <div class="mx-auto max-w-lg">
        <DitherConsole :lines="consoleLines" title="deploy" class="h-52">
          <template #actions>
            <DitherButton color="green" class="px-2 py-0.5 text-[10px]" :disabled="deploying" @click="deploy">
              Run
            </DitherButton>
          </template>
        </DitherConsole>
      </div>
    </DemoCard>
    <PropsTable :rows="API.console" />
  </section>

  <!-- Canvas -->
  <section id="canvas" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Canvas</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      The work surface a dashboard sits on — a dotted or ruled field inked
      with the border token, content floating above.
    </p>
    <DemoCard :code="SNIPPET_CANVAS">
      <div class="mx-auto max-w-lg">
        <div class="flex gap-1 rounded-md border border-border/60 p-0.5" role="group" aria-label="Pattern">
          <button
            v-for="p in ['dots', 'grid', 'plain'] as const"
            :key="p"
            type="button"
            :aria-pressed="canvasPattern === p"
            class="rounded px-2 py-0.5 text-[11px] transition-colors"
            :class="canvasPattern === p ? 'bg-card text-foreground' : 'text-muted-foreground hover:text-foreground'"
            @click="canvasPattern = p"
          >
            {{ p }}
          </button>
        </div>
        <DitherCanvas :pattern="canvasPattern" class="mt-3 h-56 rounded-lg border border-border/60 p-5">
          <div class="w-40 rounded-md border border-border/60 bg-background/80 p-3">
            <div class="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/70">Artboard</div>
            <div class="mt-1 text-[12px] text-foreground">Floats above the field</div>
          </div>
        </DitherCanvas>
      </div>
    </DemoCard>
    <PropsTable :rows="API.canvas" />
  </section>

  <!-- Grid -->
  <section id="grid" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Grid</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Dashboard columns without media queries — cards auto-fit to a minimum
      width, or take a deliberate fixed count. Drag the number and watch the
      flow.
    </p>
    <DemoCard :code="SNIPPET_GRID">
      <div class="mx-auto max-w-lg">
        <label class="flex items-center gap-2 text-[11px] text-muted-foreground">
          min card width
          <input v-model.number="gridMin" type="range" min="100" max="240" step="10" class="w-40 accent-[var(--accent)]" />
          <span class="tabular-nums">{{ gridMin }}px</span>
        </label>
        <DitherGrid :min="gridMin" class="mt-3">
          <div v-for="i in 6" :key="i" class="rounded-md border border-border/60 bg-background/60 p-3">
            <div class="text-[10px] text-muted-foreground">Card {{ i }}</div>
            <div class="mt-1 h-2 w-2/3 rounded-sm bg-border/50" aria-hidden="true" />
          </div>
        </DitherGrid>
      </div>
    </DemoCard>
    <PropsTable :rows="API.grid" />
  </section>

  <!-- Infinite canvas -->
  <section id="infinite-canvas" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Infinite canvas</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A pannable, zoomable work surface — drag to pan, wheel to zoom toward
      the cursor, and the dot field rides the same transform so space feels
      real. The zoom is a v-model.
    </p>
    <DemoCard :code="SNIPPET_INFINITE">
      <div class="mx-auto max-w-lg">
        <div class="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>drag · wheel</span>
          <span class="tabular-nums">{{ Math.round(canvasZoom * 100) }}%</span>
        </div>
        <DitherInfiniteCanvas v-model:zoom="canvasZoom" class="mt-2 h-64 rounded-lg border border-border/60">
          <div class="absolute w-40 rounded-md border border-border/60 bg-background/80 p-3" style="left: 32px; top: 32px">
            <div class="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/70">Artboard A</div>
            <div class="mt-1 text-[12px] text-foreground">Drag the field</div>
          </div>
          <div class="absolute w-40 rounded-md border border-border/60 bg-background/80 p-3" style="left: 280px; top: 150px">
            <div class="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/70">Artboard B</div>
            <div class="mt-1 text-[12px] text-foreground">Zoom finds me</div>
          </div>
        </DitherInfiniteCanvas>
      </div>
    </DemoCard>
    <PropsTable :rows="API.infinite" />
  </section>
</template>
