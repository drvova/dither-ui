// An element that enters and leaves through CSS, by the class names Vue's
// `<Transition name>` used, so a component's transition stylesheet carries
// over unchanged: `<name>-enter-from` / `-enter-active` / `-enter-to` as it
// arrives, `<name>-leave-from` / `-leave-active` / `-leave-to` as it goes,
// and it stays in the page until the leave has run. Where the stylesheet
// gives it no duration (reduced motion included), it comes and goes at once.

import { children, createEffect, createSignal, type JSX, on, onCleanup, Show } from "solid-js"

export type PresenceProps = {
  when: boolean
  /** The transition's name: the prefix of its six classes. */
  name: string
  children: JSX.Element
}

/** The longest transition or animation the element's styles give it, ms. */
function runTime(el: Element): number {
  const s = getComputedStyle(el)
  const ms = (list: string) => list.split(",").map((t) => (parseFloat(t) || 0) * (t.trim().endsWith("ms") ? 1 : 1000))
  const longest = (durations: string, delays: string) => {
    const d = ms(durations)
    const w = ms(delays)
    return Math.max(0, ...d.map((x, i) => x + (w[i % w.length] ?? 0)))
  }
  return Math.max(
    longest(s.transitionDuration, s.transitionDelay),
    longest(s.animationDuration, s.animationDelay),
  )
}

export function Presence(props: PresenceProps) {
  // In the page while shown and while leaving. Starts as `when`, so a
  // server render and the first client render agree.
  const [mounted, setMounted] = createSignal(props.when)
  let el: Element | undefined
  let timer: ReturnType<typeof setTimeout> | undefined
  let frame = 0
  const clear = () => {
    clearTimeout(timer)
    if (frame) cancelAnimationFrame(frame)
    frame = 0
  }
  /** Run one phase's three classes on the element, then `done`. */
  function run(phase: "enter" | "leave", done: () => void) {
    clear()
    const node = el
    const base = `${props.name}-${phase}`
    if (!node) return done()
    const other = `${props.name}-${phase === "enter" ? "leave" : "enter"}`
    node.classList.remove(`${other}-from`, `${other}-active`, `${other}-to`)
    node.classList.add(`${base}-from`, `${base}-active`)
    frame = requestAnimationFrame(() => {
      frame = 0
      node.classList.remove(`${base}-from`)
      node.classList.add(`${base}-to`)
      const finish = () => {
        node.classList.remove(`${base}-active`, `${base}-to`)
        done()
      }
      const time = runTime(node)
      if (time <= 0) finish()
      else timer = setTimeout(finish, time + 20)
    })
  }
  createEffect(
    on(
      () => props.when,
      (when) => {
        if (when) {
          setMounted(true)
          queueMicrotask(() => run("enter", () => {}))
        } else if (mounted()) run("leave", () => setMounted(false))
      },
      { defer: true },
    ),
  )
  onCleanup(clear)
  return (
    <Show when={mounted()}>
      {(() => {
        const resolved = children(() => props.children)
        createEffect(() => {
          const first = resolved.toArray().find((n) => n instanceof Element)
          el = first as Element | undefined
        })
        return resolved()
      })()}
    </Show>
  )
}
