<script setup lang="ts">
import { computed, defineAsyncComponent, h, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from "vue"
import { routePath } from "@/shared/lib"
import { setStyling, STYLING_LABELS } from "@/shared/lib/restyle"
import { play } from "@/shared/lib/sound"
import type { RunResult, SourceContext } from "@/widgets/source"
import { INSTALL } from "./install"
import { docsCode, docsFramework, docsStyling, docsStylings, setDocsFramework } from "./svelte"

// The workbench and the source panel load on first use: the page's ~300
// cards share their chunks, which only a reader who inspects or opens the
// code pays for.
const Workbench = defineAsyncComponent(() => import("@/widgets/workbench").then((m) => m.Workbench))
const SourcePanel = defineAsyncComponent(() => import("@/widgets/source").then((m) => m.SourcePanel))
const RunView = defineAsyncComponent(() => import("@/widgets/source").then((m) => m.RunView))

const props = defineProps<{ code: string }>()
const tab = ref<"preview" | "code">("preview")
const root = ref<HTMLElement | null>(null)
const host = ref<HTMLElement | null>(null)
const content = ref<HTMLElement | null>(null)
const toggle = ref<HTMLButtonElement | null>(null)

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

// Where this card sits — its section, its place among the section's cards,
// the section's title and line — names its saved workspace, its files and
// the brief an agent receives.
const where = ref<SourceContext>({ section: "", n: 1, title: "", description: "", url: "", install: INSTALL })

function locate() {
  if (!root.value) return
  const section = root.value.closest("section[id]")
  const id = section?.id ?? "docs"
  const cards = section ? [...section.querySelectorAll("[data-demo-card]")] : [root.value]
  const n = cards.indexOf(root.value) + 1
  const name = section?.querySelector("h2")?.textContent?.trim() || id
  const line = [...(section?.querySelectorAll("p") ?? [])].find((p) => !p.closest("[data-demo-card]"))
  where.value = {
    section: id,
    n,
    title: `${name}${cards.length > 1 ? ` · preview ${n}` : ""}`,
    description: line?.textContent?.replace(/\s+/g, " ").trim() ?? "",
    url: `${location.origin}${routePath(`/docs/${id}`)}`,
    install: INSTALL,
  }
}

function show(next: "preview" | "code") {
  if (next === tab.value) return
  play("tap")
  tab.value = next
}

// The workbench (Inspect): Kobra's component inspector and its tray of
// tools over this preview — see widgets/workbench.
const inspecting = ref(false)

function inspect(on: boolean) {
  if (on) locate()
  play(on ? "on" : "off")
  inspecting.value = on
}

function exit() {
  play("off")
  inspecting.value = false
  nextTick(() => toggle.value?.focus())
}

// The source (Code): the example and the kit files behind it as tabs —
// see widgets/source. The panel mounts on first open and then stays, so
// edits survive a trip to the Preview tab.
const opened = ref(false)
watch(tab, (t) => {
  if (t !== "code") return
  inspecting.value = false
  if (!opened.value) locate()
  opened.value = true
})

// A run replaces the demo with the compiled files until it is restored; the
// frame then shows in both tabs, above the source like Kobra's.
const ran = shallowRef<RunResult | null>(null)
const runs = ref(0)
let sheet: HTMLStyleElement | null = null

function onRun(result: RunResult) {
  sheet?.remove()
  sheet = null
  if (result.css) {
    sheet = document.createElement("style")
    sheet.dataset.run = where.value.section
    sheet.textContent = result.css
    document.head.append(sheet)
  }
  ran.value = result
  runs.value++
}

function restore() {
  play("tap")
  sheet?.remove()
  sheet = null
  ran.value = null
}

onBeforeUnmount(() => {
  io?.disconnect()
  sheet?.remove()
})

const renderRun = () => (ran.value ? [h(RunView, { component: ran.value.component, key: runs.value })] : [])
const runAttrs = computed(() => (ran.value ? { [ran.value.attribute]: "" } : {}))

const chipClass = (active: boolean) =>
  active
    ? "rounded border border-border/60 px-2 py-0.5 text-foreground"
    : "rounded border border-transparent px-2 py-0.5 text-muted-foreground hover:text-foreground"

function chip(apply: () => void, already: boolean) {
  if (!already) play("tap")
  apply()
}
</script>

<template>
  <div ref="root" class="mt-6" data-demo-card>
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
          @click="show('preview')"
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
          @click="show('code')"
        >
          Code
        </button>
      </div>
      <div v-if="tab === 'code'" class="flex flex-wrap justify-end gap-x-3 gap-y-1 pb-2 text-[11px]">
        <div class="flex gap-1" role="group" aria-label="Framework">
          <button
            :aria-pressed="docsFramework === 'vue'"
            :class="chipClass(docsFramework === 'vue')"
            @click="chip(() => setDocsFramework('vue'), docsFramework === 'vue')"
          >
            Vue
          </button>
          <button
            :aria-pressed="docsFramework === 'svelte'"
            :class="chipClass(docsFramework === 'svelte')"
            @click="chip(() => setDocsFramework('svelte'), docsFramework === 'svelte')"
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
            @click="chip(() => setStyling(s), docsStyling === s)"
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
          title="The workbench: inspect, measure, annotate, capture"
          @click="inspect(!inspecting)"
        >
          <svg viewBox="0 0 12 12" class="size-3" fill="none" stroke="currentColor" aria-hidden="true">
            <path d="M1 4V1h3M8 1h3v3M11 8v3H8M4 11H1V8M6 4v4M4 6h4" />
          </svg>
          Inspect
        </button>
      </div>
    </div>
    <div v-if="ran" class="mt-3 flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
      <span class="micro">Running your files</span>
      <button
        type="button"
        class="flex min-h-6 items-center rounded border border-border/60 px-2 text-foreground"
        @click="restore"
      >
        Restore the demo
      </button>
    </div>
    <div
      v-show="tab === 'preview' || ran"
      ref="host"
      v-bind="runAttrs"
      class="relative mt-3 flex min-h-[280px] items-center justify-center rounded-lg border border-border/60 p-8 sm:p-10"
      :class="{ 'data-[tray=bottom]:pb-16 data-[tray=top]:pt-16': inspecting }"
      :tabindex="inspecting ? 0 : undefined"
      :role="inspecting ? 'group' : undefined"
      :aria-label="inspecting ? 'Preview, with the workbench' : undefined"
    >
      <div ref="content" class="w-full">
        <RunView v-if="ran" :key="runs" :component="ran.component" />
        <slot v-else-if="revealed" />
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
    </div>
    <Workbench
      v-if="inspecting && tab === 'preview' && host && content && root"
      :host="host"
      :content="content"
      :card="root"
      :bench-key="`${where.section}:${where.n}`"
      :section="where.section"
      :title="`${where.title} (dither-ui docs)`"
      :url="where.url"
      :render="ran ? renderRun : $slots.default"
      @exit="exit"
    />
    <!-- The source mounts when its tab is first opened (under the old v-show
         every one of the page's ~150 hidden code blocks rendered at initial
         mount) and stays, so edits survive the Preview tab. -->
    <div v-if="opened" v-show="tab === 'code'" class="mt-3">
      <SourcePanel
        :code="props.code"
        :translate="docsCode"
        :flavor="docsFramework"
        :styling="docsStyling"
        :context="where"
        @run="onRun"
      />
    </div>
  </div>
</template>
