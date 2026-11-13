// Generated from @dither-ui/kit/solid/TextType.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createSignal, mergeProps, onCleanup, onMount, Show } from "solid-js"
import { pixelPrefersReducedMotion } from "@dither-ui/kit/engine/pixel.ts"
import { cn, type StyleProp } from "./lib"
import "@dither-ui/kit/solid/TextType.css"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  text: { display: "inline-block", whiteSpace: "pre" },
})

export type TextTypeProps = {
  texts?: string[]
  typingSpeed?: number
  deletingSpeed?: number
  pause?: number
  loop?: boolean
  cursor?: boolean
  class?: string
  xstyle?: StyleProp
}

export default function TextType(raw: TextTypeProps) {
  const props = mergeProps(
    {
      texts: ["Type this out.", "Then this."],
      typingSpeed: 60,
      deletingSpeed: 35,
      pause: 1400,
      loop: true,
      cursor: true,
    },
    raw,
  )

  const [shown, setShown] = createSignal("")
  let ti = 0
  let timer = 0

  function schedule(fn: () => void, ms: number) {
    timer = window.setTimeout(fn, Math.max(0, ms))
  }
  function list() {
    return props.texts.length ? props.texts : [""]
  }
  function type() {
    const full = list()[ti % list().length]
    if (shown().length < full.length) {
      setShown(full.slice(0, shown().length + 1))
      schedule(type, props.typingSpeed)
    } else if (props.loop || ti < list().length - 1) {
      schedule(del, props.pause)
    }
  }
  function del() {
    if (shown().length > 0) {
      setShown(shown().slice(0, -1))
      schedule(del, props.deletingSpeed)
    } else {
      ti++
      schedule(type, 220)
    }
  }

  onMount(() => {
    if (pixelPrefersReducedMotion()) {
      setShown(list()[0])
      return
    }
    schedule(type, 300)
  })
  onCleanup(() => clearTimeout(timer))

  return (
    <span class={cn(styles.text, props.xstyle, props.class)}>
      <span>{shown()}</span>
      <Show when={props.cursor}>
        <span class="dither-caret" aria-hidden="true">
          |
        </span>
      </Show>
    </span>
  )
}
