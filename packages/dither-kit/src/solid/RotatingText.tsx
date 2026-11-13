import { createEffect, createMemo, createSignal, mergeProps, on, onCleanup, onMount } from "solid-js"
import { cn } from "../tailwind/lib"
import { Presence } from "./runtime/presence"
import "./RotatingText.css"

export type RotatingTextProps = {
  texts?: string[]
  interval?: number
  class?: string
}

export default function RotatingText(raw: RotatingTextProps) {
  const props = mergeProps({ texts: ["Solid", "canvas", "dither"], interval: 2000 }, raw)

  const list = createMemo(() => (props.texts.length ? props.texts : [""]))
  const [idx, setIdx] = createSignal(0)
  let timer = 0

  function start() {
    clearInterval(timer)
    if (list().length < 2) return
    timer = window.setInterval(
      () => {
        setIdx((idx() + 1) % list().length)
      },
      Math.max(300, props.interval),
    )
  }

  // Out, then in: the word on show leaves, and only once it is gone does
  // the next one (whichever `idx` names by then) arrive.
  const [shown, setShown] = createSignal(0)
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

  onMount(() => {
    start()
    createEffect(
      on(
        [() => props.texts, () => props.interval],
        () => {
          setIdx(0)
          start()
        },
        { defer: true },
      ),
    )
    createEffect(on(idx, () => setPresent(false), { defer: true }))
    onCleanup(() => clearInterval(timer))
  })
  onCleanup(() => (gone = true))

  return (
    <span class={cn("dither-rotating", props.class)}>
      <Presence when={present()} name="dither-rot">
        <Word />
      </Presence>
    </span>
  )
}
