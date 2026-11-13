import {
  children,
  createEffect,
  createMemo,
  createSignal,
  For,
  lazy,
  on,
  onCleanup,
  onMount,
  Show,
  Suspense,
} from "solid-js"
import { DitherClipboard, DitherIcon, DitherPoster } from "@dither-ui/kit"
import { firstVisitTour, GUIDE_SEEN_KEY, type GuideStop } from "@/pages/studio/guide"
import { CHART_TYPES, type ChartType } from "@/shared/config"
import { readJson, writeJson } from "@/shared/lib/storage"
import { addArtboard, editor, frame, stopInspecting } from "@/entities/editor"
import { addLaunchFilm, installStudioAgentApi } from "@/features/agent"
import { forgetProject, openProject, stepChat } from "@/features/agent/chats"
import { askAgent, handoff } from "@/features/agent/handoff"
import type { AgentActivity } from "@/features/agent/tools"
import { startHistory, stopHistory } from "@/features/history"
import { ShortcutsHelp, usePanelShortcuts } from "@/features/keyboard"
import { activeProjectId, hydrate, importDocument, projects, startAutosave, stopAutosave } from "@/features/persistence"
import { installLongPress, modKey, routePath } from "@/shared/lib"
import Mascot from "@/shared/ui/Mascot"
import type { AgentPanelApi } from "@/widgets/agent/AgentPanel"
import { Canvas, type CanvasApi } from "@/widgets/canvas"
import { DataEditor } from "@/widgets/data-editor"
import { CanvasBar, Toolbar, type ToolbarApi } from "@/widgets/toolbar"
import SearchPalette from "./ui/SearchPalette"
import StudioGuide from "./ui/StudioGuide"
import StudioPanel from "./ui/StudioPanel"
import StudioSidebar from "./ui/StudioSidebar"
import "./StudioPage.css"

const AgentPanel = lazy(() => import("@/widgets/agent").then((m) => ({ default: m.AgentPanel })))
// The docs' workbench over the canvas (Inspect on its bar): one lazy chunk,
// loaded the first time it is asked for.
const Workbench = lazy(() => import("@/widgets/workbench").then((m) => ({ default: m.Workbench })))
const ExportDialog = lazy(() => import("@/features/export-code").then((m) => ({ default: m.ExportDialog })))
const VideoDialog = lazy(() => import("@/features/export-video").then((m) => ({ default: m.VideoDialog })))

// An agent app's window: the chat is a column of its own beside the canvas,
// open from the start; the panel of properties and layers is the canvas's
// other neighbour, open at first where the window is wide enough for all
// four (1600px), then as the reader last left it.
const PANEL_KEY = "dither-studio-panel-open"

