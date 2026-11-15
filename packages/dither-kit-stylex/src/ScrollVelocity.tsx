// Generated from @dither-ui/kit/solid/ScrollVelocity.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createEffect, createMemo, For, mergeProps, on, onCleanup, onMount } from "solid-js"
import { cn, type StyleProp } from "./lib"
import "@dither-ui/kit/solid/ScrollVelocity.css"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  row: { display: "inline-flex" },
  text: { paddingRight: "1.5rem" },
  box: { overflow: "hidden", whiteSpace: "nowrap" },
})

export type ScrollVelocityProps = {
  /** @default "DITHER · UI · TOOLKIT ·" */
  text?: string
  /** @docs number (px/s) */
  baseSpeed?: number
  class?: string
  xstyle?: StyleProp
}

/** A line that drifts on forever and is pushed along by the page's scroll,
 * in CSS (`ScrollVelocity.css`): the drift is an animation over a quarter of the
 * track at `baseSpeed`, which the kit clock holds when directed, and the
 * push a second one on the page's scroll timeline, where the browser has
 * one. Its width is read once, and again when it changes; reduced motion
 * holds it still. */
export default function ScrollVelocity(raw: ScrollVelocityProps) {
  const props = mergeProps({ text: "DITHER · UI · TOOLKIT · ", baseSpeed: 60 }, raw)

  // Four identical quarters: the drift and the push each wrap by a quarter,
  // seamlessly, and together leave half the track on show.
  const repeated = createMemo(() => Array.from({ length: 8 }, () => props.text))
  let track: HTMLDivElement | undefined

  /** A drift over a quarter of the track, at the speed asked. */
  function measure() {
    const el = track
    if (!el) return
    const quarter = el.scrollWidth / 4 || 1
    el.style.setProperty("--dk-sv-drift", `${(quarter / Math.max(1, props.baseSpeed)).toFixed(3)}s`)
  }

  onMount(() => {
    measure()
    createEffect(on(() => props.baseSpeed, measure, { defer: true }))
    if (typeof ResizeObserver === "undefined" || !track) return
    const ro = new ResizeObserver(measure)
    ro.observe(track)
    onCleanup(() => ro.disconnect())
  })

  return (
    <div class={cn(styles.box, props.xstyle, props.class)} aria-label={props.text}>
      <div class={cn(styles.row, "dk-sv-push")} aria-hidden="true">
        <div ref={(el) => (track = el)} class={cn(styles.row, "dk-sv-track")}>
          <For each={repeated()}>{(t) => <span {...stylex.props(styles.text)}>{t}</span>}</For>
        </div>
      </div>
    </div>
  )
}
