<script setup lang="ts">
import { computed, defineAsyncComponent, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { DitherClipboard, DitherIcon, DitherPoster } from "@dither-kit"
import { addArtboard, editor, frame, stopInspecting } from "@/entities/editor"
import { addLaunchFilm, installStudioAgentApi } from "@/features/agent"
import { forgetProject, openProject, stepChat } from "@/features/agent/chats"
import { askAgent, handoff } from "@/features/agent/handoff"
import type { AgentActivity } from "@/features/agent/tools"
import { startHistory, stopHistory } from "@/features/history"
import { ShortcutsHelp, usePanelShortcuts } from "@/features/keyboard"
import { activeProjectId, hydrate, importDocument, projects, startAutosave, stopAutosave } from "@/features/persistence"
import { Canvas } from "@/widgets/canvas"
import { DataEditor } from "@/widgets/data-editor"
import { CanvasBar, Toolbar } from "@/widgets/toolbar"
import { firstVisitTour, GUIDE_SEEN_KEY, type GuideStop } from "./guide"
import SearchPalette from "./ui/SearchPalette.vue"
import StudioGuide from "./ui/StudioGuide.vue"
import StudioPanel from "./ui/StudioPanel.vue"
import StudioSidebar from "./ui/StudioSidebar.vue"

const AgentPanel = defineAsyncComponent(() => import("@/widgets/agent").then((m) => m.AgentPanel))
// The docs' workbench over the canvas (Inspect on its bar): one lazy chunk,
// loaded the first time it is asked for.
const Workbench = defineAsyncComponent(() => import("@/widgets/workbench").then((m) => m.Workbench))
import { CHART_TYPES, type ChartType } from "@/shared/config"
import { installLongPress, modKey, routePath } from "@/shared/lib"
import Mascot from "@/shared/ui/Mascot.vue"
import { readJson, writeJson } from "@/shared/lib/storage"

const ExportDialog = defineAsyncComponent(() => import("@/features/export-code").then((m) => m.ExportDialog))
const exportOpen = ref(false)
const VideoDialog = defineAsyncComponent(() => import("@/features/export-video").then((m) => m.VideoDialog))
const videoOpen = ref(false)
const sidebarOpen = ref(true)
const libraryOpen = ref(false)
const searchOpen = ref(false)
// An agent app's window: the chat is a column of its own beside the canvas,
// open from the start; the panel of properties and layers is the canvas's
// other neighbour, open at first where the window is wide enough for all
// four (1600px), then as the reader last left it.
const PANEL_KEY = "dither-studio-panel-open"
const agentOpen = ref(true)
const keptPanel = readJson(PANEL_KEY)
const panelOpen = ref(typeof keptPanel === "boolean" ? keptPanel : window.innerWidth >= 1600)
watch(panelOpen, (v) => writeJson(PANEL_KEY, v))
// The sidebar lists the project's chats whether or not the panel is open.
watch(
  () => activeProjectId.value,
  (id) => id && openProject(id),
)
// A project deleted here (from the sidebar, the title bar or the agent)
// takes its chats with it.
watch(
  () => projects.map((p) => p.id),
  (now, was) => {
    for (const id of was) if (!now.includes(id)) forgetProject(id)
  },
)
// The chat stays mounted: hiding its column keeps a turn running, and its
// key on the title bar says what the agent is doing.
const agentPanel = ref<{ focus: () => void } | null>(null)
const agentState = ref<AgentActivity>("idle")
function onAgentActivity(a: AgentActivity) {
  // A turn that ends while the panel is closed leaves word on its key.
  agentState.value = a === "idle" && agentState.value !== "idle" && !agentOpen.value ? "unseen" : a
}
watch(agentOpen, (v) => {
  if (!v) return
  if (agentState.value === "unseen") agentState.value = "idle"
  nextTick(() => agentPanel.value?.focus())
})
/** Show the chat and put the cursor in its field (a chat picked, a new one). */
function toChat() {
  agentOpen.value = true
  nextTick(() => agentPanel.value?.focus())
}
// A message asked at the selection on the canvas opens the agent, whose
// panel sends it; so does picking frames for it.
watch(
  () => handoff.asks.length + Number(handoff.picking),
  (n) => n > 0 && (agentOpen.value = true),
)
usePanelShortcuts({
  toggleChat: () => (agentOpen.value = !agentOpen.value),
  search: () => (searchOpen.value = !searchOpen.value),
  toggleSidebar: () => (sidebarOpen.value = !sidebarOpen.value),
  stepChat: (by) => {
    if (agentState.value === "working" || agentState.value === "waiting") return
    stepChat(by)
    toChat()
  },
})

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
watch(panelOpen, stopInspecting)
// Below 1280px the chat and the right column take turns beside the canvas,
// so it keeps room for a frame: opening one puts the other away.
const oneSide = () => window.matchMedia?.("(max-width: 1279px)").matches ?? false
watch(
  () => panelOpen.value || !!bench.value,
  (right) => right && oneSide() && (agentOpen.value = false),
  { immediate: true },
)
watch(agentOpen, (open) => {
  if (!open || !oneSide()) return
  panelOpen.value = false
  stopInspecting()
})
const benchUrl = new URL(routePath("/studio"), location.href).href

// The mascot's tour of the window: each stop opens its part and points at
// it by the page's own refs. It runs once on a first visit, and again from
// its key on the title bar.
const toolbar = ref<{ guideKey: HTMLButtonElement | null } | null>(null)
const sidebar = ref<{ $el: Element } | null>(null)
// the canvas bar's root is a Transition: its $el is the bar only while it shows
const canvasBar = ref<{ $el: unknown } | null>(null)
const chat = ref<HTMLElement | null>(null)
const side = ref<HTMLElement | null>(null)
const tourOpen = ref(false)
const tour: GuideStop[] = [
  {
    target: () => shell.value,
    line: `Hi. Let me fly you round the Studio. This is the canvas, where your frames live: scroll to pan, pinch or ${modKey("").trim()} scroll to zoom.`,
  },
  {
    target: () => (canvasBar.value?.$el instanceof Element ? canvasBar.value.$el : null),
    line: "This bar works on what you pick: duplicate it, evolve it, export its code, a PNG or a video, or inspect it.",
  },
  {
    target: () => sidebar.value?.$el,
    show: () => (sidebarOpen.value = true),
    line: `Your projects and their chats are kept here. ${modKey("K")} finds any of them.`,
  },
  {
    target: () => chat.value,
    show: () => (agentOpen.value = true),
    line: "The chat. Your own coding agent answers here, signed in on your machine, and builds on the canvas for you.",
  },
  {
    target: () => side.value,
    show: () => (panelOpen.value = true),
    line: "Pick a frame and its properties and layers open here.",
  },
  {
    target: () => toolbar.value?.guideKey,
    end: true,
    line: "That is the whole window. I live on this key whenever you want the tour again.",
  },
]
function showAround() {
  writeJson(GUIDE_SEEN_KEY, true)
  tourOpen.value = true
}

const fresh = hydrate()
// A fresh document's frame was placed before the canvas measured itself:
// once it has (the canvas mounts before this page), frame it: centred, and
// zoomed out when the canvas beside the chat is narrower than the frame.
onMounted(() => {
  if (fresh && isDesktop.value && editor.artboards[0]) frame([editor.artboards[0]])
  if (isDesktop.value && firstVisitTour(readJson(GUIDE_SEEN_KEY))) tourTimer = setTimeout(showAround, 900)
})
let tourTimer: ReturnType<typeof setTimeout> | undefined
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
  clearTimeout(tourTimer)
  closeAgentApi()
  closeLongPress()
  stopAutosave()
  stopHistory()
  window.removeEventListener("resize", onResize)
})
</script>

