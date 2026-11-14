import { createMemo, createSignal, For, type JSX, Show } from "solid-js"
import type { Artboard } from "@/entities/artboard"
import { type Layer, layersOf } from "@/entities/chart"
import { componentEntry } from "@/entities/widget"
import { cssColor } from "@dither-ui/kit"
import { cn } from "@dither-ui/kit/tailwind/lib.ts"
import {
  deleteGroup,
  deleteSeries,
  duplicateSelected,
  editor,
  type Group,
  groupSelected,
  removeArtboard,
  selectArtboard,
  selectGroup,
  selectLayer,
  setArtboardHidden,
  setArtboardLocked,
  setGroupHidden,
  setGroupLocked,
  ungroup,
} from "@/entities/editor"
import { savePreset } from "@/features/presets"
import { ContextMenu, type MenuItem } from "@/shared/ui"

type GroupNode = { t: "group"; group: Group }
type ArtboardNode = { t: "artboard"; a: Artboard; depth: number }
type LayerNode = { t: "layer"; a: Artboard; layer: Layer; depth: number }
// screen sub-nodes: rows and their component cells
type ScreenNode = { t: "snode"; a: Artboard; id: string; label: string; depth: number }
type Node = GroupNode | ArtboardNode | LayerNode | ScreenNode

/** A row's identity in the list: what keeps its element (and the focus on
 * it) while the tree around it changes. */
const keyOf = (node: Node) =>
  node.t === "group" ? node.group.id : node.t === "artboard" ? node.a.id : node.t === "snode" ? node.id : node.layer.id

/** A row's key at rest: shown under the pointer, on a touch screen, and
 * while the row holds the focus. */
const QUIET =
  "opacity-0 group-hover/row:opacity-70 [@media(hover:none)]:opacity-70 group-focus-within/row:opacity-70 focus-visible:opacity-100"
const RENAME =
  "min-w-0 flex-1 rounded border border-edge bg-background px-1 py-0.5 text-[13px] text-foreground outline-none select-text focus:border-ring"

function LockGlyph(props: { locked: boolean }) {
  return (
    <svg viewBox="0 0 24 24" class="size-3.5" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <Show when={props.locked} fallback={<path d="M8 11V7a4 4 0 0 1 7-2.6" />}>
        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      </Show>
    </svg>
  )
}
function EyeGlyph(props: { shown: boolean }) {
  return (
    <Show
      when={props.shown}
      fallback={
        <svg viewBox="0 0 24 24" class="size-3.5" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M2 2l20 20M6.7 6.7A10.5 10.5 0 0 0 2 12s3.5 7 10 7a9.8 9.8 0 0 0 5.3-1.5" />
        </svg>
      }
    >
      <svg viewBox="0 0 24 24" class="size-3.5" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    </Show>
  )
}

/** Enter or Space on the row itself (never from a key or a field inside it). */
const onRowKey = (run: (e: KeyboardEvent) => void) => (e: KeyboardEvent) => {
  if (e.target !== e.currentTarget || (e.key !== "Enter" && e.key !== " ")) return
  e.preventDefault()
  run(e)
}
/** A click that stays on its key: the row under it is not picked. */
const only = (run: () => void) => (e: MouseEvent) => {
  e.stopPropagation()
  run()
}

