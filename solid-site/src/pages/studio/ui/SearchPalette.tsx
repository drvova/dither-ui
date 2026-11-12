// Search, ⌘K: one field over everything the Studio holds: the chats of
// every project (the open one first), the projects, the open project's
// frames and the actions to start something. Arrows move, Enter opens,
// Escape or a press outside closes, and focus goes back where it was.
import { createEffect, createMemo, createSignal, For, on, Show } from "solid-js"
import { DitherIcon, type IconName } from "@dither-kit"
import { editor, frame, selectArtboard } from "~/entities/editor"
import { chats, chatsOf, newChat, openChat, openProject } from "~/features/agent/chats"
import { activeProjectId, createProject, projects, switchProject } from "~/features/persistence"
import Mascot from "~/shared/ui/Mascot"
import "./SearchPalette.css"

export type SearchPaletteProps = {
  open: boolean
  locked: boolean
  onClose?: () => void
  onAgent?: () => void
  onLibrary?: () => void
}

type Hit = { id: string; icon: IconName; label: string; detail: string; run: () => void; disabled?: boolean }

export default function SearchPalette(props: SearchPaletteProps) {
  const [query, setQuery] = createSignal("")
  const [index, setIndex] = createSignal(0)
  let field: HTMLInputElement | undefined
  let back: HTMLElement | null = null

  createEffect(
    on(
      () => props.open,
      (open) => {
        if (open) {
          back = document.activeElement as HTMLElement | null
          setQuery("")
          setIndex(0)
          queueMicrotask(() => field?.focus())
        } else queueMicrotask(() => back?.focus?.())
      },
      { defer: true },
    ),
  )

  const fits = (text: string) => text.toLowerCase().includes(query().trim().toLowerCase())

  // Read only while the palette is open: the other projects' chats come
  // from storage, which a server render has none of.
  const hits = createMemo<Hit[]>(() => {
    if (!props.open) return []
    const q = query().trim()
    const out: Hit[] = []
    const actions: Hit[] = [
      {
        id: "a:chat",
        icon: "Edit",
        label: "New chat",
        detail: "action",
        run: () => (newChat(), props.onAgent?.()),
        disabled: props.locked,
      },
      {
        id: "a:project",
        icon: "Folder",
        label: "New project",
        detail: "action",
        run: () => createProject(`Project ${projects.length + 1}`),
        disabled: props.locked,
      },
      { id: "a:frame", icon: "Plus", label: "Add a frame", detail: "action", run: () => props.onLibrary?.() },
    ]
    // The open project's chats first, then every other project's.
    const ordered = [...projects].sort((a, b) =>
      a.id === activeProjectId.value ? -1 : b.id === activeProjectId.value ? 1 : 0,
    )
    for (const p of ordered)
      for (const c of chatsOf(p.id)) {
        if (q && !fits(c.title)) continue
        const here = p.id === activeProjectId.value
        out.push({
          id: `c:${p.id}:${c.id}`,
          icon: "Bot",
          label: c.title,
          detail: here ? "chat" : `chat in ${p.name}`,
          disabled: props.locked && !(here && c.id === chats.active),
          run: () => {
            if (!here) {
              switchProject(p.id)
              openProject(p.id)
            }
            openChat(c.id)
            props.onAgent?.()
          },
        })
      }
    for (const p of projects)
      if (!q || fits(p.name))
        out.push({
          id: `p:${p.id}`,
          icon: "Folder",
          label: p.name,
          detail: p.id === activeProjectId.value ? "project, open" : "project",
          disabled: props.locked && p.id !== activeProjectId.value,
          run: () => switchProject(p.id),
        })
    if (q)
      for (const a of editor.artboards)
        if (fits(a.name))
          out.push({
            id: `f:${a.id}`,
            icon: "Layout",
            label: a.name,
            detail: "frame",
            run: () => {
              selectArtboard(a.id)
              frame([a])
            },
          })
    const doable = actions.filter((a) => !q || fits(a.label))
    // With nothing typed: the actions, then the newest chats.
    return q ? [...out, ...doable] : [...doable, ...out.slice(0, 12)]
  })

  createEffect(on(hits, (h) => setIndex((i) => Math.min(i, Math.max(0, h.length - 1))), { defer: true }))

  function choose(h: Hit | undefined) {
    if (!h || h.disabled) return
    props.onClose?.()
    h.run()
  }
  function onKey(e: KeyboardEvent) {
    const n = hits().length
    if (e.key === "ArrowDown" && n) {
      e.preventDefault()
      setIndex((index() + 1) % n)
    } else if (e.key === "ArrowUp" && n) {
      e.preventDefault()
      setIndex((index() - 1 + n) % n)
    } else if (e.key === "Enter") {
      e.preventDefault()
      choose(hits()[index()])
    } else if (e.key === "Escape") {
      e.preventDefault()
      props.onClose?.()
    }
  }
  createEffect(
    on(
      index,
      (i) => queueMicrotask(() => document.getElementById(`search-hit-${i}`)?.scrollIntoView({ block: "nearest" })),
      { defer: true },
    ),
  )

  return (
    <Show when={props.open}>
      <div class="search-palette-scope scrim" onPointerDown={(e) => e.target === e.currentTarget && props.onClose?.()}>
        <div class="palette" role="dialog" aria-modal="true" aria-label="Search">
          <label class="head">
            <DitherIcon name="Search" size={15} strokeWidth={1.5} />
            <span class="sr-only">Search chats, projects, frames and actions</span>
            <input
              ref={(el) => (field = el)}
              value={query()}
              onInput={(e) => setQuery(e.currentTarget.value)}
              type="text"
              name="studio-search"
              role="combobox"
              aria-expanded="true"
              aria-controls="search-hits"
              aria-autocomplete="list"
              aria-activedescendant={hits().length ? `search-hit-${index()}` : undefined}
              placeholder="Search chats, projects, frames"
              autocomplete="off"
              spellcheck={false}
              class="field"
              onKeyDown={onKey}
            />
          </label>
          <ul id="search-hits" role="listbox" aria-label="Results" class="hits">
            <For each={hits()}>
              {(h, i) => (
                <li
                  id={`search-hit-${i()}`}
                  role="option"
                  aria-selected={i() === index()}
                  aria-disabled={h.disabled || undefined}
                  class="hit"
                  onPointerEnter={() => setIndex(i())}
                  onClick={() => choose(h)}
                >
                  <DitherIcon name={h.icon} size={14} strokeWidth={1.5} />
                  <span class="label">{h.label}</span>
                  <span class="detail">{h.detail}</span>
                </li>
              )}
            </For>
            <Show when={!hits().length}>
              <li class="none">
                <Mascot size={22} pose="blink" />
                <span>Nothing matches “{query().trim()}”.</span>
              </li>
            </Show>
          </ul>
        </div>
      </div>
    </Show>
  )
}
