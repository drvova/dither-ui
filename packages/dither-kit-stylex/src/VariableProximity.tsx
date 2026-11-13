// Generated from @dither-ui/kit/solid/VariableProximity.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createMemo, For, mergeProps, onCleanup, onMount } from "solid-js"
import { pixelPrefersReducedMotion } from "@dither-ui/kit/engine/pixel.ts"
import { cn, type StyleProp } from "./lib"
import { createInviewLoop } from "@dither-ui/kit/solid/runtime/in-view.ts"
import "@dither-ui/kit/solid/VariableProximity.css"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  text: { display: "inline" },
})

export type VariableProximityProps = {
  text?: string
  radius?: number
  class?: string
  xstyle?: StyleProp
}

export default function VariableProximity(raw: VariableProximityProps) {
  const props = mergeProps({ text: "Move the cursor across this line to feel the weight shift", radius: 120 }, raw)

  // Per-character weight ramps with pointer distance — no scale, so nothing
  // reflows; good for a whole sentence.
  const chars = createMemo(() => [...props.text])
  let root: HTMLSpanElement | undefined
  let raf = 0
  let mx = -1e9
  let my = -1e9

  function onMove(e: PointerEvent) {
    mx = e.clientX
    my = e.clientY
  }
  function onLeave() {
    mx = -1e9
    my = -1e9
  }
  function frame() {
    raf = requestAnimationFrame(frame)
    const kids = root?.children
    if (!kids) return
    for (let i = 0; i < kids.length; i++) {
      const el = kids[i] as HTMLElement
      const r = el.getBoundingClientRect()
      const cx = r.left + r.width / 2
      const cy = r.top + r.height / 2
      const t = Math.max(0, 1 - Math.hypot(mx - cx, my - cy) / props.radius)
      el.style.fontWeight = String(Math.round(300 + t * 600))
      el.style.opacity = String(0.55 + t * 0.45)
    }
  }

  function start() {
    if (raf || pixelPrefersReducedMotion()) return
    raf = requestAnimationFrame(frame)
  }
  function stop() {
    if (!raf) return
    cancelAnimationFrame(raf)
    raf = 0
  }

  onMount(() => {
    if (pixelPrefersReducedMotion()) return
    window.addEventListener("pointermove", onMove, { passive: true })
    window.addEventListener("pointerleave", onLeave)
    onCleanup(() => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerleave", onLeave)
    })
  })
  createInviewLoop(() => root, start, stop)

  // A space stays a plain space between the letters' spans, so the line
  // breaks between words (never inside one); the letters are the root's
  // only element children, which the frame walks.
  return (
    <span ref={(el) => (root = el)} class={cn(styles.text, props.xstyle, props.class)} aria-label={props.text}>
      <For each={chars()}>
        {(ch) =>
          ch === " " ? (
            " "
          ) : (
            <span aria-hidden="true" class="dither-proximity-char" style={{ opacity: 0.55 }}>
              {ch}
            </span>
          )
        }
      </For>
    </span>
  )
}