<template>
  <!-- An agent app's window: the title bar across the top; under it the
       sidebar (projects and their chats), the chat, the canvas in its
       shell, and the panel of properties and layers (or the workbench's
       readout while inspecting). -->
  <div
    v-if="isDesktop"
    class="studio bg-background font-mono text-[13px] text-foreground antialiased"
    :class="{ 'is-folded': !sidebarOpen, 'no-chat': !agentOpen, 'no-panel': !panelOpen && !bench }"
    @dragover.prevent
    @drop.prevent="onDrop"
  >
    <!-- The title bar first: Tab reads it before the sidebar and the canvas. -->
    <Toolbar
      ref="toolbar"
      v-model:sidebar-open="sidebarOpen"
      v-model:chat-open="agentOpen"
      v-model:panel-open="panelOpen"
      v-model:library-open="libraryOpen"
      class="studio-bar"
      :agent-state="agentState"
      @guide="showAround"
    />
    <StudioSidebar
      ref="sidebar"
      v-show="sidebarOpen"
      :locked="agentState === 'working' || agentState === 'waiting'"
      @library="libraryOpen = true"
      @agent="toChat"
      @search="searchOpen = true"
    />

    <section v-show="agentOpen" ref="chat" class="studio-chat hardshell" aria-label="Chat">
      <AgentPanel ref="agentPanel" @close="agentOpen = false" @activity="onAgentActivity" />
    </section>

    <main ref="shell" class="studio-canvas hardshell" aria-label="Canvas">
      <Canvas ref="canvas" />
      <CanvasBar ref="canvasBar" @export="exportOpen = true" @video="videoOpen = true" />
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
        :send="(md: string) => askAgent(md, editor.selectedIds)"
        @exit="stopInspecting"
      />
    </aside>
    <aside v-else-if="panelOpen" ref="side" class="studio-side hardshell" aria-label="Properties and layers">
      <StudioPanel />
    </aside>

    <SearchPalette
      :open="searchOpen"
      :locked="agentState === 'working' || agentState === 'waiting'"
      @close="searchOpen = false"
      @agent="toChat"
      @library="libraryOpen = true"
    />
    <ExportDialog v-if="exportOpen" :open="exportOpen" @close="exportOpen = false" />
    <VideoDialog v-if="videoOpen" :open="videoOpen" @close="videoOpen = false" />
    <ShortcutsHelp />
    <StudioGuide :open="tourOpen" :stops="tour" @close="tourOpen = false" />
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
    <Mascot :size="44" alive class="mt-2 text-foreground" />
    <h1 class="text-xl tracking-tight">The Studio is best on a desktop</h1>
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
/* The window: the bar across the top; under it the sidebar, the chat, the
   canvas and the panel. Each side column folds to nothing when it is
   hidden; the canvas takes what is left. */
