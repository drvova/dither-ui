<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, useId, watch } from "vue"
import { CodeBlock } from "@/shared/ui"
import { setStyling, STYLING_LABELS } from "@/shared/lib/restyle"
import { boxOf, labelOf, readingOf, walk, type Box, type Reading } from "./inspector"
import { docsCode, docsFramework, docsStyling, docsStylings, setDocsFramework } from "./svelte"

const props = defineProps<{ code: string }>()
const tab = ref<"preview" | "code">("preview")
const host = ref<HTMLElement | null>(null)

// Mount the heavy slot (canvases, charts, whole demo trees) only as the card
// approaches the viewport — and latch: once revealed it stays, so interaction
// state inside a demo never resets on scroll. Falls back to always-on without
// IntersectionObserver (jsdom included), keeping tests and ancient engines on
// the old behaviour. The preview frame keeps min-h-[280px], so the box exists
// from first paint and below-fold growth never shifts visible content.
const revealed = ref(false)
let io: IntersectionObserver | null = null

onMounted(() => {
  if (typeof IntersectionObserver === "undefined" || !host.value) {
    revealed.value = true
    return
  }
  io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        revealed.value = true
        io?.disconnect()
        io = null
      }
    },
    { rootMargin: "600px" },
  )
  io.observe(host.value)
})
onBeforeUnmount(() => {
  io?.disconnect()
  cancelAnimationFrame(raf)
})

// Inspect (after Kobra's workbench): px rulers along the frame, the element
// under the pointer boxed in ember with its size, a click PINS it without
// reaching the demo, the readout under the frame gives its computed box,
// type, colours, radius and padding; arrows walk the tree, Escape unpins and
// then steps out. Off until asked — the measuring rAF runs only while on.
const inspecting = ref(false)
const stage = ref<HTMLElement | null>(null)
const content = ref<HTMLElement | null>(null)
const toggle = ref<HTMLButtonElement | null>(null)
const hovered = shallowRef<Element | null>(null)
const pinned = shallowRef<Element | null>(null)
const reading = ref<Reading | null>(null)
const ghost = ref<Box | null>(null)
const size = ref({ w: 0, h: 0 })
const announce = ref("")
const hintId = useId()
let raf = 0

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)
function measure() {
  raf = requestAnimationFrame(measure)
  const s = stage.value
  if (!s) return
  if (pinned.value && !pinned.value.isConnected) pinned.value = null
  const w = s.clientWidth
  const h = s.clientHeight
  if (w !== size.value.w || h !== size.value.h) size.value = { w, h }
  const target = pinned.value ?? hovered.value
  const next = target?.isConnected ? readingOf(target, s) : null
  if (!same(next, reading.value)) reading.value = next
  const other =
    pinned.value && hovered.value !== pinned.value && hovered.value?.isConnected ? boxOf(hovered.value, s) : null
  if (!same(other, ghost.value)) ghost.value = other
}

watch(inspecting, (on) => {
  cancelAnimationFrame(raf)
  hovered.value = pinned.value = reading.value = ghost.value = null
  if (on) raf = requestAnimationFrame(measure)
})
watch(tab, (t) => t === "code" && (inspecting.value = false))
watch(pinned, (el) => {
  const b = el && stage.value ? boxOf(el, stage.value) : null
  announce.value = el && b ? `${labelOf(el)}, ${b.w} by ${b.h} pixels` : ""
})

const inside = (t: EventTarget | null) =>
  t instanceof Element && t !== content.value && content.value?.contains(t) ? t : null
