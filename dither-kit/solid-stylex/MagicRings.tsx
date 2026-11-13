// Generated from ../solid/MagicRings.tsx by src/shared/lib/stylex-layer-solid.ts: edit that
// file, then npx rs test -u tests/stylex-layer-solid.spec.ts
import { createMemo, For, type JSX, mergeProps } from "solid-js"
import { cn, type StyleProp } from "./lib"
import "../solid/MagicRings.css"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  layer: { pointerEvents: "none", position: "absolute", borderRadius: "calc(infinity * 1px)" },
  grid: { position: "relative", display: "grid", placeItems: "center", overflow: "hidden" },
})

export type MagicRingsProps = {
  color?: string
  count?: number
  duration?: number
  class?: string
  xstyle?: StyleProp
  children?: JSX.Element
}

export default function MagicRings(raw: MagicRingsProps) {
  const props = mergeProps({ color: "#7CFF67", count: 4, duration: 3 }, raw)

  const rings = createMemo(() => Math.max(1, Math.round(props.count)))

  return (
    <div class={cn(styles.grid, props.xstyle, props.class)}>
      {props.children}
      <For each={Array.from({ length: rings() }, (_, n) => n + 1)}>
        {(i) => (
          <span
            class={cn(styles.layer, "dither-ring")}
            style={{
              "border-color": props.color,
              "animation-duration": `${props.duration}s`,
              "animation-delay": `${-((i - 1) * props.duration) / rings()}s`,
            }}
            aria-hidden="true"
          />
        )}
      </For>
    </div>
  )
}