export default function LayerTree() {
  let rootEl: HTMLDivElement | undefined

  /** ↑/↓ move focus between rows. Swallow the event so the canvas-level
   * shortcut (arrow = nudge artboard) does not fire from inside the tree. */
  function onRowsKey(e: KeyboardEvent) {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return
    const rows = [...(rootEl?.querySelectorAll<HTMLElement>('[role="option"]') ?? [])]
    const i = rows.indexOf(e.target as HTMLElement)
    if (i < 0) return // focus is in a rename input or icon button
    e.preventDefault()
    e.stopPropagation()
    rows[Math.min(rows.length - 1, Math.max(0, i + (e.key === "ArrowDown" ? 1 : -1)))]?.focus()
  }

  const [collapsed, setCollapsed] = createSignal<ReadonlySet<string>>(new Set()) // collapsed artboard ids
  const isOpen = (id: string) => !collapsed().has(id)
  function setOpen(id: string, open: boolean) {
    if (isOpen(id) === open) return
    const next = new Set(collapsed())
    if (open) next.delete(id)
    else next.add(id)
    setCollapsed(next)
  }
  const toggleArtboard = (id: string) => setOpen(id, !isOpen(id))

  // Widget frames (avatar/button/gradient) are single nodes — no chart layers.
  const childLayers = (a: Artboard) => (a.widget ? [] : layersOf(a.chart, a.id).filter((l) => l.kind !== "root"))

  const nodes = createMemo<Node[]>(() => {
    const out: Node[] = []
    const pushArtboard = (a: Artboard, depth: number) => {
      out.push({ t: "artboard", a, depth })
      if (!isOpen(a.id)) return
      if (a.widget?.kind === "screen") {
        a.widget.rows.forEach((row, ri) => {
          out.push({ t: "snode", a, id: `${a.id}:row:${row.id}`, label: `Row ${ri + 1}`, depth: depth + 1 })
          for (const cell of row.cells) {
            const label = componentEntry(cell.is)?.label ?? cell.is
            out.push({ t: "snode", a, id: `${a.id}:cell:${cell.id}`, label, depth: depth + 2 })
          }
        })
        return
      }
      for (const l of childLayers(a)) out.push({ t: "layer", a, layer: l, depth: depth + 1 })
    }
    const seen = new Set<string>()
    for (const a of editor.artboards) {
      if (a.groupId) {
        if (seen.has(a.groupId)) continue
        seen.add(a.groupId)
        const g = editor.groups.find((x) => x.id === a.groupId)
        if (!g) {
          pushArtboard(a, 0)
          continue
        }
        out.push({ t: "group", group: g })
        if (!g.collapsed) for (const m of editor.artboards.filter((x) => x.groupId === g.id)) pushArtboard(m, 1)
      } else {
        pushArtboard(a, 0)
      }
    }
    return out
  })
  // The rows are listed by key, each reading its node as it is now: a row
  // keeps its element while the tree is rebuilt around it.
  const byKey = createMemo(() => new Map(nodes().map((node) => [keyOf(node), node])))
  const keys = createMemo(() => [...byKey().keys()])

  // --- state helpers ---------------------------------------------------------
  const isSel = (id: string) => editor.selectedIds.includes(id)
  const members = (g: Group) => editor.artboards.filter((a) => a.groupId === g.id)
  const groupHidden = (g: Group) => members(g).length > 0 && members(g).every((a) => a.hidden)
  const groupLocked = (g: Group) => members(g).length > 0 && members(g).every((a) => a.locked)

  const seriesOf = (a: Artboard, l: Layer) => a.chart.series.find((s) => s.key === l.seriesKey)
  function layerVisible(a: Artboard, l: Layer): boolean {
    const c = a.chart
    switch (l.kind) {
      case "grid":
        return c.grid.on
      case "xAxis":
        return c.xAxis.on
      case "yAxis":
        return c.yAxis.on
      case "legend":
        return c.legend.on
      case "tooltip":
        return c.tooltip.on
      case "series":
        return seriesOf(a, l)?.on ?? true
      default:
        return true
    }
  }
  function layerLocked(a: Artboard, l: Layer): boolean {
    const c = a.chart
    switch (l.kind) {
      case "grid":
        return c.grid.locked
      case "xAxis":
        return c.xAxis.locked
      case "yAxis":
        return c.yAxis.locked
      case "legend":
        return c.legend.locked
      case "tooltip":
        return c.tooltip.locked
      case "series":
        return seriesOf(a, l)?.locked ?? false
      default:
        return false
    }
  }
  const togglable = (l: Layer) => l.kind !== "root" && l.kind !== "pie"
  function toggleLayerVis(a: Artboard, l: Layer) {
    if (layerLocked(a, l)) return
    const c = a.chart
    switch (l.kind) {
      case "grid":
        c.grid.on = !c.grid.on
        break
      case "xAxis":
        c.xAxis.on = !c.xAxis.on
        break
      case "yAxis":
        c.yAxis.on = !c.yAxis.on
        break
      case "legend":
        c.legend.on = !c.legend.on
        break
      case "tooltip":
        c.tooltip.on = !c.tooltip.on
        break
      case "series": {
        const s = seriesOf(a, l)
        if (s) s.on = !s.on
        break
      }
    }
  }
  function toggleLayerLock(a: Artboard, l: Layer) {
    const c = a.chart
    switch (l.kind) {
      case "grid":
        c.grid.locked = !c.grid.locked
        break
      case "xAxis":
        c.xAxis.locked = !c.xAxis.locked
        break
      case "yAxis":
        c.yAxis.locked = !c.yAxis.locked
        break
      case "legend":
        c.legend.locked = !c.legend.locked
        break
      case "tooltip":
        c.tooltip.locked = !c.tooltip.locked
        break
      case "series": {
        const s = seriesOf(a, l)
        if (s) s.locked = !s.locked
        break
      }
    }
  }

  // --- selection -------------------------------------------------------------
  function clickArtboard(a: Artboard, e: MouseEvent | KeyboardEvent) {
    selectArtboard(a.id, e.metaKey || e.ctrlKey || e.shiftKey)
    setOpen(a.id, true)
  }

  // --- rename (frames + groups) ----------------------------------------------
  const [editingId, setEditingId] = createSignal<string | null>(null)
  const [editText, setEditText] = createSignal("")
  function startRename(id: string, current: string) {
    setEditText(current)
    setEditingId(id)
  }
  function commitArtboardName(a: Artboard) {
    if (editingId() !== a.id) return
    const t = editText().trim()
    if (t) a.name = t
    setEditingId(null)
  }
  function commitGroupName(g: Group) {
    if (editingId() !== g.id) return
    const t = editText().trim()
    if (t) g.name = t
    setEditingId(null)
  }
  /** The field a name is retyped in: its text selected as it opens. */
  const renameField = (name: string, commit: () => void): JSX.Element => (
    <input
      ref={(el) => queueMicrotask(() => el.select())}
      value={editText()}
      name={name}
      autocomplete="off"
      class={RENAME}
      on:input={(e) => setEditText(e.currentTarget.value)}
      on:click={(e) => e.stopPropagation()}
      on:keydown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault()
          commit()
        } else if (e.key === "Escape") {
          e.preventDefault()
          setEditingId(null)
        }
      }}
      on:blur={commit}
    />
  )

  // --- context menu ----------------------------------------------------------
  const [menu, setMenu] = createSignal<{ x: number; y: number; items: MenuItem[] } | null>(null)
  const open = (items: () => MenuItem[]) => (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setMenu({ x: e.clientX, y: e.clientY, items: items() })
  }
  function artboardItems(a: Artboard): MenuItem[] {
    return [
      { label: "Rename", onClick: () => startRename(a.id, a.name) },
      {
        label: "Duplicate",
        onClick: () => {
          if (!isSel(a.id)) selectArtboard(a.id)
          duplicateSelected()
        },
      },
      ...(!a.widget
        ? [
            {
              label: "Save as preset",
              onClick: () => {
                const name = window.prompt("Preset name", a.name)
                if (name) savePreset(name, a)
              },
            },
          ]
        : []),
      { divider: true },
      {
        label: "Group selection",
        onClick: () => {
          if (!isSel(a.id)) selectArtboard(a.id)
          groupSelected()
        },
      },
      ...(a.groupId ? [{ label: "Ungroup", onClick: () => ungroup(a.groupId!) }] : []),
      { divider: true },
      { label: a.locked ? "Unlock" : "Lock", onClick: () => setArtboardLocked(a.id, !a.locked) },
      { label: a.hidden ? "Show" : "Hide", onClick: () => setArtboardHidden(a.id, !a.hidden) },
      { divider: true },
      { label: "Delete", danger: true, onClick: () => removeArtboard(a.id) },
    ]
  }
  function groupItems(g: Group): MenuItem[] {
    return [
      { label: "Rename", onClick: () => startRename(g.id, g.name) },
      { label: "Ungroup", onClick: () => ungroup(g.id) },
      { divider: true },
      { label: groupLocked(g) ? "Unlock all" : "Lock all", onClick: () => setGroupLocked(g.id, !groupLocked(g)) },
      { label: groupHidden(g) ? "Show all" : "Hide all", onClick: () => setGroupHidden(g.id, !groupHidden(g)) },
      { divider: true },
      { label: "Delete group", danger: true, onClick: () => deleteGroup(g.id) },
    ]
  }
  function layerItems(a: Artboard, l: Layer): MenuItem[] {
    const base: MenuItem[] = [
      {
        label: layerVisible(a, l) ? "Hide" : "Show",
        disabled: layerLocked(a, l),
        onClick: () => toggleLayerVis(a, l),
      },
      { label: layerLocked(a, l) ? "Unlock" : "Lock", onClick: () => toggleLayerLock(a, l) },
    ]
    if (l.kind === "series")
      base.push({ divider: true }, { label: "Delete", danger: true, onClick: () => deleteSeries(a.id, l.seriesKey!) })
    return base
  }

  // --- rows ------------------------------------------------------------------
  /* SCREEN ROW / CELL */
  const screenRow = (node: () => ScreenNode) => (
    <div
      class={cn(
        "flex h-7 cursor-pointer items-center gap-2 rounded pr-1.5 transition-colors",
        editor.selectedLayerId === node().id ? "ring-on" : "text-muted-foreground hover:bg-card",
      )}
      style={{ "padding-left": `${4 + node().depth * 16}px` }}
      on:click={() => selectLayer(node().id)}
    >
      <span class="truncate text-[12px]">{node().label}</span>
    </div>
  )

  /* GROUP */
  const groupRow = (node: () => GroupNode) => {
    const g = () => node().group
    const picked = () => members(g()).some((m) => isSel(m.id))
    return (
      <div
        role="option"
        tabindex="0"
        aria-selected={picked()}
        aria-label={`Group ${g().name}`}
        class={cn(
          "group/row flex h-7 items-center gap-1 rounded pr-1.5 transition-colors",
          picked() ? "bg-foreground/[0.04]" : "hover:bg-card",
        )}
        on:click={() => selectGroup(g().id)}
        on:keydown={onRowKey(() => selectGroup(g().id))}
        on:contextmenu={open(() => groupItems(g()))}
      >
        <button
          type="button"
          aria-label={g().collapsed ? "Expand group" : "Collapse group"}
          class="flex size-5 shrink-0 items-center justify-center text-muted-foreground hover:text-foreground"
          on:click={only(() => (g().collapsed = !g().collapsed))}
        >
          <svg
            viewBox="0 0 24 24"
            class={cn("size-3 transition-transform", !g().collapsed ? "rotate-90" : "")}
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
          >
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
        <svg
          viewBox="0 0 24 24"
          class="size-3.5 shrink-0 text-muted-foreground"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        </svg>
        <Show
          when={editingId() === g().id}
          fallback={
            <span
              class="truncate font-medium text-foreground/90"
              on:dblclick={only(() => startRename(g().id, g().name))}
            >
              {g().name}
            </span>
          }
        >
          {renameField("group-rename", () => commitGroupName(g()))}
        </Show>
        <span class="ml-auto flex items-center gap-0.5">
          <button
            type="button"
            aria-label={groupLocked(g()) ? "Unlock group" : "Lock group"}
            aria-pressed={groupLocked(g())}
            class={cn(
              "flex size-6 items-center justify-center rounded hover:bg-background",
              groupLocked(g()) ? "text-foreground" : ["text-muted-foreground", QUIET],
            )}
            on:click={only(() => setGroupLocked(g().id, !groupLocked(g())))}
          >
            <LockGlyph locked={groupLocked(g())} />
          </button>
          <button
            type="button"
            aria-label={groupHidden(g()) ? "Show group" : "Hide group"}
            aria-pressed={groupHidden(g())}
            class={cn(
              "flex size-6 items-center justify-center rounded hover:bg-background",
              groupHidden(g()) ? "text-muted-foreground" : ["text-muted-foreground", QUIET],
            )}
            on:click={only(() => setGroupHidden(g().id, !groupHidden(g())))}
          >
            <EyeGlyph shown={!groupHidden(g())} />
          </button>
        </span>
      </div>
    )
  }

  /* ARTBOARD */
  const artboardRow = (node: () => ArtboardNode) => {
    const a = () => node().a
    return (
      <div
        role="option"
        tabindex="0"
        aria-selected={isSel(a().id)}
        aria-label={a().name}
        class={cn(
          "group/row flex h-7 items-center gap-1 rounded pr-1.5 transition-colors",
          isSel(a().id) ? "ring-on" : "hover:bg-card",
        )}
        style={{ "padding-left": `${node().depth * 16}px` }}
        on:click={(e) => clickArtboard(a(), e)}
        on:keydown={onRowKey((e) => clickArtboard(a(), e))}
        on:contextmenu={open(() => artboardItems(a()))}
      >
        <button
          type="button"
          aria-label={isOpen(a().id) ? "Collapse layers" : "Expand layers"}
          class="flex size-6 shrink-0 items-center justify-center text-muted-foreground hover:text-foreground"
          on:click={only(() => toggleArtboard(a().id))}
        >
          <svg
            viewBox="0 0 24 24"
            class={cn("size-3 transition-transform", isOpen(a().id) ? "rotate-90" : "")}
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
          >
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
        <span
          class={cn(
            "grid size-3.5 shrink-0 place-items-center text-[13px] font-semibold leading-none",
            isSel(a().id) ? "text-foreground" : "text-muted-foreground",
          )}
        >
          #
        </span>
        <Show
          when={editingId() === a().id}
          fallback={
            <span
              class={cn(
                "truncate",
                isSel(a().id)
                  ? "font-medium text-foreground"
                  : a().hidden
                    ? "italic text-muted-foreground"
                    : "text-foreground/90",
              )}
              on:dblclick={only(() => startRename(a().id, a().name))}
            >
              {a().name}
            </span>
          }
        >
          {renameField("artboard-rename", () => commitArtboardName(a()))}
        </Show>
        <span class="ml-auto flex items-center gap-0.5">
          <button
            type="button"
            aria-label={a().locked ? "Unlock artboard" : "Lock artboard"}
            aria-pressed={a().locked}
            class={cn(
              "flex size-6 items-center justify-center rounded hover:bg-background",
              a().locked ? "text-foreground" : ["text-muted-foreground", QUIET],
            )}
            on:click={only(() => setArtboardLocked(a().id, !a().locked))}
          >
            <LockGlyph locked={a().locked} />
          </button>
          <button
            type="button"
            aria-label={a().hidden ? "Show artboard" : "Hide artboard"}
            aria-pressed={a().hidden}
            class={cn(
              "flex size-6 items-center justify-center rounded hover:bg-background",
              a().hidden ? "text-muted-foreground" : ["text-muted-foreground", QUIET],
            )}
            on:click={only(() => setArtboardHidden(a().id, !a().hidden))}
          >
            <EyeGlyph shown={!a().hidden} />
          </button>
        </span>
        <Show when={editingId() !== a().id}>
          <span class="shrink-0 text-[11px] capitalize text-muted-foreground">
            {a().widget?.kind ?? a().chart.type}
          </span>
        </Show>
      </div>
    )
  }

  /* LAYER */
  const layerRow = (node: () => LayerNode) => {
    const a = () => node().a
    const l = () => node().layer
    const visible = () => layerVisible(a(), l())
    const locked = () => layerLocked(a(), l())
    return (
      <div
        role="option"
        tabindex="0"
        aria-selected={editor.selectedLayerId === l().id}
        aria-label={l().label}
        class={cn(
          "group/row flex h-7 items-center gap-2 rounded pr-1.5 transition-colors",
          editor.selectedLayerId === l().id ? "ring-on" : "text-muted-foreground hover:bg-card",
        )}
        style={{ "padding-left": `${4 + node().depth * 16}px` }}
        on:click={() => selectLayer(l().id)}
        on:keydown={onRowKey(() => selectLayer(l().id))}
        on:contextmenu={open(() => layerItems(a(), l()))}
      >
        <span class={cn("truncate text-[12px]", !visible() && togglable(l()) ? "italic" : "")}>{l().label}</span>
        <Show when={l().kind === "series" && seriesOf(a(), l())}>
          {(s) => (
            <span
              class={cn("ml-auto size-2.5 shrink-0 rounded-[2px]", !visible() ? "opacity-45" : "")}
              style={{ "background-color": cssColor(s().color) }}
            />
          )}
        </Show>
        <Show when={togglable(l())}>
          <span class={cn("flex items-center gap-0.5", l().kind === "series" ? "" : "ml-auto")}>
            <button
              type="button"
              aria-label={locked() ? "Unlock layer" : "Lock layer"}
              aria-pressed={locked()}
              class={cn(
                "flex size-6 items-center justify-center rounded hover:bg-black/10",
                locked() ? "opacity-90" : QUIET,
              )}
              on:click={only(() => toggleLayerLock(a(), l()))}
            >
              <LockGlyph locked={locked()} />
            </button>
            <button
              type="button"
              aria-label={visible() ? "Hide layer" : "Show layer"}
              aria-pressed={!visible()}
              class={cn(
                "flex size-6 items-center justify-center rounded hover:bg-black/10",
                !visible() ? "opacity-90" : QUIET,
              )}
              on:click={only(() => toggleLayerVis(a(), l()))}
            >
              <EyeGlyph shown={visible()} />
            </button>
          </span>
        </Show>
      </div>
    )
  }

  return (
    <div
      ref={(el) => (rootEl = el)}
      role="listbox"
      aria-label="Layers"
      class="flex flex-col gap-px text-[13px] select-none [-webkit-touch-callout:none]"
      on:keydown={onRowsKey}
    >
      <For each={keys()}>
        {(key) => {
          // A key names one kind of row for as long as it is listed.
          let last = byKey().get(key)!
          const node = <T extends Node>() => (last = byKey().get(key) ?? last) as T
          if (last.t === "snode") return screenRow(node)
          if (last.t === "group") return groupRow(node)
          if (last.t === "artboard") return artboardRow(node)
          return layerRow(node)
        }}
      </For>

      <Show when={menu()}>
        {(m) => <ContextMenu x={m().x} y={m().y} items={m().items} onClose={() => setMenu(null)} />}
      </Show>
    </div>
  )
}