function onOver(e: PointerEvent) {
  if (inspecting.value) hovered.value = inside(e.target)
}
// The demo never sees a press while inspecting: no drag, no focus, no click.
function onPress(e: Event) {
  if (!inspecting.value) return
  e.preventDefault()
  e.stopPropagation()
}
function onClick(e: MouseEvent) {
  if (!inspecting.value) return
  onPress(e)
  pinned.value = inside(e.target)
  host.value?.focus({ preventScroll: true })
}
const STEPS: Record<string, "up" | "down" | "next" | "prev"> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "prev",
  ArrowRight: "next",
}
function onKey(e: KeyboardEvent) {
  if (!inspecting.value || !content.value) return
  if (e.key === "Escape") {
    if (pinned.value) pinned.value = null
    else {
      inspecting.value = false
      toggle.value?.focus()
    }
  } else if (STEPS[e.key]) {
    const from = pinned.value ?? hovered.value
    pinned.value = from ? (walk(from, content.value, STEPS[e.key]) ?? from) : content.value.firstElementChild
  } else return
  e.preventDefault()
}

const marks = (n: number) => Array.from({ length: Math.floor(n / 50) }, (_, i) => (i + 1) * 50)
const at = (b: Box) => ({ left: `${b.x}px`, top: `${b.y}px`, width: `${b.w}px`, height: `${b.h}px` })
const sides = (v: number[]) => v.map((n) => `${n}px`).join(" ")
const fields = (r: Reading) => [
  [pinned.value ? "pinned" : "el", r.label],
  ["at", `${r.box.x}, ${r.box.y}`],
  ["size", `${r.box.w}×${r.box.h}`],
  ["font", r.font],
  ["color", r.color],
  ["bg", r.background],
  ["radius", r.radius],
  ["padding", r.padding],
]

// The reader's framework and styling system, from one Vue snippet.
const shownCode = computed(() => docsCode(props.code))

const chipClass = (active: boolean) =>
  active
    ? "rounded border border-border/60 px-2 py-0.5 text-foreground"
    : "rounded border border-transparent px-2 py-0.5 text-muted-foreground hover:text-foreground"
</script>

