// Generated from @dither-ui/kit/solid/RotatingText.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createEffect, createMemo, createSignal, mergeProps, on, onCleanup, untrack } from "solid-js"
import { isDirected } from "@dither-ui/kit/engine/clock.ts"
import { cn, type StyleProp } from "./lib"
import { createKitTime } from "@dither-ui/kit/solid/runtime/kit-time.ts"
import { Presence } from "@dither-ui/kit/solid/runtime/presence.tsx"
import "@dither-ui/kit/solid/RotatingText.css"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  text: { display: "inline-block" },
})

export type RotatingTextProps = {
  texts?: string[]
  interval?: number
  class?: string
  xstyle?: StyleProp
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
    return <span {...stylex.props(styles.text)}>{list()[shown()]}</span>
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
    <span ref={(el) => (host = el)} class={cn("dither-rotating", props.xstyle, props.class)}>
      <Presence when={present()} name="dither-rot">
        <Word />
      </Presence>
    </span>
  )
}