// The Studio is a client application on a server-rendered page: the server
// (and the first client render over its bytes) draws the window's shell
// with nothing in it, and everything the browser holds (the document, the
// kept panel, the hash's entry, the window's width) comes in as it mounts.
export default function StudioPage() {
  const [exportOpen, setExportOpen] = createSignal(false)
  const [videoOpen, setVideoOpen] = createSignal(false)
  const [sidebarOpen, setSidebarOpen] = createSignal(true)
  const [libraryOpen, setLibraryOpen] = createSignal(false)
  const [searchOpen, setSearchOpen] = createSignal(false)
  const [agentOpen, setAgentOpen] = createSignal(true)
  // Shut until the mount knows the kept choice or the window's width; only
  // a change made after that is kept.
  const [panelOpen, restorePanel] = createSignal(false)
  const setPanelOpen = (v: boolean) => {
    if (v === panelOpen()) return
    restorePanel(v)
    writeJson(PANEL_KEY, v)
  }
  // The sidebar lists the project's chats whether or not the panel is open.
  createEffect(
    on(
      () => activeProjectId.value,
      (id) => id && openProject(id),
      { defer: true },
    ),
  )
  // A project deleted here (from the sidebar, the title bar or the agent)
  // takes its chats with it.
  createEffect(
    on(
      () => projects.map((p) => p.id),
      (now, was) => {
        for (const id of was ?? []) if (!now.includes(id)) forgetProject(id)
      },
      { defer: true },
    ),
  )
  // The chat stays mounted: hiding its column keeps a turn running, and its
  // key on the title bar says what the agent is doing.
  let agentPanel: AgentPanelApi | undefined
  const [agentState, setAgentState] = createSignal<AgentActivity>("idle")
  function onAgentActivity(a: AgentActivity) {
    // A turn that ends while the panel is closed leaves word on its key.
    setAgentState(a === "idle" && agentState() !== "idle" && !agentOpen() ? "unseen" : a)
  }
  const locked = () => agentState() === "working" || agentState() === "waiting"
  createEffect(
    on(
      agentOpen,
      (v) => {
        if (!v) return
        if (agentState() === "unseen") setAgentState("idle")
        queueMicrotask(() => agentPanel?.focus())
      },
      { defer: true },
    ),
  )
  /** Show the chat and put the cursor in its field (a chat picked, a new one). */
  function toChat() {
    setAgentOpen(true)
    queueMicrotask(() => agentPanel?.focus())
  }
  // A message asked at the selection on the canvas opens the agent, whose
  // panel sends it; so does picking frames for it.
  createEffect(
    on(
      () => handoff.asks.length + Number(handoff.picking),
      (n) => n > 0 && setAgentOpen(true),
      { defer: true },
    ),
  )
  usePanelShortcuts({
    toggleChat: () => setAgentOpen(!agentOpen()),
    search: () => setSearchOpen(!searchOpen()),
    toggleSidebar: () => setSidebarOpen(!sidebarOpen()),
    stepChat: (by) => {
      if (locked()) return
      stepChat(by)
      toChat()
    },
  })

  // Inspecting, the workbench's readout takes the right column and its
  // overlay the canvas (the frames stand in its world layer); picking a panel
  // on the title bar ends it, and so does its own Escape.
  const [canvas, setCanvas] = createSignal<CanvasApi>()
  const [shell, setShell] = createSignal<HTMLElement>()
  const bench = createMemo(() => {
    const api = canvas()
    const card = shell()
    return editor.inspecting && api && card ? { host: api.host, content: api.world, card } : null
  })
  createEffect(on(panelOpen, () => stopInspecting(), { defer: true }))
  // Below 1280px the chat and the right column take turns beside the canvas,
  // so it keeps room for a frame: opening one puts the other away.
  const oneSide = () => window.matchMedia?.("(max-width: 1279px)").matches ?? false
  const rightOpen = createMemo(() => panelOpen() || !!bench())
  createEffect(on(rightOpen, (right) => right && oneSide() && setAgentOpen(false)))
  createEffect(
    on(
      agentOpen,
      (open) => {
        if (!open || !oneSide()) return
        setPanelOpen(false)
        stopInspecting()
      },
      { defer: true },
    ),
  )
  // The Studio's own address: the workbench's, and for a phone to carry to
  // a wider screen. Read where it is used, never on a server.
  const studioUrl = () => new URL(routePath("/studio"), location.href).href

  // The mascot's tour of the window: each stop opens its part and points at
  // it by the page's own refs. It runs once on a first visit, and again from
  // its key on the title bar.
  let toolbar: ToolbarApi | undefined
  let sidebar: HTMLElement | undefined
  let chat: HTMLElement | undefined
  let side: HTMLElement | undefined
  // the canvas bar's root is a Presence: there is an element only while it shows
  const canvasBar = children(() => (
    <CanvasBar onExport={() => setExportOpen(true)} onVideo={() => setVideoOpen(true)} />
  ))
  const [tourOpen, setTourOpen] = createSignal(false)
  const tour: GuideStop[] = [
    {
      target: () => shell(),
      line: `Hi. Let me fly you round the Studio. This is the canvas, where your frames live: scroll to pan, pinch or ${modKey("").trim()} scroll to zoom.`,
    },
    {
      target: () => canvasBar.toArray().find((n): n is Element => n instanceof Element && n.isConnected) ?? null,
      line: "This bar works on what you pick: duplicate it, evolve it, export its code, a PNG or a video, or inspect it.",
    },
    {
      target: () => sidebar,
      show: () => setSidebarOpen(true),
      line: `Your projects and their chats are kept here. ${modKey("K")} finds any of them.`,
    },
    {
      target: () => chat,
      show: () => setAgentOpen(true),
      line: "The chat. Your own coding agent answers here, signed in on your machine, and builds on the canvas for you.",
    },
    {
      target: () => (side?.isConnected ? side : null),
      show: () => setPanelOpen(true),
      line: "Pick a frame and its properties and layers open here.",
    },
    {
      target: () => toolbar?.guideKey,
      end: true,
      line: "That is the whole window. I live on this key whenever you want the tour again.",
    },
  ]
  function showAround() {
    writeJson(GUIDE_SEEN_KEY, true)
    setTourOpen(true)
  }

  // A project .json dropped anywhere on the studio loads like Open file.
  async function onDrop(e: DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer?.files?.[0]
    if (file && (file.type === "application/json" || file.name.endsWith(".json"))) await importDocument(file)
  }

  // The studio is a wide-screen, pointer + keyboard tool (layer rail, inspector,
  // shortcuts). Below lg we show a hint instead of a cramped, broken layout
  // (a server render knows no width: it draws the window, and a narrow
  // screen swaps it for the hint as it mounts).
  const [isDesktop, setIsDesktop] = createSignal(true)

  onMount(() => {
    const keptPanel = readJson(PANEL_KEY)
    restorePanel(typeof keptPanel === "boolean" ? keptPanel : window.innerWidth >= 1600)

    const fresh = hydrate()
    startAutosave()
    startHistory()
    // The agent protocol (window.ditherStudio, dither-studio:* DOM events, the
    // document mirror) opens with the studio and closes with it.
    const closeAgentApi = installStudioAgentApi()
    // Every right-click menu (the layer rows') opens on a long press too, for a
    // finger on an iPad, where WebKit fires no contextmenu.
    const closeLongPress = installLongPress()

    // Deep links from docs support canonical /studio#new/<type> and legacy
    // #/studio/new/<type>; both add once after history starts, then clean the URL.
    // #new/film builds the launch film: the kit's frames cut into a film.
    const wanted = location.hash.match(/^(?:#new\/|#\/studio\/new\/)([a-z]+)/)?.[1]
    if (wanted && (CHART_TYPES as readonly string[]).includes(wanted)) {
      addArtboard(wanted as ChartType)
      window.history.replaceState(null, "", routePath("/studio"))
    } else if (wanted === "film") {
      addLaunchFilm()
      window.history.replaceState(null, "", routePath("/studio"))
    }

    setIsDesktop(window.innerWidth >= 1024)
    const onResize = () => setIsDesktop(window.innerWidth >= 1024)
    window.addEventListener("resize", onResize)

    // A fresh document's frame was placed before the canvas measured itself:
    // once it has (the canvas mounts after this page, within this turn),
    // frame it: centred, and zoomed out when the canvas beside the chat is
    // narrower than the frame.
    let tourTimer: ReturnType<typeof setTimeout> | undefined
    queueMicrotask(() => {
      if (fresh && isDesktop() && editor.artboards[0]) frame([editor.artboards[0]])
      if (isDesktop() && firstVisitTour(readJson(GUIDE_SEEN_KEY))) tourTimer = setTimeout(showAround, 900)
    })

    onCleanup(() => {
      clearTimeout(tourTimer)
      closeAgentApi()
      closeLongPress()
      stopAutosave()
      stopHistory()
      window.removeEventListener("resize", onResize)
    })
  })

  return (
    <Show
      when={isDesktop()}
      fallback={
        // Small screens: the editor needs a desktop, so guide instead of
        // breaking: a still print of the kit, why, and the link to carry to a
        // wider screen (copied in one tap), the docs beside it.
        <div class="flex min-h-dvh flex-col items-center justify-center gap-5 bg-background px-6 py-10 text-center font-mono text-foreground antialiased">
          <div class="aspect-[4/3] w-full max-w-xs overflow-hidden rounded-2xl" aria-hidden="true">
            <DitherPoster seed={5} cell={4} paused />
          </div>
          <Mascot size={44} alive class="mt-2 text-foreground" />
          <h1 class="text-xl tracking-tight">The Studio is best on a desktop</h1>
          <p class="max-w-xs text-[13px] leading-relaxed text-muted-foreground [text-wrap:pretty]">
            It is an infinite canvas with a layer rail, an inspector and keyboard shortcuts, made for a wide screen and
            a pointer. Send yourself the link and pick it up on a laptop.
          </p>
          <div class="mt-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 text-[12px]">
            <DitherClipboard value={studioUrl()}>
              {(scope) => (
                <button type="button" class="key-chrome inline-flex h-10 items-center gap-2 px-5 font-medium">
                  <DitherIcon name={scope.copied ? "Check" : "Copy"} size={13} strokeWidth={1.5} />
                  {scope.copied ? "Link copied" : "Copy the Studio link"}
                </button>
              )}
            </DitherClipboard>
            <a
              href={routePath("/docs")}
              class="-my-1 py-1 text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
            >
              Browse the docs
            </a>
          </div>
        </div>
      }
    >
      {/* An agent app's window: the title bar across the top; under it the
          sidebar (projects and their chats), the chat, the canvas in its
          shell, and the panel of properties and layers (or the workbench's
          readout while inspecting). */}
      <div
        class="studio-page-scope studio bg-background font-mono text-[13px] text-foreground antialiased"
        classList={{ "is-folded": !sidebarOpen(), "no-chat": !agentOpen(), "no-panel": !panelOpen() && !bench() }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => void onDrop(e)}
      >
        {/* The title bar first: Tab reads it before the sidebar and the canvas. */}
        <Toolbar
          ref={(api) => (toolbar = api)}
          sidebarOpen={sidebarOpen()}
          onUpdateSidebarOpen={setSidebarOpen}
          chatOpen={agentOpen()}
          onUpdateChatOpen={setAgentOpen}
          panelOpen={panelOpen()}
          onUpdatePanelOpen={setPanelOpen}
          libraryOpen={libraryOpen()}
          onUpdateLibraryOpen={setLibraryOpen}
          agentState={agentState()}
          onGuide={showAround}
        />
        <StudioSidebar
          ref={(el) => (sidebar = el)}
          show={sidebarOpen()}
          locked={locked()}
          onLibrary={() => setLibraryOpen(true)}
          onAgent={toChat}
          onSearch={() => setSearchOpen(true)}
        />

        <section
          style={{ display: agentOpen() ? undefined : "none" }}
          ref={(el) => (chat = el)}
          class="studio-chat flat-shell"
          aria-label="Chat"
        >
          <Suspense>
            <AgentPanel
              ref={(api) => (agentPanel = api)}
              onClose={() => setAgentOpen(false)}
              onActivity={onAgentActivity}
            />
          </Suspense>
        </section>

        <main ref={setShell} class="studio-canvas hardshell" aria-label="Canvas">
          <Canvas ref={setCanvas} />
          {canvasBar()}
          <DataEditor />
        </main>

        <Show
          when={bench()}
          fallback={
            <Show when={panelOpen()}>
              <aside ref={(el) => (side = el)} class="studio-side flat-shell" aria-label="Properties and layers">
                <StudioPanel />
              </aside>
            </Show>
          }
        >
          {(b) => (
            <aside class="studio-side studio-bench flat-shell" aria-label="Workbench">
              <Suspense>
                {/* a workbench per project: another project's is a new one */}
                <For each={[activeProjectId.value]}>
                  {(project) => (
                    <Workbench
                      host={b().host}
                      content={b().content}
                      card={b().card}
                      benchKey={`studio:${project}`}
                      section="studio"
                      title="The Studio canvas (dither-ui)"
                      url={studioUrl()}
                      send={(md: string) => askAgent(md, editor.selectedIds)}
                      onExit={stopInspecting}
                    />
                  )}
                </For>
              </Suspense>
            </aside>
          )}
        </Show>

        <SearchPalette
          open={searchOpen()}
          locked={locked()}
          onClose={() => setSearchOpen(false)}
          onAgent={toChat}
          onLibrary={() => setLibraryOpen(true)}
        />
        <Suspense>
          <Show when={exportOpen()}>
            <ExportDialog open={exportOpen()} onClose={() => setExportOpen(false)} />
          </Show>
          <Show when={videoOpen()}>
            <VideoDialog open={videoOpen()} onClose={() => setVideoOpen(false)} />
          </Show>
        </Suspense>
        <ShortcutsHelp />
        <StudioGuide open={tourOpen()} stops={tour} onClose={() => setTourOpen(false)} />
      </div>
    </Show>
  )
}