<template>
  <div class="mt-6">
    <div class="flex items-center justify-between text-[12px]">
      <div class="flex gap-4" role="tablist">
        <button
          type="button"
          role="tab"
          :aria-selected="tab === 'preview'"
          class="border-b pb-2 transition-colors"
          :class="
            tab === 'preview'
              ? 'border-foreground text-foreground'
              : 'border-transparent text-muted-foreground hover:border-foreground/40 hover:text-foreground'
          "
          @click="tab = 'preview'"
        >
          Preview
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="tab === 'code'"
          class="border-b pb-2 transition-colors"
          :class="
            tab === 'code'
              ? 'border-foreground text-foreground'
              : 'border-transparent text-muted-foreground hover:border-foreground/40 hover:text-foreground'
          "
          @click="tab = 'code'"
        >
          Code
        </button>
      </div>
      <div v-if="tab === 'code'" class="flex flex-wrap justify-end gap-x-3 gap-y-1 pb-2 text-[11px]">
        <div class="flex gap-1" role="group" aria-label="Framework">
          <button
            :aria-pressed="docsFramework === 'vue'"
            :class="chipClass(docsFramework === 'vue')"
            @click="setDocsFramework('vue')"
          >
            Vue
          </button>
          <button
            :aria-pressed="docsFramework === 'svelte'"
            :class="chipClass(docsFramework === 'svelte')"
            @click="setDocsFramework('svelte')"
          >
            Svelte
          </button>
        </div>
        <!-- The same snippet in the reader's styling system: Tailwind as
             authored, or a scoped stylesheet, CSS Modules (Vue) or StyleX. -->
        <div class="flex gap-1" role="group" aria-label="Styling">
          <button
            v-for="s in docsStylings"
            :key="s"
            :aria-pressed="docsStyling === s"
            :class="chipClass(docsStyling === s)"
            @click="setStyling(s)"
          >
            {{ STYLING_LABELS[s] }}
          </button>
        </div>
      </div>
      <div v-else class="pb-2 text-[11px]">
        <button
          ref="toggle"
          type="button"
          :aria-pressed="inspecting"
          :class="chipClass(inspecting)"
          class="flex min-h-6 items-center gap-1.5"
          title="Rulers, boxes and computed styles"
          @click="inspecting = !inspecting"
        >
          <svg viewBox="0 0 12 12" class="size-3" fill="none" stroke="currentColor" aria-hidden="true">
            <path d="M1 4V1h3M8 1h3v3M11 8v3H8M4 11H1V8M6 4v4M4 6h4" />
          </svg>
          Inspect
        </button>
      </div>
    </div>
    <div
      v-show="tab === 'preview'"
      ref="host"
      class="relative mt-3 flex min-h-[280px] items-center justify-center rounded-lg border border-border/60 p-8 sm:p-10"
      :data-inspecting="inspecting || undefined"
      :tabindex="inspecting ? 0 : undefined"
      :role="inspecting ? 'group' : undefined"
      :aria-label="inspecting ? 'Preview, inspecting' : undefined"
      :aria-describedby="inspecting ? hintId : undefined"
      @pointerover="onOver"
      @pointerleave="hovered = null"
      @pointerdown.capture="onPress"
      @mousedown.capture="onPress"
      @click.capture="onClick"
      @keydown.self="onKey"
    >
      <div ref="content" class="w-full">
        <slot v-if="revealed" />
        <!-- Quiet frame while the demo waits for its turn: a fast flick can
             outrun the observer, and an empty bordered box reads as broken. -->
        <div
          v-else
          class="flex h-40 animate-pulse items-center justify-center rounded-md bg-card/40 motion-reduce:animate-none"
          aria-hidden="true"
        >
          <span class="text-[11px] text-muted-foreground/60">preview</span>
        </div>
      </div>
      <div v-if="inspecting" ref="stage" class="ins" aria-hidden="true">
        <div class="rule rule-x">
          <span v-for="n in marks(size.w)" :key="n" :style="{ left: `${n}px` }">{{ n }}</span>
          <i v-if="reading" :style="{ left: `${reading.box.x}px`, width: `${reading.box.w}px` }" />
        </div>
        <div class="rule rule-y">
          <span v-for="n in marks(size.h)" :key="n" :style="{ top: `${n}px` }">{{ n }}</span>
          <i v-if="reading" :style="{ top: `${reading.box.y}px`, height: `${reading.box.h}px` }" />
        </div>
        <div class="corner" />
        <div v-if="ghost" class="ghost" :style="at(ghost)" />
        <div v-if="reading" class="target" :style="at(reading.box)">
          <i class="pad" :style="{ inset: sides(reading.edge), borderWidth: sides(reading.pad) }" />
          <b class="tl" /><b class="tr" /><b class="bl" /><b class="br" />
          <span class="chip" :class="{ below: reading.box.y < 20, end: reading.box.x > size.w / 2 }">
            {{ reading.label }} · {{ reading.box.w }}×{{ reading.box.h }}
          </span>
        </div>
      </div>
    </div>
    <div
      v-if="inspecting"
      class="mt-2 flex min-h-9 items-center rounded-lg border border-border/60 px-3 py-2 text-[11px]"
    >
      <dl v-if="reading" class="flex flex-wrap items-baseline gap-x-5 gap-y-1.5">
        <div v-for="[k, v] in fields(reading)" :key="k" class="flex items-baseline gap-2">
          <dt class="micro text-muted-foreground">{{ k }}</dt>
          <dd class="tabular-nums text-foreground">
            <i v-if="k === 'color' || k === 'bg'" class="sw" :style="{ background: v }" />{{ v }}
          </dd>
        </div>
      </dl>
      <p v-show="!reading" :id="hintId" class="text-muted-foreground">
        point to measure · click to pin · arrows walk the tree · esc unpins, then exits
      </p>
      <p class="sr-only" aria-live="polite">{{ announce }}</p>
    </div>
    <!-- Highlighted code mounts only when its tab is first opened: under the
         old v-show, every one of the page's ~150 hidden CodeBlocks ran at
         initial mount. -->
    <div v-show="tab === 'code'" class="mt-3">
      <CodeBlock v-if="tab === 'code'" :code="shownCode" />
    </div>
  </div>
</template>

<style scoped>
[data-inspecting],
[data-inspecting] :deep(*) {
  cursor: crosshair;
}

