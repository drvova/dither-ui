import { createEffect, createMemo, createSignal, mergeProps, on, onCleanup, untrack } from "solid-js"
import { isDirected } from "../engine/clock"
import { cn } from "../tailwind/lib"
import { createKitTime } from "./runtime/kit-time"
import { Presence } from "./runtime/presence"
import "./RotatingText.css"

export type RotatingTextProps = {
  /** @default ['Solid', 'canvas', 'dither'] */
  texts?: string[]
  /** @docs number (ms) */
  interval?: number
  /** @default undefined */
  class?: string
}

export default function RotatingText(raw: RotatingTextProps) {
  const props = mergeProps({ texts: ["Solid", "canvas", "dither"], interval: 2000 }, raw)

  let host: HTMLSpanElement | undefined
  const list = createMemo(() => (props.texts.length ? props.texts : [""]))
  // The word of the moment: the next one every `interval` of the kit
  // clock. Its crossfade stays calm under reduced motion, so the words
  // turn there too.
  const { time } = createKitTime(() => host, "run")
  const idx = createMemo(() =>
    list().length < 2 ? 0 : Math.floor(time() / Math.max(300, props.interval)) % list().length,
  )

  // Out, then in: the word on show leaves, and only once it is gone does
  // the next one (whichever `idx` names by then) arrive. Directed, the
  // moment's word stands at once.
  const [shown, setShown] = createSignal(untrack(idx))
  const [present, setPresent] = createSignal(true)
  let gone = false
  const Word = () => {
    onCleanup(() =>
      queueMicrotask(() => {
        if (gone) return
        setShown(idx())
        setPresent(true)
      }),
    )
    return <span class="inline-block">{list()[shown()]}</span>
  }

  createEffect(
    on(
      idx,
      (i) => {
        if (!isDirected()) return setPresent(false)
        setShown(i)
        setPresent(true)
      },
      { defer: true },
    ),
  )
  onCleanup(() => (gone = true))

  return (
    <span ref={(el) => (host = el)} class={cn("dither-rotating", props.class)}>
      <Presence when={present()} name="dither-rot">
        <Word />
      </Presence>
    </span>
  )
}
