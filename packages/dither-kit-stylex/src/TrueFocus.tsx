// Generated from dither-kit/solid/TrueFocus.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createMemo, createSignal, For, mergeProps, onCleanup, onMount } from "solid-js"
import { pixelPrefersReducedMotion } from "dither-kit/engine/pixel.ts"
import { cn, type StyleProp } from "./lib"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  text: {
    display: "inline-block",
    transitionProperty: "filter, opacity",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "500ms",
  },
  row: { display: "inline-flex", flexWrap: "wrap", columnGap: "0.35em", rowGap: "0.25rem" },
})

export type TrueFocusProps = {
  text?: string
  interval?: number
  blur?: number
  class?: string
  xstyle?: StyleProp
}

export default function TrueFocus(raw: TrueFocusProps) {
  const props = mergeProps({ text: "True focus mode", interval: 1400, blur: 5 }, raw)

  const words = createMemo(() => props.text.split(/\s+/).filter(Boolean))
  const [active, setActive] = createSignal(0)
  let timer = 0

  onMount(() => {
    if (pixelPrefersReducedMotion() || words().length < 2) return
    timer = window.setInterval(
      () => {
        setActive((active() + 1) % words().length)
      },
      Math.max(300, props.interval),
    )
  })
  onCleanup(() => clearInterval(timer))

  return (
    <span class={cn(styles.row, props.xstyle, props.class)} aria-label={props.text}>
      <For each={words()}>
        {(w, i) => (
          <span
            aria-hidden="true"
            class={cn(styles.text, "dither-focus-word")}
            style={{
              filter: i() === active() ? "blur(0)" : `blur(${props.blur}px)`,
              opacity: i() === active() ? 1 : 0.5,
            }}
          >
            {w}
          </span>
        )}
      </For>
    </span>
  )
}
