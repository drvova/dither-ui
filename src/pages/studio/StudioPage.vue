<script setup lang="ts">
import { defineAsyncComponent, nextTick, onBeforeUnmount, ref, watch } from "vue"
import { DitherClipboard, DitherIcon, DitherPoster } from "@dither-kit"
import { addArtboard } from "@/entities/editor"
import { addLaunchFilm, installStudioAgentApi } from "@/features/agent"
import { handoff } from "@/features/agent/handoff"
import type { AgentActivity } from "@/features/agent/tools"
import { startHistory, stopHistory } from "@/features/history"
import { ShortcutsHelp, usePanelShortcuts } from "@/features/keyboard"
import { hydrate, importDocument, startAutosave, stopAutosave } from "@/features/persistence"
import { Canvas } from "@/widgets/canvas"
import { DataEditor } from "@/widgets/data-editor"
import { Inspector } from "@/widgets/inspector"
import { LayerTree } from "@/widgets/layer-tree"
import { Toolbar } from "@/widgets/toolbar"

const AgentPanel = defineAsyncComponent(() => import("@/widgets/agent").then((m) => m.AgentPanel))
import { CHART_TYPES, type ChartType } from "@/shared/config"
import { installLongPress, routePath } from "@/shared/lib"

const ExportDialog = defineAsyncComponent(() => import("@/features/export-code").then((m) => m.ExportDialog))
const exportOpen = ref(false)
const VideoDialog = defineAsyncComponent(() => import("@/features/export-video").then((m) => m.VideoDialog))
const videoOpen = ref(false)
const layersOpen = ref(true)
const inspectorOpen = ref(true)
// The left slot holds one panel: opening the agent folds the layers away
// and vice versa, so the canvas keeps its width.
const agentOpen = ref(false)
// Once opened, the agent stays mounted: closing the panel hides it, so a
// turn keeps running and its key on the toolbar says what it is doing.
const agentMounted = ref(false)
const agentPanel = ref<{ focus: () => void } | null>(null)
const agentState = ref<AgentActivity>("idle")
function onAgentActivity(a: AgentActivity) {
  // A turn that ends while the panel is closed leaves word on its key.
  agentState.value = a === "idle" && agentState.value !== "idle" && !agentOpen.value ? "unseen" : a
}
watch(agentOpen, (v) => {
  if (!v) return
  agentMounted.value = true
  if (agentState.value === "unseen") agentState.value = "idle"
  nextTick(() => agentPanel.value?.focus())
})
watch(agentOpen, (v) => v && (layersOpen.value = false))
// A message asked at the selection on the canvas opens the agent, whose
// panel sends it; so does picking frames for it.
watch(
  () => handoff.asks.length + Number(handoff.picking),
  (n) => n > 0 && (agentOpen.value = true),
)
watch(layersOpen, (v) => v && (agentOpen.value = false))
usePanelShortcuts({ toggleAgent: () => (agentOpen.value = !agentOpen.value) })

hydrate()
startAutosave()
startHistory()
// The agent protocol (window.ditherStudio, dither-studio:* DOM events, the
// document mirror) opens with the studio and closes with it.
const closeAgentApi = installStudioAgentApi()
// Every right-click menu (the layer rows') opens on a long press too, for a
// finger on an iPad, where WebKit fires no contextmenu.
const closeLongPress = installLongPress()

// A project .json dropped anywhere on the studio loads like Open file.
async function onDrop(e: DragEvent) {
  const file = e.dataTransfer?.files?.[0]
  if (file && (file.type === "application/json" || file.name.endsWith(".json"))) await importDocument(file)
}

