import { createSignal, mergeProps, onMount, Show } from "solid-js"
import { project, rubberband, velocityFrom, type VelocitySample } from "../engine/gesture"
import { cssColor } from "../engine/palette"
import { pixelPrefersReducedMotion, type PixelColor } from "../engine/pixel"
import { CONTROL_BUTTON } from "../tailwind/control"
import { cn } from "../tailwind/lib"

export type SlideActionProps = {
  label?: string
  color?: PixelColor
  disabled?: boolean
  class?: string
  onConfirm?: () => void
}

/** Slide-to-confirm — drag the thumb to the end of the track (or flick it;
 * momentum projection counts) to fire, release early and it springs back.
 * Enter or Space confirms without the slide. */
export default function SlideAction(raw: SlideActionProps) {
  const props = mergeProps({ label: "Slide to confirm", color: "green" as PixelColor, disabled: false }, raw)

  let track: HTMLDivElement | undefined
  let thumb: HTMLButtonElement | undefined
  const [x, setX] = createSignal(0)
  const [travel, setTravel] = createSignal(1)
  const [dragging, setDragging] = createSignal(false)
  const [done, setDone] = createSignal(false)
  // Asked of the browser, so once mounted: a server render has none to ask.
  const [still, setStill] = createSignal(false)
  onMount(() => setStill(pixelPrefersReducedMotion()))
  let pid = -1
  let sx = 0
  let samples: VelocitySample[] = []

  function measure() {
    if (track && thumb) setTravel(Math.max(1, track.clientWidth - thumb.offsetWidth - 8))
  }
  function finish() {
    measure()
    setX(travel())
    setDone(true)
    props.onConfirm?.()
    setTimeout(() => {
      setDone(false)
      setX(0)
    }, 900)
  }
  function down(e: PointerEvent) {
    if (props.disabled || done()) return
    measure()
    setDragging(true)
    pid = e.pointerId
    sx = e.clientX - x()
    samples = [{ t: e.timeStamp, p: e.clientX }]
    thumb?.setPointerCapture(e.pointerId)
  }
  function move(e: PointerEvent) {
    if (!dragging() || e.pointerId !== pid) return
    const raw = e.clientX - sx
    setX(raw < 0 ? -rubberband(-raw, 48) : Math.min(raw, travel()))
    samples.push({ t: e.timeStamp, p: e.clientX })
    if (samples.length > 6) samples.shift()
  }
  function up(e: PointerEvent) {
    if (!dragging() || e.pointerId !== pid) return
    setDragging(false)
    if (x() >= travel() - 2 || x() + project(velocityFrom(samples)) >= travel()) finish()
    else setX(0)
  }
  /** Keyboard path: Enter or Space confirms without the slide. */
  function key(e: KeyboardEvent) {
    if (props.disabled || done()) return
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      finish()
    }
  }

  return (
    <div
      ref={(el) => (track = el)}
      class={cn(
        "relative flex h-10 w-64 touch-none items-center rounded-full border border-border/60 bg-card/60 px-1 select-none",
        props.class,
      )}
    >
      <span
        aria-hidden="true"
        class="pointer-events-none absolute inset-x-10 text-center font-mono text-[12px] text-muted-foreground"
        style={{ opacity: x() ? Math.max(0, 1 - x() / (travel() * 0.6)) : 1 }}
      >
        {props.label}
      </span>
      <button
        ref={(el) => (thumb = el)}
        type="button"
        disabled={props.disabled}
        aria-label={props.label}
        class={cn(
          "grid size-8 shrink-0 place-items-center rounded-full text-[14px] text-background",
          CONTROL_BUTTON,
          dragging() ? "cursor-grabbing" : "cursor-grab",
        )}
        style={{
          background: cssColor(props.color),
          transform: `translateX(${x()}px)`,
          transition: dragging() || still() ? "none" : "transform 300ms cubic-bezier(0.2, 1.4, 0.4, 1)",
        }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onKeyDown={key}
      >
        {done() ? "✓" : "→"}
      </button>
      <Show when={done()}>
        <span class="sr-only" role="status">
          confirmed
        </span>
      </Show>
    </div>
  )
}
