import { createEffect, createMemo, createSignal, For, on, onCleanup, onMount, Show } from "solid-js"
import { DitherAlertDialog, DitherIcon } from "@dither-ui/kit"
import { Presence } from "@dither-ui/kit/solid/runtime/presence.tsx"
import { cn } from "@dither-ui/kit/tailwind/lib.ts"
import type { ArtboardKind } from "@/entities/artboard"
import { COMPONENT_REGISTRY, type ComponentEntry, type ComponentGroup } from "@/entities/widget"
import { CHART_TYPES } from "@/shared/config"
import { addArtboard, addComponentArtboard, addScreenArtboard } from "@/entities/editor"
import type { AgentActivity } from "@/features/agent/tools"
import { history, redo, undo } from "@/features/history"
import {
  activeProjectId,
  activeProjectName,
  createProject,
  deleteProject,
  deleteWarning,
  exportDocument,
  importDocument,
  projects,
  renameProject,
  switchProject,
} from "@/features/persistence"
import { addArtboardFromPreset, presets } from "@/features/presets"
import { focusFirstMenuItem, menuKeydown, useTheme } from "@/shared/lib"
import Mascot from "@/shared/ui/Mascot"
import "@/widgets/toolbar/tool.css"
import "./Toolbar.css"

/** What the bar hands whoever holds it. */
export type ToolbarApi = {
  /** The tour's own key: its last stop points at it. */
  readonly guideKey: HTMLButtonElement | null
}

export type ToolbarProps = {
  sidebarOpen: boolean
  /** The chat's column is showing. */
  chatOpen: boolean
  /** The panel of properties and layers is showing. */
  panelOpen: boolean
  libraryOpen: boolean
  /** What the agent is doing, shown on its key (the panel may be closed). */
  agentState?: AgentActivity
  onUpdateSidebarOpen?: (open: boolean) => void
  onUpdateChatOpen?: (open: boolean) => void
  onUpdatePanelOpen?: (open: boolean) => void
  onUpdateLibraryOpen?: (open: boolean) => void
  onGuide?: () => void
  ref?: (api: ToolbarApi) => void
}

const AGENT_SAYS: Record<AgentActivity, string> = {
  idle: "Chat",
  working: "Chat, the agent is working",
  waiting: "Chat, the agent is waiting for you",
  unseen: "Chat, the agent finished",
}
const GROUPS: { id: ComponentGroup; label: string }[] = [
  { id: "inputs", label: "Inputs" },
  { id: "navigation", label: "Navigation" },
  { id: "display", label: "Display" },
  { id: "overlays", label: "Overlays" },
  { id: "structure", label: "Structure" },
]
const WIDGETS = ["avatar", "button", "gradient", "image"] as const

