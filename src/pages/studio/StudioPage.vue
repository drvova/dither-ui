<script setup lang="ts">
import { computed, defineAsyncComponent, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { DitherClipboard, DitherIcon, DitherPoster } from "@dither-kit"
import { addArtboard, centreOn, editor, stopInspecting } from "@/entities/editor"
import { addLaunchFilm, installStudioAgentApi } from "@/features/agent"
import { openProject } from "@/features/agent/chats"
import { handoff } from "@/features/agent/handoff"
import type { AgentActivity } from "@/features/agent/tools"
import { startHistory, stopHistory } from "@/features/history"
import { ShortcutsHelp, usePanelShortcuts } from "@/features/keyboard"
import { activeProjectId, hydrate, importDocument, startAutosave, stopAutosave } from "@/features/persistence"
import { Canvas } from "@/widgets/canvas"
import { DataEditor } from "@/widgets/data-editor"
import { Inspector } from "@/widgets/inspector"
import { CanvasBar, type StudioSide, Toolbar } from "@/widgets/toolbar"
import StudioSidebar from "./ui/StudioSidebar.vue"

const AgentPanel = defineAsyncComponent(() => import("@/widgets/agent").then((m) => m.AgentPanel))
// The docs' workbench over the canvas (Inspect on its bar): one lazy chunk,
// loaded the first time it is asked for.
const Workbench = defineAsyncComponent(() => import("@/widgets/workbench").then((m) => m.Workbench))
import { CHART_TYPES, type ChartType } from "@/shared/config"
import { installLongPress, routePath } from "@/shared/lib"

const ExportDialog = defineAsyncComponent(() => import("@/features/export-code").then((m) => m.ExportDialog))
const exportOpen = ref(false)
const VideoDialog = defineAsyncComponent(() => import("@/features/export-video").then((m) => m.VideoDialog))
const videoOpen = ref(false)
const sidebarOpen = ref(true)
const libraryOpen = ref(false)
// The right column holds one panel, the properties or the agent, so the
// canvas keeps its width.
const side = ref<StudioSide | null>("inspector")
const agentOpen = computed({
  get: () => side.value === "agent",
  set: (v: boolean) => (side.value = v ? "agent" : side.value === "agent" ? "inspector" : side.value),
})
// The sidebar lists the project's chats whether or not the panel is open.
watch(
  () => activeProjectId.value,
  (id) => id && openProject(id),
)
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
// A message asked at the selection on the canvas opens the agent, whose
// panel sends it; so does picking frames for it.
watch(
  () => handoff.asks.length + Number(handoff.picking),
  (n) => n > 0 && (agentOpen.value = true),
)
usePanelShortcuts({ toggleAgent: () => (agentOpen.value = !agentOpen.value) })

// Inspecting, the workbench's readout takes the right column and its
// overlay the canvas (the frames stand in its world layer); picking a panel
// on the title bar ends it, and so does its own Escape.
const canvas = ref<{ host: HTMLElement | null; world: HTMLElement | null } | null>(null)
const shell = ref<HTMLElement | null>(null)
const bench = computed(() => {
  const host = canvas.value?.host
  const content = canvas.value?.world
  return editor.inspecting && host && content && shell.value ? { host, content, card: shell.value } : null
})
watch(side, stopInspecting)
const benchUrl = new URL(routePath("/studio"), location.href).href

const fresh = hydrate()
// A fresh document's frame was placed before the canvas measured itself:
// once it has (the canvas mounts before this page), centre the frame.
onMounted(() => {
  if (fresh && isDesktop.value && editor.artboards[0]) centreOn(editor.artboards[0])
})
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
  <!-- An app window: the title bar across the top, the rail of projects
       and the project's sidebar on the left, the canvas in its shell, and
       the right column (the properties or the agent). -->
  <div
    v-if="isDesktop"
    class="studio bg-background font-mono text-[13px] text-foreground antialiased"
    :class="{ 'is-folded': !sidebarOpen, 'is-wide': side === 'agent' || !!bench, 'is-bare': !side && !bench }"
    @dragover.prevent
    @drop.prevent="onDrop"
  >
    <!-- The title bar first: Tab reads it before the sidebar and the canvas. -->
    <Toolbar
      v-model:sidebar-open="sidebarOpen"
      v-model:side="side"
      v-model:library-open="libraryOpen"
      class="studio-bar"
      :agent-state="agentState"
    />
    <StudioSidebar
      :open="sidebarOpen"
      :locked="agentState === 'working' || agentState === 'waiting'"
      @library="libraryOpen = true"
      @agent="agentOpen = true"
    />

    <main ref="shell" class="studio-canvas hardshell" aria-label="Canvas">
      <Canvas ref="canvas" />
      <CanvasBar @export="exportOpen = true" @video="videoOpen = true" />
      <DataEditor />
    </main>

    <aside v-if="bench" class="studio-side studio-bench hardshell" aria-label="Workbench">
      <Workbench
        :key="activeProjectId.value"
        :host="bench.host"
        :content="bench.content"
        :card="bench.card"
        :bench-key="`studio:${activeProjectId.value}`"
        section="studio"
        title="The Studio canvas (dither-ui)"
        :url="benchUrl"
        @exit="stopInspecting"
      />
    </aside>
    <aside v-else-if="side === 'inspector'" class="studio-side hardshell" aria-label="Properties">
      <Inspector />
    </aside>
    <aside v-if="agentMounted" v-show="side === 'agent' && !bench" class="studio-side hardshell" aria-label="Agent">
      <AgentPanel ref="agentPanel" @close="agentOpen = false" @activity="onAgentActivity" />
    </aside>

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
/* The window: the bar across the top; under it the rail, the sidebar
   (folded away when hidden), the canvas and the right column (wider for
   the agent, gone when neither panel is open). */
.studio {
  --rail: 3.25rem;
  --sidebar: 16.5rem;
  --right: 18rem;
  display: grid;
  grid-template-columns: var(--rail) var(--sidebar) minmax(0, 1fr) var(--right);
  grid-template-rows: auto minmax(0, 1fr);
  grid-template-areas:
    "bar bar bar bar"
    "rail side canvas right";
  height: 100dvh;
  overflow: hidden;
  background: var(--shell-ground), var(--color-background);
}
.studio.is-wide {
  --right: 21rem;
}
/* Down to the 1024px floor (an iPad on its side) the side columns narrow
   so the canvas keeps room for a frame and its actions. */
@media (max-width: 1279px) {
  .studio {
    --sidebar: 13rem;
    --right: 16.5rem;
  }
  .studio.is-wide {
    --right: 18.5rem;
  }
}
.studio.is-folded {
  --sidebar: 0px;
}
.studio.is-bare {
  --right: 0px;
}
.studio-bar {
  grid-area: bar;
}
/* The canvas and the right column are the window's shells: two corners
   cut, the canvas recessed into its well, a gutter between them. */
.studio-canvas {
  --cut: 14px;
  position: relative;
  grid-area: canvas;
  min-width: 0;
  margin: 0 8px 8px 0;
  overflow: hidden;
  container: canvas / inline-size;
  background: var(--well);
  box-shadow: var(--recess-sm);
}
.studio-side {
  --cut: 12px;
  display: flex;
  min-width: 0;
  flex-direction: column;
  grid-area: right;
  margin: 0 8px 8px 0;
  overflow: hidden;
  background: var(--shell-ground), color-mix(in oklab, var(--color-background) 96%, transparent);
}
/* The workbench's readout scrolls in its column. */
.studio-bench {
  overflow-y: auto;
  padding: 10px;
}
@media (prefers-reduced-transparency: reduce) {
  .studio-side {
    background: var(--color-background);
  }
}
</style>
