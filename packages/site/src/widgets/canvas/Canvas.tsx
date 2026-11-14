import { DitherIcon } from "@dither-ui/kit"
import { cn } from "@dither-ui/kit/tailwind/lib.ts"
import { createMemo, createSignal, For, onCleanup, onMount, Show } from "solid-js"
import { addArtboard, deselect, editor, selectMany } from "@/entities/editor"
import { handoff } from "@/features/agent"
import { useShortcuts } from "@/features/keyboard"
import { usePanZoom } from "@/features/pan-zoom"
import { followPointer } from "@/shared/lib/follow"
import { isTyping } from "@/shared/lib/keys"
import Artboard from "./Artboard"
import SelectionAsk from "./SelectionAsk"
import "./Canvas.css"

/** What the canvas hands the page that holds it: its element, and the layer
 * the frames stand in (what the workbench inspects). */
export type CanvasApi = { host: HTMLElement; world: HTMLElement }

export default function Canvas(props: { ref?: (api: CanvasApi) => void }) {
  let host: HTMLDivElement | undefined
  // The layer the frames stand in (what the workbench inspects).
  let world: HTMLDivElement | undefined
  const { onWheel, startPan, onTouchDown } = usePanZoom(() => host)
  useShortcuts()
  const visible = createMemo(() => editor.artboards.filter((a) => !a.hidden))

  // Space-to-pan (Figma convention): plain drag on empty canvas = marquee.
  const [spaceHeld, setSpaceHeld] = createSignal(false)
  function onKeyDown(e: KeyboardEvent) {
    if (e.key === " " && !isTyping(e.target)) setSpaceHeld(true)
    // Picking for the agent ends on Esc (the agent panel ends it from its own field).
    if (e.key === "Escape" && handoff.picking && !isTyping(e.target)) handoff.picking = false
  }

  /* A pointer down on the canvas (a drag, a resize, a marquee) puts the
   * selection's ask away until it is up again; a press on the ask itself
   * does not. */
  const [held, setHeld] = createSignal(false)
  function onDownCapture(e: PointerEvent) {
    onTouchDown(e)
    if (!(e.target instanceof Element && e.target.closest(".ask"))) setHeld(true)
  }
  const release = () => setHeld(false)
  let sized: ResizeObserver | undefined
  function onKeyUp(e: KeyboardEvent) {
    if (e.key === " ") setSpaceHeld(false)
  }
  onMount(() => {
    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("keyup", onKeyUp)
    window.addEventListener("pointerup", release)
    window.addEventListener("pointercancel", release)
    // Heard on the way down, before any frame's own press.
    host?.addEventListener("pointerdown", onDownCapture, true)
    // Safari's own pinch gesture is not the page's to zoom.
    host?.addEventListener("gesturestart", (e) => e.preventDefault())
    // Measured as the canvas mounts, then kept as it resizes.
    const rect = host?.getBoundingClientRect()
    if (rect?.width) editor.stage = { w: rect.width, h: rect.height }
    if (host && typeof ResizeObserver !== "undefined") {
      sized = new ResizeObserver(([e]) => (editor.stage = { w: e.contentRect.width, h: e.contentRect.height }))
      sized.observe(host)
    }
    onCleanup(() => {
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("keyup", onKeyUp)
      window.removeEventListener("pointerup", release)
      window.removeEventListener("pointercancel", release)
      sized?.disconnect()
    })
  })

  // Marquee selection on empty-canvas drag; a finger on empty canvas pans
  // instead (a touch screen has no Space or middle button).
  const [marquee, setMarquee] = createSignal<{ x1: number; y1: number; x2: number; y2: number } | null>(null)
  function onCanvasDown(e: PointerEvent) {
    if (e.target !== e.currentTarget) return
    if (e.button === 1 || spaceHeld() || e.pointerType === "touch") return startPan(e)
    if (e.button !== 0) return
    const rect = host?.getBoundingClientRect()
    if (!rect) return
    const sx = e.clientX - rect.left
    const sy = e.clientY - rect.top
    setMarquee({ x1: sx, y1: sy, x2: sx, y2: sy })
    const move = (ev: PointerEvent) => {
      const x2 = ev.clientX - rect.left
      const y2 = ev.clientY - rect.top
      setMarquee({ x1: sx, y1: sy, x2, y2 })
      const v = editor.viewport
      const wx1 = (Math.min(sx, x2) - v.x) / v.zoom
      const wy1 = (Math.min(sy, y2) - v.y) / v.zoom
      const wx2 = (Math.max(sx, x2) - v.x) / v.zoom
      const wy2 = (Math.max(sy, y2) - v.y) / v.zoom
      const hit = editor.artboards.filter(
        (a) => !a.hidden && !a.locked && a.x < wx2 && a.x + a.w > wx1 && a.y < wy2 && a.y + a.h > wy1,
      )
      selectMany(hit.map((a) => a.id))
    }
    followPointer(e, move, (ev, cancelled) => {
      // A plain click on empty canvas deselects.
      if (ev && !cancelled && Math.hypot(ev.clientX - rect.left - sx, ev.clientY - rect.top - sy) < 3) deselect()
      setMarquee(null)
    })
  }

  const view = (
    <div
      ref={(el) => (host = el)}
      class={cn(
        "canvas-scope dk-canvas relative h-full w-full touch-none overflow-hidden",
        spaceHeld() ? "cursor-grab" : "",
        handoff.picking ? "is-picking" : "",
      )}
      onWheel={onWheel}
      onPointerDown={onCanvasDown}
    >
      <div
        ref={(el) => (world = el)}
        class="absolute left-0 top-0 origin-top-left"
        style={{
          transform: `translate(${editor.viewport.x}px, ${editor.viewport.y}px) scale(${editor.viewport.zoom})`,
          // What a frame's chrome divides by to keep its reach on the screen.
          "--zoom": String(editor.viewport.zoom),
        }}
      >
        <For each={visible()}>{(a) => <Artboard artboard={a} />}</For>
      </div>

      {/* Snap guides (world coords -> screen) */}
      <Show when={editor.guides.v != null}>
        <div
          class="pointer-events-none absolute inset-y-0 w-px bg-accent/70"
          style={{ left: `${(editor.guides.v ?? 0) * editor.viewport.zoom + editor.viewport.x}px` }}
        />
      </Show>
      <Show when={editor.guides.h != null}>
        <div
          class="pointer-events-none absolute inset-x-0 h-px bg-accent/70"
          style={{ top: `${(editor.guides.h ?? 0) * editor.viewport.zoom + editor.viewport.y}px` }}
        />
      </Show>

      {/* Marquee */}
      <Show when={marquee()}>
        {(m) => (
          <div
            class="pointer-events-none absolute border border-accent/70 bg-accent/10"
            style={{
              left: `${Math.min(m().x1, m().x2)}px`,
              top: `${Math.min(m().y1, m().y2)}px`,
              width: `${Math.abs(m().x2 - m().x1)}px`,
              height: `${Math.abs(m().y2 - m().y1)}px`,
            }}
          />
        )}
      </Show>

      {/* Empty state */}
      <Show when={editor.artboards.length === 0}>
        <div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
          <p class="text-sm text-muted-foreground">No artboards yet.</p>
          <button
            type="button"
            class="key-chrome pointer-events-auto flex h-8 items-center gap-2 px-4 text-[12px] font-medium"
            onClick={() => addArtboard("area")}
          >
            <DitherIcon name="Plus" size={14} strokeWidth={1.5} />
            Add an artboard
          </button>
        </div>
      </Show>

      <SelectionAsk held={held()} />

      {/* Picking frames for the agent */}
      <Show when={handoff.picking}>
        <div class="pick-bar capsule" role="status">
          <DitherIcon name="Crosshair" size={13} strokeWidth={1.5} />
          <span>
            Click frames to hand them to the agent
            <Show when={handoff.picked.length}>, {handoff.picked.length} picked</Show>
          </span>
          <button type="button" class="pick-done" onClick={() => (handoff.picking = false)}>
            Done<kbd>esc</kbd>
          </button>
        </div>
      </Show>
    </div>
  )
  // Handed over before the page mounts.
  if (host && world) props.ref?.({ host, world })
  return view
}