// Deep links from docs support canonical /studio#new/<type> and legacy
// #/studio/new/<type>; both add once after history starts, then clean the URL.
// #new/film builds the launch film: the kit's frames cut into a film.
const wanted = location.hash.match(/^(?:#new\/|#\/studio\/new\/)([a-z]+)/)?.[1]
if (wanted && (CHART_TYPES as readonly string[]).includes(wanted)) {
  addArtboard(wanted as ChartType)
  history.replaceState(null, "", routePath("/studio"))
} else if (wanted === "film") {
  addLaunchFilm()
  history.replaceState(null, "", routePath("/studio"))
}

// The studio is a wide-screen, pointer + keyboard tool (layer rail, inspector,
// shortcuts). Below lg we show a hint instead of a cramped, broken layout — and
// skip mounting the heavy canvas widgets entirely.
const isDesktop = ref(window.innerWidth >= 1024)
// The Studio's own address, for a phone to carry to a wider screen.
const studioLink = new URL(routePath("/studio"), location.href).href
const onResize = () => (isDesktop.value = window.innerWidth >= 1024)
window.addEventListener("resize", onResize)
onBeforeUnmount(() => {
  closeAgentApi()
  closeLongPress()
  stopAutosave()
  stopHistory()
  window.removeEventListener("resize", onResize)
})
</script>

<template>
  <div
    v-if="isDesktop"
    class="relative h-dvh overflow-hidden bg-background font-mono text-[13px] text-foreground antialiased"
    @dragover.prevent
    @drop.prevent="onDrop"
  >
    <!-- The toolbar first: Tab reads the top bar and the selection's actions
         before the canvas (it paints above the canvas by its z-30). -->
    <Toolbar
      v-model:layers-open="layersOpen"
      v-model:inspector-open="inspectorOpen"
      v-model:agent-open="agentOpen"
      :agent-state="agentState"
      @export="exportOpen = true"
      @video="videoOpen = true"
    />
    <Canvas />

    <Transition name="panel-left">
      <aside v-if="layersOpen" class="studio-panel hardshell absolute bottom-16 left-3 top-16 z-20 w-64">
        <div class="panel-head">
          <span class="micro">Layers</span
          ><button type="button" aria-label="Close layers" @click="layersOpen = false">
            <DitherIcon name="Close" :size="13" :stroke-width="1.5" />
          </button>
        </div>
        <div class="min-h-0 flex-1 overflow-y-auto p-2"><LayerTree /></div>
      </aside>
    </Transition>

    <Transition name="panel-left">
      <aside
        v-if="agentMounted"
        v-show="agentOpen"
        class="studio-panel hardshell absolute bottom-16 left-3 top-16 z-20 w-80 overflow-hidden"
        aria-label="Agent"
      >
        <AgentPanel ref="agentPanel" @close="agentOpen = false" @activity="onAgentActivity" />
      </aside>
    </Transition>

    <Transition name="panel-right">
      <aside
        v-if="inspectorOpen"
        class="studio-panel hardshell absolute bottom-16 right-3 top-16 z-20 w-72 overflow-hidden"
      >
        <Inspector />
      </aside>
    </Transition>

    <DataEditor />
    <ExportDialog v-if="exportOpen" :open="exportOpen" @close="exportOpen = false" />
    <VideoDialog v-if="videoOpen" :open="videoOpen" @close="videoOpen = false" />
    <ShortcutsHelp />
  </div>

  <!-- Small screens: the editor needs a desktop, so guide instead of
       breaking: a still print of the kit, why, and the link to carry to a
       wider screen (copied in one tap), the docs beside it. -->
  <div
    v-else
    class="flex min-h-dvh flex-col items-center justify-center gap-5 bg-background px-6 py-10 text-center font-mono text-foreground antialiased"
  >
    <div class="aspect-[4/3] w-full max-w-xs overflow-hidden rounded-2xl" aria-hidden="true">
      <DitherPoster :seed="5" :cell="4" paused />
    </div>
    <h1 class="mt-3 text-xl tracking-tight">The Studio is best on a desktop</h1>
    <p class="max-w-xs text-[13px] leading-relaxed text-muted-foreground [text-wrap:pretty]">
      It is an infinite canvas with a layer rail, an inspector and keyboard shortcuts, made for a wide screen and a
      pointer. Send yourself the link and pick it up on a laptop.
    </p>
    <div class="mt-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 text-[12px]">
      <DitherClipboard :value="studioLink">
        <template #default="{ copied }">
          <button type="button" class="key-chrome inline-flex h-10 items-center gap-2 px-5 font-medium">
            <DitherIcon :name="copied ? 'Check' : 'Copy'" :size="13" :stroke-width="1.5" />{{
              copied ? "Link copied" : "Copy the Studio link"
            }}
          </button>
        </template>
      </DitherClipboard>
      <a
        :href="routePath('/docs')"
        class="-my-1 py-1 text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
        >Browse the docs</a
      >
    </div>
  </div>
</template>

<style scoped>
/* A panel is the site's hardshell (two corners cut, the chrome glint along
   them) over the page's ground; solid under reduced transparency. */
.studio-panel {
  --cut: 12px;
  display: flex;
  flex-direction: column;
  background: var(--shell-ground), color-mix(in oklab, var(--color-background) 96%, transparent);
}
@media (prefers-reduced-transparency: reduce) {
  .studio-panel {
    background: var(--color-background);
  }
}
.panel-head {
  display: flex;
  height: 2.25rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid color-mix(in oklab, var(--color-border) 60%, transparent);
  padding-inline: 0.75rem;
  font-size: 11px;
  color: var(--color-muted-foreground);
}
.panel-head button {
  display: grid;
  width: 1.75rem;
  height: 1.75rem;
  place-items: center;
  border-radius: 0.375rem;
}
.panel-head button:hover {
  background: var(--color-card);
  color: var(--color-foreground);
}
.panel-left-enter-active,
.panel-left-leave-active,
.panel-right-enter-active,
.panel-right-leave-active {
  transition:
    transform 350ms var(--ease-settle),
    opacity 140ms ease;
}
.panel-left-enter-from,
.panel-left-leave-to {
  transform: translateX(-8px);
  opacity: 0;
}
.panel-right-enter-from,
.panel-right-leave-to {
  transform: translateX(8px);
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
  .panel-left-enter-active,
  .panel-left-leave-active,
  .panel-right-enter-active,
  .panel-right-leave-active {
    transition: none;
  }
}
</style>
