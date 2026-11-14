import { createMemo, createSignal, Index } from "solid-js"
import { DitherIcon, type IconName } from "@dither-ui/kit"
import { Presence } from "@dither-ui/kit/solid/runtime/presence.tsx"
import { cn } from "@dither-ui/kit/tailwind/lib.ts"
import { exportArtboardPng } from "@/features/export-image"
import {
  actualSize,
  addReelArtboard,
  duplicateSelected,
  editor,
  fitAll,
  groupSelected,
  removeSelected,
  replay,
  selectedArtboard,
  startInspecting,
  ungroup,
  zoomIn,
  zoomOut,
} from "@/entities/editor"
import { evolveSelected, handoff } from "@/features/agent"
import "@/widgets/toolbar/tool.css"
import "./CanvasBar.css"

export type CanvasBarProps = { onExport?: () => void; onVideo?: () => void }

/** A key of the bar, and the agent's action that does the same. */
type Key = {
  id: string
  agent: string
  icon: IconName
  name: string
  keys?: string
  run: () => void
  off?: boolean
  pressed?: boolean
  danger?: boolean
}
const titleOf = (k: Key) => (k.keys ? `${k.name} (${k.keys})` : k.name)

// The canvas's one bar, at its foot: the view (zoom and fit), what the
// selection is, what to do with it, and Inspect. Every key is always there,
// a glyph with its name, and one that does not apply to the selection is
// disabled, never removed, so the bar keeps its width whatever is picked.
// The words live in the titles and the names; a narrower canvas lets the
// label, then the zoom steps, step out. The agent has every action too
// (`features/agent`). It stands aside while the workbench inspects or
// frames are being picked for the agent (each brings its own bar).
export default function CanvasBar(props: CanvasBarProps) {
  const [pngBusy, setPngBusy] = createSignal(false)
  const none = createMemo(() => editor.selectedIds.length === 0)
  const grouped = createMemo(() => !!selectedArtboard.value?.groupId)
  // A reel cuts the selected frames (in selection order); reels are not clips.
  const canReel = createMemo(() =>
    editor.selectedIds.some((id) => editor.artboards.find((a) => a.id === id)?.widget?.kind !== "reel"),
  )
  const canData = createMemo(() => !!selectedArtboard.value && !selectedArtboard.value.widget)
  const label = createMemo(() =>
    editor.selectedIds.length > 1
      ? `${editor.selectedIds.length} selected`
      : (selectedArtboard.value?.name ?? "Nothing selected"),
  )

  async function savePng() {
    const a = selectedArtboard.value
    if (!a || pngBusy()) return
    setPngBusy(true)
    await exportArtboardPng(a, 2)
    setPngBusy(false)
  }
  function toggleGroup() {
    const a = selectedArtboard.value
    if (a?.groupId) ungroup(a.groupId)
    else groupSelected()
  }

  /** The bar's keys in groups (a hairline between), each group a row of keys. */
  const groups = createMemo<Key[][]>(() => [
    [
      {
        id: "duplicate",
        agent: "duplicate",
        icon: "Copy",
        name: "Duplicate",
        keys: "⌘D",
        run: duplicateSelected,
        off: none(),
      },
      {
        id: "group",
        agent: grouped() ? "ungroup" : "group",
        icon: "Group",
        name: grouped() ? "Ungroup" : "Group",
        keys: grouped() ? "⌘⇧G" : "⌘G",
        run: toggleGroup,
        off: none(),
      },
      {
        id: "delete",
        agent: "remove_artboard",
        icon: "Trash",
        name: "Delete",
        keys: "⌫",
        run: removeSelected,
        off: none(),
        danger: true,
      },
    ],
    [
      { id: "replay", agent: "replay", icon: "Refresh", name: "Replay the animations", run: replay },
      {
        id: "evolve",
        agent: "evolve",
        icon: "Dice",
        name: "Evolve: four seeded variants",
        run: () => evolveSelected(),
        off: none(),
      },
      {
        id: "reel",
        agent: "add_reel",
        icon: "Film",
        name: "Reel: play the selected frames in order",
        run: () => addReelArtboard(editor.selectedIds),
        off: !canReel(),
      },
      {
        id: "data",
        agent: "update_artboard",
        icon: "Table",
        name: "Edit the chart's data",
        run: () => (editor.dataOpen = !editor.dataOpen),
        off: !canData(),
        pressed: editor.dataOpen && canData(),
      },
    ],
    [
      {
        id: "code",
        agent: "get_code",
        icon: "Code",
        name: "Export the code",
        run: () => props.onExport?.(),
        off: none(),
      },
      {
        id: "png",
        agent: "export_png",
        icon: "Image",
        name: pngBusy() ? "Saving the PNG" : "Save as PNG",
        run: savePng,
        off: none() || pngBusy(),
      },
      {
        id: "video",
        agent: "export_video",
        icon: "Video",
        name: "Export as a video",
        run: () => props.onVideo?.(),
        off: none(),
      },
    ],
    [{ id: "inspect", agent: "inspect", icon: "Inspect", name: "Inspect, measure and annotate", run: startInspecting }],
  ])

  return (
    <Presence when={!editor.inspecting && !handoff.picking} name="canvas-bar">
      <div
        class="canvas-bar-scope canvas-bar capsule"
        // toggled by name: the transition's own classes stay as they are
        classList={{ "is-raised": editor.dataOpen }}
        role="toolbar"
        aria-label="Canvas"
      >
        <div class="zoom">
          <button
            type="button"
            class="tool step"
            data-agent="set_view"
            aria-label="Zoom out"
            title="Zoom out (⌘−)"
            onClick={() => zoomOut()}
          >
            <DitherIcon name="Minus" size={14} strokeWidth={1.5} />
          </button>
          <button
            type="button"
            class="tool pct"
            data-agent="set_view"
            aria-label="Zoom to 100%"
            title="Zoom to 100% (⌘0)"
            onClick={() => actualSize()}
          >
            {Math.round(editor.viewport.zoom * 100)}%
          </button>
          <button
            type="button"
            class="tool step"
            data-agent="set_view"
            aria-label="Zoom in"
            title="Zoom in (⌘+)"
            onClick={() => zoomIn()}
          >
            <DitherIcon name="Plus" size={14} strokeWidth={1.5} />
          </button>
          <button
            type="button"
            class="tool"
            data-agent="set_view"
            aria-label="Fit every frame"
            title="Fit every frame (⇧1)"
            onClick={() => fitAll()}
          >
            <DitherIcon name="Maximize" size={14} strokeWidth={1.5} />
          </button>
        </div>
        <span class="rule" />
        <span class={cn("what", none() && "is-none")} aria-live="polite">
          {label()}
        </span>
        {/* By place, not by key: the bar's shape never changes, so a key
            keeps its element (and the focus on it) as what it does turns. */}
        <Index each={groups()}>
          {(row, i) => (
            <>
              <span class={cn("rule", i === 0 && "what-rule")} />
              <Index each={row()}>
                {(k) => (
                  <button
                    type="button"
                    class={cn("tool", k().danger && "text-destructive")}
                    disabled={k().off}
                    aria-label={k().name}
                    aria-pressed={k().pressed}
                    title={titleOf(k())}
                    data-key={k().id}
                    data-agent={k().agent}
                    onClick={() => k().run()}
                  >
                    <DitherIcon name={k().icon} size={14} strokeWidth={1.5} />
                  </button>
                )}
              </Index>
            </>
          )}
        </Index>
      </div>
    </Presence>
  )
}