.studio {
  --sidebar: 15rem;
  --chat: 23rem;
  --right: 18.5rem;
  display: grid;
  grid-template-columns: var(--sidebar) var(--chat) minmax(0, 1fr) var(--right);
  grid-template-rows: auto minmax(0, 1fr);
  grid-template-areas:
    "bar bar bar bar"
    "side chat canvas right";
  height: 100dvh;
  overflow: hidden;
  background: var(--shell-ground), var(--color-background);
}
/* Down to the 1024px floor (an iPad on its side) the side columns narrow
   so the canvas keeps room for a frame and its actions. */
@media (max-width: 1439px) {
  .studio {
    --sidebar: 13.5rem;
    --chat: 21rem;
  }
}
@media (max-width: 1199px) {
  .studio {
    --sidebar: 12rem;
    --chat: 19rem;
  }
}
.studio.is-folded {
  --sidebar: 0px;
}
.studio.no-chat {
  --chat: 0px;
}
.studio.no-panel {
  --right: 0px;
}
.studio-bar {
  grid-area: bar;
}
/* The chat, the canvas and the panel are the window's shells: two corners
   cut, the canvas recessed into its well, a gutter between them. */
.studio-chat {
  --cut: 12px;
  display: flex;
  min-width: 0;
  flex-direction: column;
  grid-area: chat;
  margin: 0 8px 8px 0;
  overflow: hidden;
  background: var(--shell-ground), color-mix(in oklab, var(--color-background) 96%, transparent);
}
.studio.is-folded .studio-chat {
  margin-left: 8px;
}
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
.studio.is-folded.no-chat .studio-canvas {
  margin-left: 8px;
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
  .studio-side,
  .studio-chat {
    background: var(--color-background);
  }
}
</style>
