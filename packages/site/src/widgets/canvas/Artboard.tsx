import { cn } from "@dither-ui/kit/tailwind/lib.ts"
import { createMemo, createSignal, For, onCleanup, onMount, Show } from "solid-js"
import type { Artboard as ArtboardModel } from "@/entities/artboard"
import { editor, placeFrames, selectArtboard, setFrameBox, setGuides } from "@/entities/editor"
import { handoff, togglePicked } from "@/features/agent/handoff"
import { startDrag } from "@/features/artboard-transform"
import { FrameRenderer } from "@/widgets/frame-renderer"
import "./Artboard.css"

// 8-direction resize with shift-to-constrain (corner handles keep the aspect
// ratio). Widget frames allow smaller minimums than chart frames.
type ResizeDir = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw"
const HANDLES: { dir: ResizeDir; class: string }[] = [
  { dir: "nw", class: "-left-1.5 -top-1.5 cursor-nwse-resize" },
  { dir: "n", class: "-top-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize" },
  { dir: "ne", class: "-right-1.5 -top-1.5 cursor-nesw-resize" },
  { dir: "e", class: "-right-1.5 top-1/2 -translate-y-1/2 cursor-ew-resize" },
  { dir: "se", class: "-bottom-1.5 -right-1.5 cursor-nwse-resize" },
  { dir: "s", class: "-bottom-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize" },
  { dir: "sw", class: "-bottom-1.5 -left-1.5 cursor-nesw-resize" },
  { dir: "w", class: "-left-1.5 top-1/2 -translate-y-1/2 cursor-ew-resize" },
]

const additive = (e: PointerEvent) => e.metaKey || e.ctrlKey || e.shiftKey
const interactive = (target: EventTarget | null) =>
  target instanceof Element &&
  !!target.closest(
    "button, a, input, textarea, select, [contenteditable], [role='button'], [role='link'], [data-canvas-interactive]",
  )