// The Studio's title bar, across the window: the sidebar's key and the
// history on the left, the project (its menu) in the middle, the library,
// the chat's column, the panel of properties and layers and the mascot's
// tour on the right.
export default function Toolbar(props: ToolbarProps) {
  // The tour's last stop points at its own key.
  let guideKey: HTMLButtonElement | null = null
  props.ref?.({
    get guideKey() {
      return guideKey
    },
  })
  const { dark, toggle } = useTheme()
  const libraryOpen = () => props.libraryOpen
  const setLibraryOpen = (v: boolean) => props.onUpdateLibraryOpen?.(v)
  const [projectOpen, setProjectOpen] = createSignal(false)
  const [query, setQuery] = createSignal("")
  let searchRef: HTMLInputElement | undefined
  let fileInput: HTMLInputElement | undefined
  const matches = (entry: ComponentEntry) =>
    !query().trim() || `${entry.label} ${entry.is}`.toLowerCase().includes(query().trim().toLowerCase())
  const grouped = createMemo(() =>
    GROUPS.map((group) => ({
      ...group,
      items: COMPONENT_REGISTRY.filter((entry) => entry.group === group.id && matches(entry)),
    })).filter((group) => group.items.length),
  )

  // The library is a dialog: its search focused on open, focus back on its
  // key when it closes with focus inside it (or nowhere), Escape anywhere in it.
  let libraryKey: HTMLButtonElement | undefined
  let libraryPanel: HTMLDivElement | undefined
  createEffect(
    on(
      libraryOpen,
      (open) => {
        if (open) queueMicrotask(() => searchRef?.focus())
        else {
          setQuery("")
          queueMicrotask(() => {
            const a = document.activeElement
            if (!a || a === document.body || libraryPanel?.contains(a)) libraryKey?.focus()
          })
        }
      },
      { defer: true },
    ),
  )
  // Naming happens inline in the menu (no browser prompt): the row becomes a
  // field, Enter commits, Escape backs out. Deleting asks through the kit's
  // alert dialog.
  const [naming, setNaming] = createSignal<"new" | "rename" | null>(null)
  const [draft, setDraft] = createSignal("")
  let nameInput: HTMLInputElement | undefined
  const closeMenus = () => {
    setLibraryOpen(false)
    setProjectOpen(false)
    setNaming(null)
  }
  // The project menu is a real menu: first item focused on open, focus back
  // on the trigger when it closes, arrow keys between items.
  let projectTrigger: HTMLButtonElement | undefined
  let projectMenu: HTMLDivElement | undefined
  createEffect(
    on(
      projectOpen,
      (open) => {
        if (open) queueMicrotask(() => focusFirstMenuItem(projectMenu ?? null))
        // The leave transition keeps the menu in the DOM for a beat, so "focus is
        // still on a menu item" counts as orphaned too.
        else
          queueMicrotask(() => {
            const a = document.activeElement
            if (!a || a === document.body || a.closest("[role=menu]")) projectTrigger?.focus()
          })
      },
      { defer: true },
    ),
  )
  // Menus dismiss like menus: Escape anywhere, or a pointer landing outside the toolbar.
  let rootEl: HTMLElement | undefined
  const onWindowKey = (e: KeyboardEvent) => {
    if (e.key === "Escape" && (libraryOpen() || projectOpen())) closeMenus()
  }
  const onWindowDown = (e: PointerEvent) => {
    if ((libraryOpen() || projectOpen()) && e.target instanceof Node && !rootEl?.contains(e.target)) closeMenus()
  }
  onMount(() => {
    window.addEventListener("keydown", onWindowKey)
    window.addEventListener("pointerdown", onWindowDown)
    onCleanup(() => {
      window.removeEventListener("keydown", onWindowKey)
      window.removeEventListener("pointerdown", onWindowDown)
    })
  })
  const add = (kind: ArtboardKind) => {
    addArtboard(kind)
    closeMenus()
  }
  const addComponent = (entry: ComponentEntry) => {
    addComponentArtboard(entry)
    closeMenus()
  }
  const addScreen = () => {
    addScreenArtboard()
    closeMenus()
  }
  function startNaming(mode: "new" | "rename") {
    setDraft(mode === "rename" ? activeProjectName() : `Project ${projects.length + 1}`)
    setNaming(mode)
    queueMicrotask(() => nameInput?.select())
  }
  function commitName() {
    const name = draft().trim()
    if (name) {
      if (naming() === "new") createProject(name)
      else renameProject(activeProjectId.value, name)
    }
    closeMenus()
  }
  const [confirmDelete, setConfirmDelete] = createSignal(false)
  function removeProject() {
    closeMenus()
    setConfirmDelete(true)
  }
  function doDelete() {
    deleteProject(activeProjectId.value)
    setConfirmDelete(false)
  }
  async function openFile(e: Event) {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    if (file) await importDocument(file)
    input.value = ""
  }

  return (
    <header ref={(el) => (rootEl = el)} class="toolbar-scope bar">
      <div class="flex items-center gap-0.5 justify-self-start">
        <button
          type="button"
          class="tool"
          aria-pressed={props.sidebarOpen}
          aria-label={props.sidebarOpen ? "Hide the sidebar" : "Show the sidebar"}
          title={props.sidebarOpen ? "Hide the sidebar" : "Show the sidebar"}
          onClick={() => props.onUpdateSidebarOpen?.(!props.sidebarOpen)}
        >
          <DitherIcon name="Sidebar" size={15} strokeWidth={1.5} />
        </button>
        <button
          type="button"
          aria-label="Undo"
          title="Undo (⌘Z)"
          disabled={!history.canUndo}
          class="tool"
          onClick={() => undo()}
        >
          <DitherIcon name="Undo" size={15} strokeWidth={1.5} />
        </button>
        <button
          type="button"
          aria-label="Redo"
          title="Redo (⌘⇧Z)"
          disabled={!history.canRedo}
          class="tool"
          onClick={() => redo()}
        >
          <DitherIcon name="Redo" size={15} strokeWidth={1.5} />
        </button>
      </div>
      <div class="relative justify-self-center">
        <button
          ref={(el) => (projectTrigger = el)}
          type="button"
          aria-haspopup="menu"
          aria-expanded={projectOpen()}
          class="project"
          onClick={() => {
            setProjectOpen(!projectOpen())
            setLibraryOpen(false)
          }}
        >
          <span class="truncate">{activeProjectName()}</span>
          <DitherIcon name="ChevronDown" size={12} strokeWidth={1.5} />
        </button>
        <Presence when={projectOpen()} name="pop">
          <div
            ref={(el) => (projectMenu = el)}
            role="menu"
            class="rim absolute left-1/2 top-full z-40 mt-1 w-56 -translate-x-1/2 rounded-2xl bg-card p-1 shadow-[0_8px_24px_rgba(0,0,0,0.32)]"
            on:keydown={menuKeydown}
          >
            <For each={projects}>
              {(project) => (
                <button
                  type="button"
                  role="menuitem"
                  class={cn(
                    "flex w-full rounded-md px-2 py-1.5 text-left text-xs",
                    project.id === activeProjectId.value
                      ? "ring-on"
                      : "text-muted-foreground hover:bg-background hover:text-foreground",
                  )}
                  onClick={() => {
                    switchProject(project.id)
                    closeMenus()
                  }}
                >
                  {project.name}
                </button>
              )}
            </For>
            <div class="my-1 h-px bg-border" />
            <Show
              when={naming()}
              fallback={
                <>
                  <button type="button" role="menuitem" class="menu-row" onClick={() => startNaming("new")}>
                    New project
                  </button>
                  <button type="button" role="menuitem" class="menu-row" onClick={() => startNaming("rename")}>
                    Rename
                  </button>
                </>
              }
            >
              <form
                class="px-1 py-1"
                onSubmit={(e) => {
                  e.preventDefault()
                  commitName()
                }}
              >
                <input
                  ref={(el) => (nameInput = el)}
                  value={draft()}
                  type="text"
                  aria-label={naming() === "new" ? "New project name" : "Project name"}
                  placeholder="Project name"
                  class="h-7 w-full rounded-md border border-edge bg-background px-2 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:border-ring"
                  onInput={(e) => setDraft(e.currentTarget.value)}
                  // On the field itself: Escape backs out of naming and goes
                  // no further, so the menu stays open.
                  on:keydown={(e) => {
                    if (e.key !== "Escape") return
                    e.stopPropagation()
                    setNaming(null)
                  }}
                />
              </form>
            </Show>
            <button
              type="button"
              role="menuitem"
              class="menu-row"
              onClick={() => {
                exportDocument()
                closeMenus()
              }}
            >
              Save to file
            </button>
            <button
              type="button"
              role="menuitem"
              class="menu-row"
              onClick={() => {
                fileInput?.click()
                closeMenus()
              }}
            >
              Open file
            </button>
            <div class="my-1 h-px bg-border" />
            <button type="button" role="menuitem" class="menu-row text-destructive" onClick={removeProject}>
              Delete project
            </button>
          </div>
        </Presence>
      </div>

      <div class="flex items-center gap-0.5 justify-self-end">
        <div class="relative mr-1">
          <button
            ref={(el) => (libraryKey = el)}
            type="button"
            aria-haspopup="dialog"
            aria-expanded={libraryOpen()}
            class="key-chrome flex h-8 items-center gap-2 px-3.5 text-[12px] font-medium transition-[filter,scale] active:scale-[0.96]"
            onClick={() => {
              setLibraryOpen(!libraryOpen())
              setProjectOpen(false)
            }}
          >
            <DitherIcon name="Plus" size={14} strokeWidth={1.5} />
            Library
          </button>
          <Presence when={libraryOpen()} name="pop">
            <div
              ref={(el) => (libraryPanel = el)}
              role="dialog"
              aria-label="Component library"
              onKeyDown={(e) => e.key === "Escape" && setLibraryOpen(false)}
              class="absolute right-0 top-full z-40 mt-2 flex max-h-[min(72dvh,640px)] w-[420px] flex-col overflow-hidden rim rounded-2xl bg-card shadow-[0_12px_36px_rgba(0,0,0,0.38)]"
            >
              <label class="border-b border-border/60 p-2">
                <span class="sr-only">Search components</span>
                <input
                  ref={(el) => (searchRef = el)}
                  value={query()}
                  type="search"
                  name="component-search"
                  placeholder={`Search ${COMPONENT_REGISTRY.length} components…`}
                  class="h-9 w-full rounded-md border border-edge bg-background px-3 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:border-ring"
                  onInput={(e) => setQuery(e.currentTarget.value)}
                />
              </label>
              <div class="overflow-y-auto p-2">
                <Show when={!query()}>
                  <section class="mb-3">
                    <p class="library-label">Canvas</p>
                    <div class="grid grid-cols-3 gap-1">
                      <For each={CHART_TYPES}>
                        {(type) => (
                          <button type="button" class="library-item capitalize" onClick={() => add(type)}>
                            {type} chart
                          </button>
                        )}
                      </For>
                      <For each={WIDGETS}>
                        {(type) => (
                          <button type="button" class="library-item capitalize" onClick={() => add(type)}>
                            {type}
                          </button>
                        )}
                      </For>
                      <button type="button" class="library-item" onClick={addScreen}>
                        Screen
                      </button>
                    </div>
                  </section>
                </Show>
                <For each={grouped()}>
                  {(group) => (
                    <section class="mb-3 last:mb-0">
                      <p class="library-label">{group.label}</p>
                      <div class="grid grid-cols-2 gap-1">
                        <For each={group.items}>
                          {(entry) => (
                            <button type="button" class="library-item text-left" onClick={() => addComponent(entry)}>
                              <span class="block truncate text-foreground">{entry.label}</span>
                              <span class="block truncate text-[9px] text-muted-foreground">{entry.is}</span>
                            </button>
                          )}
                        </For>
                      </div>
                    </section>
                  )}
                </For>
                <Show when={presets.length && !query()}>
                  <section>
                    <p class="library-label">Presets</p>
                    <For each={presets}>
                      {(preset) => (
                        <button
                          type="button"
                          class="library-item w-full text-left"
                          onClick={() => {
                            addArtboardFromPreset(preset)
                            closeMenus()
                          }}
                        >
                          {preset.name}
                        </button>
                      )}
                    </For>
                  </section>
                </Show>
                <Show when={!grouped().length}>
                  <p class="px-2 py-8 text-center text-xs text-muted-foreground">No components match “{query()}”.</p>
                </Show>
              </div>
            </div>
          </Presence>
        </div>
        <button
          type="button"
          aria-label={`Toggle the chat (${AGENT_SAYS[props.agentState ?? "idle"]})`}
          aria-pressed={props.chatOpen}
          title={`${AGENT_SAYS[props.agentState ?? "idle"]} (⌘I)`}
          class="tool wide"
          onClick={() => props.onUpdateChatOpen?.(!props.chatOpen)}
        >
          <span class="agent-key">
            <DitherIcon name="Bot" size={15} strokeWidth={1.5} />
            <Show when={props.agentState && props.agentState !== "idle"}>
              <span class="agent-dot" data-state={props.agentState} aria-hidden="true" />
            </Show>
          </span>
          Chat
        </button>
        <button
          type="button"
          aria-label="Toggle properties and layers"
          aria-pressed={props.panelOpen}
          title="Properties and layers"
          class="tool"
          onClick={() => props.onUpdatePanelOpen?.(!props.panelOpen)}
        >
          <DitherIcon name="Sliders" size={15} strokeWidth={1.5} />
        </button>
        <button
          ref={(el) => (guideKey = el)}
          type="button"
          aria-label="Show me around"
          title="Show me around"
          class="tool"
          onClick={() => props.onGuide?.()}
        >
          <Mascot size={16} />
        </button>
        <button type="button" aria-label={dark() ? "Use light theme" : "Use dark theme"} class="tool" onClick={toggle}>
          <DitherIcon name={dark() ? "Sun" : "Moon"} size={15} strokeWidth={1.5} />
        </button>
      </div>

      <input
        ref={(el) => (fileInput = el)}
        type="file"
        accept="application/json"
        name="open-project"
        aria-label="Project file"
        class="hidden"
        onChange={openFile}
      />
      <DitherAlertDialog
        open={confirmDelete()}
        title="Delete project?"
        description={deleteWarning(activeProjectId.value)}
        confirmLabel="Delete"
        danger
        onConfirm={doDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </header>
  )
}
