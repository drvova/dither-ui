// Generated from ../solid/LogoLoop.tsx by src/shared/lib/stylex-layer-solid.ts: edit that
// file, then npx rs test -u tests/stylex-layer-solid.spec.ts
import { createMemo, Index, mergeProps } from "solid-js"
import { cn, type StyleProp } from "./lib"
import "../solid/LogoLoop.css"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  row: { display: "flex", width: "max-content" },
  text: { flexShrink: "0", whiteSpace: "nowrap" },
  box: { overflow: "hidden" },
})

export type LogoLoopProps = {
  items?: string[]
  speed?: number
  gap?: number
  class?: string
  xstyle?: StyleProp
}

export default function LogoLoop(raw: LogoLoopProps) {
  const props = mergeProps({ items: ["DITHER", "BAYER", "CANVAS", "VUE", "PIXELS"], speed: 18, gap: 48 }, raw)

  // Duplicated once so translateX(-50%) wraps seamlessly.
  const loop = createMemo(() => [...props.items, ...props.items])

  return (
    <div class={cn(styles.box, props.xstyle, props.class)} aria-hidden="true">
      <div class={cn(styles.row, "dither-logoloop")} style={{ "animation-duration": `${props.speed}s` }}>
        <Index each={loop()}>
          {(it) => (
            <span {...stylex.props(styles.text)} style={{ "padding-right": `${props.gap}px` }}>
              {it()}
            </span>
          )}
        </Index>
      </div>
    </div>
  )
}