export default function Artboard(props: { artboard: ArtboardModel }) {
  let root: HTMLDivElement | undefined
  const selected = createMemo(() => editor.selectedIds.includes(props.artboard.id))
  /** Handed to the agent for its next message (`features/agent/handoff`). */
  const picked = createMemo(() => handoff.picked.includes(props.artboard.id))
  /* While the agent's pick key is on, a press on the frame hands it over (or
   * takes it back) and nothing inside the frame sees the press or its click:
   * no select, no drag, no control. */
  function onPickDown(e: PointerEvent) {
    if (!handoff.picking || e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    togglePicked(props.artboard.id)
  }
  function onPickClick(e: MouseEvent) {
    if (!handoff.picking) return
    e.preventDefault()
    e.stopPropagation()
  }
  // Live position/size readout while dragging or resizing.
  const [interacting, setInteracting] = createSignal(false)
  let stopDrag: (() => void) | undefined
  onCleanup(() => stopDrag?.())
  // The pick is heard on the way down, before anything inside the frame.
  onMount(() => {
    root?.addEventListener("pointerdown", onPickDown, true)
    root?.addEventListener("click", onPickClick, true)
  })

  function onSurfaceDown(e: PointerEvent & { currentTarget: HTMLElement }) {
    // A press in an overlay a control opened elsewhere in the page is not on the frame.
    if (!e.currentTarget.contains(e.target as Node)) return
    e.stopPropagation()
    if (e.button !== 0) return
    if (additive(e)) return selectArtboard(props.artboard.id, true)
    if (!selected()) selectArtboard(props.artboard.id)
    if (
      e.target instanceof Element &&
      e.target.closest("[data-artboard-surface]") === e.target &&
      !interactive(e.target)
    )
      onMoveDown(e)
  }
  /** Drag with edge/center snapping against the other artboards. Moves the
   * whole selection; guides render in the canvas while a snap is active. */
  function onMoveDown(e: PointerEvent) {
    if (e.button !== 0) return
    if (!selected()) selectArtboard(props.artboard.id, additive(e))
    if (props.artboard.locked) return
    const moving = editor.artboards.filter((a) => editor.selectedIds.includes(a.id) && !a.locked)
    const others = editor.artboards.filter((a) => !editor.selectedIds.includes(a.id) && !a.hidden)
    const starts = new Map(moving.map((a) => [a.id, { x: a.x, y: a.y }]))
    const meStart = { x: props.artboard.x, y: props.artboard.y }
    const { w, h } = props.artboard
    let accX = 0
    let accY = 0
    setInteracting(true)
    stopDrag?.()
    stopDrag = startDrag(
      e,
      (dx, dy) => {
        accX += dx
        accY += dy
        const threshold = 6 / (editor.viewport.zoom || 1)
        const rawX = meStart.x + accX
        const rawY = meStart.y + accY
        let sx = 0
        let sy = 0
        let gv: number | null = null
        let gh: number | null = null
        let bestX = threshold
        let bestY = threshold
        for (const o of others) {
          for (const ox of [o.x, o.x + o.w / 2, o.x + o.w]) {
            for (const mx of [rawX, rawX + w / 2, rawX + w]) {
              const d = ox - mx
              if (Math.abs(d) < bestX) {
                bestX = Math.abs(d)
                sx = d
                gv = ox
              }
            }
          }
          for (const oy of [o.y, o.y + o.h / 2, o.y + o.h]) {
            for (const my of [rawY, rawY + h / 2, rawY + h]) {
              const d = oy - my
              if (Math.abs(d) < bestY) {
                bestY = Math.abs(d)
                sy = d
                gh = oy
              }
            }
          }
        }
        placeFrames(new Map([...starts].map(([id, s]) => [id, { x: s.x + accX + sx, y: s.y + accY + sy }])))
        setGuides(gv, gh)
      },
      () => {
        setGuides(null, null)
        setInteracting(false)
        stopDrag = undefined
      },
    )
  }

  function onResizeDown(dir: ResizeDir, e: PointerEvent) {
    e.stopPropagation()
    if (!selected()) selectArtboard(props.artboard.id)
    const a = props.artboard
    if (a.locked) return
    const start = { x: a.x, y: a.y, w: a.w, h: a.h }
    const ratio = start.w / start.h
    const minW = a.widget ? 100 : 260
    const minH = a.widget ? 60 : 200
    let ax = 0
    let ay = 0
    setInteracting(true)
    stopDrag?.()
    stopDrag = startDrag(
      e,
      (dx, dy, ev) => {
        ax += dx
        ay += dy
        let w = start.w
        let h = start.h
        if (dir.includes("e")) w = start.w + ax
        if (dir.includes("w")) w = start.w - ax
        if (dir.includes("s")) h = start.h + ay
        if (dir.includes("n")) h = start.h - ay
        // Shift on a corner: constrain to the starting aspect ratio, following
        // whichever axis moved further.
        if (ev.shiftKey && dir.length === 2) {
          if (Math.abs(ax) * start.h > Math.abs(ay) * start.w) h = w / ratio
          else w = h * ratio
        }
        w = Math.max(minW, Math.round(w))
        h = Math.max(minH, Math.round(h))
        // Anchor the opposite edge: n/w drags move the origin by the size change.
        setFrameBox(a.id, {
          x: dir.includes("w") ? start.x + (start.w - w) : start.x,
          y: dir.includes("n") ? start.y + (start.h - h) : start.y,
          w,
          h,
        })
      },
      () => {
        setInteracting(false)
        stopDrag = undefined
      },
    )
  }

  return (
    <div
      ref={(el) => (root = el)}
      class="artboard-scope absolute"
      data-artboard-id={props.artboard.id}
      style={{
        left: `${props.artboard.x}px`,
        top: `${props.artboard.y}px`,
        width: `${props.artboard.w}px`,
        height: `${props.artboard.h}px`,
      }}
      onPointerDown={onSurfaceDown}
    >
      <div
        class={cn(
          "absolute -top-6 left-0 z-20 flex max-w-full select-none items-center gap-1.5 truncate text-[11px]",
          selected() ? "text-foreground" : "text-muted-foreground",
          props.artboard.locked ? "cursor-default" : "cursor-move",
        )}
        onPointerDown={(e) => {
          e.stopPropagation()
          onMoveDown(e)
        }}
      >
        <Show when={props.artboard.locked}>
          <svg viewBox="0 0 24 24" class="size-3 shrink-0" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
        </Show>
        <span class="truncate">{props.artboard.name}</span>
        <span class="flex gap-2 tabular-nums text-muted-foreground">
          <Show when={interacting()}>
            <span>
              {Math.round(props.artboard.x)}, {Math.round(props.artboard.y)}
            </span>
          </Show>
          <span>
            {props.artboard.w}×{props.artboard.h}
          </span>
        </span>
      </div>

      <div
        data-artboard-surface
        class={cn(
          "h-full w-full rounded-lg bg-card/60 p-3 font-sans",
          selected() ? "ring-2 ring-accent" : "border border-border",
        )}
      >
        <FrameRenderer artboard={props.artboard} canvas />
      </div>

      <Show when={picked()}>
        <div class="picked" aria-hidden="true" />
      </Show>

      <Show when={selected() && !props.artboard.locked && !handoff.picking}>
        <For each={HANDLES}>
          {(hd) => (
            <div
              data-handle={hd.dir}
              class={cn("handle absolute z-10 size-3 rounded-[2px] border border-accent bg-background", hd.class)}
              onPointerDown={(e) => onResizeDown(hd.dir, e)}
            />
          )}
        </For>
      </Show>
    </div>
  )
}
