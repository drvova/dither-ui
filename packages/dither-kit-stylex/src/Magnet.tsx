// Generated from @dither-ui/kit/solid/Magnet.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { type JSX, mergeProps, onCleanup, onMount } from "solid-js"
import { pixelPrefersReducedMotion } from "@dither-ui/kit/engine/pixel.ts"
import { cn, type StyleProp } from "./lib"
import "@dither-ui/kit/solid/Magnet.css"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  box: { display: "inline-block" },
})

export type MagnetProps = {
  /** @docs number (0-1) */
  strength?: number
  /** @docs number (px) */
  radius?: number
  class?: string
  xstyle?: StyleProp
  /** @docs content */
  children?: JSX.Element
}

export default function Magnet(raw: MagnetProps) {
  const props = mergeProps({ strength: 0.4, radius: 200 }, raw)

  let el: HTMLDivElement | undefined
  let inner: HTMLDivElement | undefined

  onMount(() => {
    if (pixelPrefersReducedMotion()) return
    const onMove = (e: PointerEvent) => {
      const box = el?.getBoundingClientRect()
      const it = inner
      if (!box || !it) return
      const dx = e.clientX - (box.left + box.width / 2)
      const dy = e.clientY - (box.top + box.height / 2)
      if (Math.hypot(dx, dy) < props.radius) {
        it.style.transform = `translate(${dx * props.strength}px, ${dy * props.strength}px)`
      } else {
        it.style.transform = "translate(0, 0)"
      }
    }
    window.addEventListener("pointermove", onMove, { passive: true })
    onCleanup(() => window.removeEventListener("pointermove", onMove))
  })

  return (
    <div ref={(node) => (el = node)} class={cn(styles.box, props.xstyle, props.class)}>
      <div ref={(node) => (inner = node)} class="dither-magnet-inner">
        {props.children}
      </div>
    </div>
  )
}
