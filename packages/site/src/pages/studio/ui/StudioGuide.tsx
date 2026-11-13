// The Studio's tour (`@/pages/studio/guide`): the mascot flies, rotor
// turning, to each part of the window, lands, and says what it is for in a
// bubble beside it.
// Next flies on; Skip, Done or Escape ends it and gives the focus back.
// Under reduced motion it moves straight there, its rotor still.
import { createEffect, createMemo, createSignal, on, onCleanup, Show } from "solid-js"
import { type GuideStop, placeGuide } from "@/pages/studio/guide"
import Mascot from "@/shared/ui/Mascot"
import "./StudioGuide.css"

export type StudioGuideProps = { open: boolean; stops: GuideStop[]; onClose?: () => void }

export default function StudioGuide(props: StudioGuideProps) {
  const [at, setAt] = createSignal(0)
  const [pos, setPos] = createSignal({ x: 0, y: 0 })
  // Not placed yet: the first spot is taken without a flight.
  const [placed, setPlaced] = createSignal(false)
  const [flying, setFlying] = createSignal(false)
  let box: HTMLDivElement | undefined
  let nextKey: HTMLButtonElement | undefined
  const stop = createMemo(() => props.stops[at()])
  const last = createMemo(() => at() === props.stops.length - 1)
  const still = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false

  let landing: ReturnType<typeof setTimeout> | undefined
  async function place(fly: boolean) {
    const s = stop()
    await Promise.resolve()
    const el = box
    if (!s || !el?.isConnected) return
    const view = { width: window.innerWidth, height: window.innerHeight }
    const size = { width: el.offsetWidth, height: el.offsetHeight }
    const part = s.target()?.getBoundingClientRect()
    const to = part
      ? placeGuide(part, size, view, s.end)
      : { x: Math.round((view.width - size.width) / 2), y: Math.round(view.height / 3) }
    setFlying(fly && placed() && !still() && (to.x !== pos().x || to.y !== pos().y))
    setPos(to)
    // It lands when the flight's transition ends, or after it at the latest.
    clearTimeout(landing)
    if (flying()) landing = setTimeout(() => setFlying(false), 700)
  }

  async function go(i: number) {
    setAt(i)
    props.stops[i]?.show?.()
    await place(true)
    setPlaced(true)
    nextKey?.focus({ preventScroll: true })
  }

  let before: HTMLElement | null = null
  function close() {
    props.onClose?.()
  }
  function onKey(e: KeyboardEvent) {
    if (e.key !== "Escape") return
    e.preventDefault()
    close()
  }
  const onResize = () => void place(false)
  createEffect(
    on(
      () => props.open,
      (open) => {
        if (open) {
          before = document.activeElement instanceof HTMLElement ? document.activeElement : null
          setPlaced(false)
          void go(0)
          window.addEventListener("keydown", onKey)
          window.addEventListener("resize", onResize)
        } else {
          window.removeEventListener("keydown", onKey)
          window.removeEventListener("resize", onResize)
          setFlying(false)
          before?.focus({ preventScroll: true })
          before = null
        }
      },
    ),
  )
  onCleanup(() => {
    clearTimeout(landing)
    if (typeof window === "undefined") return
    window.removeEventListener("keydown", onKey)
    window.removeEventListener("resize", onResize)
  })

  return (
    <Show when={props.open && stop()}>
      {(s) => (
        <div
          ref={(el) => (box = el)}
          class="studio-guide-scope guide"
          classList={{ "is-placed": placed(), "is-end": s().end }}
          style={{ transform: `translate(${pos().x}px, ${pos().y}px)` }}
          role="dialog"
          aria-label="Studio tour"
          onTransitionEnd={(e) => e.target === e.currentTarget && setFlying(false)}
        >
          <Mascot size={40} pose={flying() ? "fly" : "idle"} alive={!flying()} class="guide-mascot" />
          <div class="bubble">
            <p class="line" aria-live="polite">
              {s().line}
            </p>
            <div class="keys">
              <span class="count">
                {at() + 1} of {props.stops.length}
              </span>
              <Show when={!last()}>
                <button type="button" class="skip" onClick={close}>
                  Skip
                </button>
              </Show>
              <button
                ref={(el) => (nextKey = el)}
                type="button"
                class="key-chrome next"
                onClick={() => (last() ? close() : void go(at() + 1))}
              >
                {last() ? "Done" : "Next"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Show>
  )
}
