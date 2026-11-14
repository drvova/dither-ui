import { createMemo, createSignal, For, onCleanup, onMount, Show } from "solid-js"
import { DitherAlertDialog, DitherAvatar, DitherIcon } from "@dither-ui/kit"
import {
  agoOf,
  built,
  chatGroups,
  type ChatMeta,
  chats,
  newChat,
  openChat,
  pinChat,
  removeBuilt,
  removeChat,
  renameChat,
} from "@/features/agent"
import {
  activeProjectId,
  createProject,
  deleteProject,
  deleteWarning,
  duplicateProject,
  projects,
  renameProject,
  switchProject,
  type ProjectMeta,
} from "@/features/persistence"
import { modKey, routePath } from "@/shared/lib"
import Mascot from "@/shared/ui/Mascot"
import RowMenu, { type RowAction } from "./RowMenu"
import "./StudioSidebar.css"

export type StudioSidebarProps = {
  /** A turn is running: the chat and the project stay put until it ends. */
  locked: boolean
  /** Whether it shows: folded away it stays mounted. */
  show?: boolean
  onLibrary?: () => void
  onAgent?: () => void
  onSearch?: () => void
  /** The sidebar's own element, for the tour to point at. */
  ref?: (el: HTMLElement) => void
}

// The Studio's sidebar, an agent app's: what to start (a chat, a search, a
// frame), then the projects, the open one unfolded into its chats (pinned,
// then by the day each last moved), every row with its own menu; the tools
// your agent built; the way home and to the docs at the foot.
export default function StudioSidebar(props: StudioSidebarProps) {
  const [now, setNow] = createSignal(Date.now())
  // The tools a harness built are read from storage as their module loads,
  // which a server render has none of: listed once the page has mounted.
  const [mounted, setMounted] = createSignal(false)
  // A server render knows no keyboard: it writes the shortcut as most do,
  // and an Apple one corrects it as the page mounts.
  const [searchKey, setSearchKey] = createSignal(modKey("K", false))
  onMount(() => {
    setMounted(true)
    setSearchKey(modKey("K"))
    const tick = setInterval(() => setNow(Date.now()), 60_000)
    onCleanup(() => clearInterval(tick))
  })

  const groups = createMemo(() => chatGroups(chats.list, now()))
  const [toolsOpen, setToolsOpen] = createSignal(false)

  function startChat() {
    if (props.locked) return
    newChat()
    props.onAgent?.()
  }
  function pickChat(id: string) {
    if (props.locked && id !== chats.active) return
    openChat(id)
    props.onAgent?.()
  }
  function pickProject(id: string) {
    if (props.locked && id !== activeProjectId.value) return
    switchProject(id)
  }

  // Naming in place: the row becomes a field, Enter or leaving it keeps the
  // name, Escape backs out.
  const [naming, setNaming] = createSignal<{ kind: "project" | "chat"; id: string } | null>(null)
  const [draft, setDraft] = createSignal("")
  let field: HTMLInputElement | undefined
  function startNaming(kind: "project" | "chat", id: string, name: string) {
    setNaming({ kind, id })
    setDraft(name)
    queueMicrotask(() => field?.select())
  }
  function commitName() {
    const n = naming()
    if (!n) return
    if (n.kind === "project") renameProject(n.id, draft())
    else renameChat(n.id, draft())
    setNaming(null)
  }
  const isNaming = (kind: "project" | "chat", id: string) => naming()?.kind === kind && naming()?.id === id
  const backOut = (e: KeyboardEvent) => {
    if (e.key !== "Escape") return
    e.stopPropagation()
    e.preventDefault()
    setNaming(null)
  }

  const [doomed, setDoomed] = createSignal<ProjectMeta | null>(null)
  function confirmDelete() {
    const p = doomed()
    if (p) deleteProject(p.id)
    setDoomed(null)
  }

  const projectActions = (p: ProjectMeta): RowAction[] => [
    { label: "Rename", run: () => startNaming("project", p.id, p.name) },
    { label: "Duplicate", run: () => duplicateProject(p.id), disabled: props.locked },
    { label: "Delete project", run: () => setDoomed(p), danger: true, disabled: props.locked },
  ]
  const chatActions = (c: ChatMeta): RowAction[] => [
    { label: "Rename", run: () => startNaming("chat", c.id, c.title) },
    { label: c.pinned ? "Unpin" : "Pin", run: () => pinChat(c.id, !c.pinned) },
    {
      label: "Delete chat",
      run: () => removeChat(c.id),
      danger: true,
      disabled: props.locked && c.id === chats.active,
    },
  ]

  return (
    <aside
      ref={(el) => props.ref?.(el)}
      class="studio-sidebar-scope side"
      aria-label="Projects and chats"
      style={{ display: (props.show ?? true) ? undefined : "none" }}
    >
      <div class="nav">
        <button
          type="button"
          class="nav-row is-primary"
          disabled={props.locked}
          title={props.locked ? "Stop the turn to start a new chat" : "New chat"}
          onClick={startChat}
        >
          <DitherIcon name="Edit" size={14} strokeWidth={1.5} />
          <span class="row-label">New chat</span>
        </button>
        <button
          type="button"
          class="nav-row"
          title="Search chats, projects and frames"
          onClick={() => props.onSearch?.()}
        >
          <DitherIcon name="Search" size={14} strokeWidth={1.5} />
          <span class="row-label">Search</span>
          <kbd class="row-label hint">{searchKey()}</kbd>
        </button>
        <button type="button" class="nav-row" onClick={() => props.onLibrary?.()}>
          <DitherIcon name="Plus" size={14} strokeWidth={1.5} />
          <span class="row-label">Add a frame</span>
        </button>
      </div>

      <section class="group projects" aria-labelledby="side-projects">
        <div class="group-head">
          <h2 id="side-projects" class="group-label">
            Projects
          </h2>
          <button
            type="button"
            class="group-key"
            aria-label="New project"
            title="New project"
            disabled={props.locked}
            onClick={() => createProject(`Project ${projects.length + 1}`)}
          >
            <DitherIcon name="Plus" size={13} strokeWidth={1.5} />
          </button>
        </div>
        <ul class="list">
          <For each={projects}>
            {(p) => (
              <li class="project">
                <div class="has-menu row-wrap">
                  <Show
                    when={isNaming("project", p.id)}
                    fallback={
                      <button
                        type="button"
                        class="nav-row project-row"
                        aria-current={p.id === activeProjectId.value ? "page" : undefined}
                        aria-expanded={p.id === activeProjectId.value}
                        disabled={props.locked && p.id !== activeProjectId.value}
                        title={
                          props.locked && p.id !== activeProjectId.value ? "Stop the turn to switch projects" : p.name
                        }
                        onClick={() => pickProject(p.id)}
                        onDblClick={() => startNaming("project", p.id, p.name)}
                      >
                        <DitherAvatar name={p.name} size={16} grid={6} cellPx={1} animate={false} />
                        <span class="row-label grow">{p.name}</span>
                      </button>
                    }
                  >
                    <form
                      class="naming"
                      onSubmit={(e) => {
                        e.preventDefault()
                        commitName()
                      }}
                    >
                      <DitherAvatar name={p.name} size={16} grid={6} cellPx={1} animate={false} />
                      <input
                        ref={(el) => (field = el)}
                        value={draft()}
                        onInput={(e) => setDraft(e.currentTarget.value)}
                        type="text"
                        name="project-name"
                        aria-label="Project name"
                        class="name-field"
                        onBlur={commitName}
                        on:keydown={backOut}
                      />
                    </form>
                  </Show>
                  <Show when={!isNaming("project", p.id)}>
                    <RowMenu label={`More for ${p.name}`} actions={projectActions(p)} />
                  </Show>
                </div>

                {/* The open project's chats, under it. */}
                <Show when={p.id === activeProjectId.value}>
                  <div class="chats">
                    <Show when={!groups().length}>
                      <p class="empty row-label">
                        <Mascot size={14} />
                        <span class="truncate">No chats yet.</span>
                      </p>
                    </Show>
                    <For each={groups()}>
                      {(g) => (
                        <section class="day" aria-label={g.label}>
                          <h3 class="day-label row-label">{g.label}</h3>
                          <ul class="list">
                            <For each={g.chats}>
                              {(c) => (
                                <li class="has-menu row-wrap">
                                  <Show
                                    when={isNaming("chat", c.id)}
                                    fallback={
                                      <button
                                        type="button"
                                        class="nav-row chat-row"
                                        aria-current={c.id === chats.active ? "true" : undefined}
                                        disabled={props.locked && c.id !== chats.active}
                                        title={
                                          props.locked && c.id !== chats.active
                                            ? "Stop the turn to switch chats"
                                            : c.title
                                        }
                                        onClick={() => pickChat(c.id)}
                                        onDblClick={() => startNaming("chat", c.id, c.title)}
                                      >
                                        <Show when={c.pinned}>
                                          <DitherIcon name="Pin" size={12} strokeWidth={1.5} />
                                        </Show>
                                        <span class="row-label grow">{c.title}</span>
                                        <span class="row-label ago">{agoOf(c.at, now())}</span>
                                      </button>
                                    }
                                  >
                                    <form
                                      class="naming is-chat"
                                      onSubmit={(e) => {
                                        e.preventDefault()
                                        commitName()
                                      }}
                                    >
                                      <input
                                        ref={(el) => (field = el)}
                                        value={draft()}
                                        onInput={(e) => setDraft(e.currentTarget.value)}
                                        type="text"
                                        name="chat-title"
                                        aria-label="Chat title"
                                        class="name-field"
                                        onBlur={commitName}
                                        on:keydown={backOut}
                                      />
                                    </form>
                                  </Show>
                                  <Show when={!isNaming("chat", c.id)}>
                                    <RowMenu label={`More for ${c.title}`} actions={chatActions(c)} />
                                  </Show>
                                </li>
                              )}
                            </For>
                          </ul>
                        </section>
                      )}
                    </For>
                  </div>
                </Show>
              </li>
            )}
          </For>
        </ul>
      </section>

      {/* The tools a harness built for its jobs: kept, found first, and run
          only when you allow it; remove one and it is gone. */}
      <Show when={mounted() && built.list.length}>
        <section class="group tools" aria-labelledby="side-tools">
          <button
            id="side-tools"
            type="button"
            class="nav-row tools-head"
            aria-expanded={toolsOpen()}
            onClick={() => setToolsOpen(!toolsOpen())}
          >
            <DitherIcon name={toolsOpen() ? "ChevronDown" : "ChevronRight"} size={12} strokeWidth={1.5} />
            <span class="row-label grow">Tools your agent built</span>
            <span class="row-label ago">{built.list.length}</span>
          </button>
          <Show when={toolsOpen()}>
            <ul class="list">
              <For each={built.list}>
                {(t) => (
                  <li class="has-menu row-wrap">
                    <p class="nav-row tool-row" title={t.description}>
                      <DitherIcon name="Sparkles" size={13} strokeWidth={1.5} />
                      <span class="row-label grow">{t.name.replace(/_/g, " ")}</span>
                      <span class="row-label ago">{agoOf(t.at, now())}</span>
                    </p>
                    <RowMenu
                      label={`More for ${t.name.replace(/_/g, " ")}`}
                      actions={[{ label: "Remove tool", run: () => removeBuilt(t.name), danger: true }]}
                    />
                  </li>
                )}
              </For>
            </ul>
          </Show>
        </section>
      </Show>

      <div class="foot">
        <a href={routePath("/")} class="nav-row" title="dither-ui home">
          <svg
            viewBox="0 0 7 7"
            width="14"
            height="14"
            aria-hidden="true"
            {...{ focusable: "false" }}
            shape-rendering="crispEdges"
          >
            <path d="M3 0h1v1h1v1h1v1h1v1h-1v1h-1v1h-1v1h-1v-1h-1v-1h-1v-1h-1v-1h1v-1h1v-1h1z" fill="currentColor" />
            <rect x="3" y="3" width="1" height="1" fill="var(--swatch-orange)" />
          </svg>
          <span class="row-label">dither-ui</span>
        </a>
        <a href={routePath("/docs")} class="nav-row">
          <DitherIcon name="Book" size={14} strokeWidth={1.5} />
          <span class="row-label">Docs</span>
        </a>
      </div>

      <DitherAlertDialog
        open={!!doomed()}
        title="Delete project?"
        description={doomed() ? deleteWarning(doomed()!.id) : ""}
        confirmLabel="Delete"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDoomed(null)}
      />
    </aside>
  )
}