/* The inspect overlay: rulers, the target box (ember outline, corner marks,
   the padding band, a size chip) and a dashed ghost for the pointed element
   while another is pinned. Never hit-tested. */
.ins {
  --ember: var(--swatch-orange);
  --tick: color-mix(in oklab, var(--color-muted-foreground) 55%, transparent);
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: inherit;
  pointer-events: none;
  font: 500 9px/1 var(--font-mono);
  font-variant-numeric: tabular-nums;
  color: var(--color-muted-foreground);
}

.rule,
.corner {
  position: absolute;
  top: 0;
  left: 0;
  background-color: var(--color-background);
}

.rule-x {
  right: 0;
  height: 14px;
  background-image:
    linear-gradient(to right, var(--tick) 1px, transparent 0), linear-gradient(to right, var(--tick) 1px, transparent 0);
  background-size:
    10px 3px,
    50px 7px;
  background-position: 0 100%;
  background-repeat: repeat-x;
  box-shadow: inset 0 -1px 0 var(--color-border);
}

.rule-y {
  bottom: 0;
  width: 14px;
  background-image:
    linear-gradient(to bottom, var(--tick) 1px, transparent 0),
    linear-gradient(to bottom, var(--tick) 1px, transparent 0);
  background-size:
    3px 10px,
    7px 50px;
  background-position: 100% 0;
  background-repeat: repeat-y;
  box-shadow: inset -1px 0 0 var(--color-border);
}

.corner {
  width: 14px;
  height: 14px;
  box-shadow: inset -1px -1px 0 var(--color-border);
}

.rule > span {
  position: absolute;
}

.rule-x > span {
  top: 2px;
  padding-left: 2px;
}

.rule-y > span {
  left: 2px;
  padding-bottom: 2px;
  writing-mode: vertical-rl;
  transform: rotate(180deg);
}

/* The target's span on each ruler. */
.rule > i {
  position: absolute;
  background: color-mix(in oklab, var(--ember) 26%, transparent);
}

.rule-x > i {
  top: 0;
  bottom: 1px;
  box-shadow:
    inset 1px 0 var(--ember),
    inset -1px 0 var(--ember);
}

.rule-y > i {
  left: 0;
  right: 1px;
  box-shadow:
    inset 0 1px var(--ember),
    inset 0 -1px var(--ember);
}

.target,
.ghost {
  position: absolute;
}

.target {
  outline: 1px solid var(--ember);
}

.ghost {
  outline: 1px dashed color-mix(in oklab, var(--ember) 70%, transparent);
}

.pad {
  position: absolute;
  border-style: solid;
  border-color: color-mix(in oklab, var(--ember) 16%, transparent);
}

.target > b {
  position: absolute;
  width: 5px;
  height: 5px;
  background: var(--ember);
}

.tl {
  top: -3px;
  left: -3px;
}

.tr {
  top: -3px;
  right: -3px;
}

.bl {
  bottom: -3px;
  left: -3px;
}

.br {
  right: -3px;
  bottom: -3px;
}

/* Black on the ember clears 5:1 on both themes. */
.chip {
  position: absolute;
  bottom: calc(100% + 5px);
  left: -1px;
  padding: 2px 5px;
  border-radius: 3px;
  font-size: 10px;
  line-height: 12px;
  white-space: nowrap;
  color: black;
  background: var(--ember);
}

.chip.below {
  top: calc(100% + 5px);
  bottom: auto;
}

.chip.end {
  right: -1px;
  left: auto;
}

.sw {
  display: inline-block;
  width: 9px;
  height: 9px;
  margin-right: 6px;
  vertical-align: -1px;
  box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--color-foreground) 30%, transparent);
}

@media (forced-colors: active) {
  .ins {
    --ember: Highlight;
    --tick: CanvasText;
    forced-color-adjust: none;
  }
  .rule,
  .corner {
    background-color: Canvas;
  }
  .chip {
    color: HighlightText;
  }
}
</style>
