// Generated from dither-kit/solid/OrbitImages.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createMemo, For, type JSX, mergeProps } from "solid-js"
import { cn, type StyleProp } from "./lib"
import "dither-kit/solid/OrbitImages.css"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  layer: { position: "absolute", inset: "0px" },
  grid: {
    position: "absolute",
    top: "calc(1 / 2 * 100%)",
    left: "calc(1 / 2 * 100%)",
    display: "grid",
    height: "2.25rem",
    width: "2.25rem",
    placeItems: "center",
    borderRadius: "calc(infinity * 1px)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    backgroundColor: "var(--card)",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
  },
  grid2: { position: "relative", display: "grid", placeItems: "center" },
})

export type OrbitImagesProps = {
  items?: string[]
  radius?: number
  duration?: number
  size?: number
  class?: string
  xstyle?: StyleProp
  children?: JSX.Element
}

export default function OrbitImages(raw: OrbitImagesProps) {
  const props = mergeProps({ items: ["A", "B", "C", "D", "E"], radius: 80, duration: 16, size: 200 }, raw)

  const placed = createMemo(() => {
    const n = props.items.length || 1
    return props.items.map((it, i) => {
      const a = (i / n) * Math.PI * 2
      return { it, x: Math.sin(a) * props.radius, y: -Math.cos(a) * props.radius }
    })
  })

  return (
    <div
      class={cn(styles.grid2, props.xstyle, props.class)}
      style={{ width: `${props.size}px`, height: `${props.size}px` }}
      aria-hidden="true"
    >
      <div class={cn(styles.layer, "dither-orbit")} style={{ "animation-duration": `${props.duration}s` }}>
        <For each={placed()}>
          {(p) => (
            <span
              {...stylex.props(styles.grid)}
              style={{ transform: `translate(-50%, -50%) translate(${p.x}px, ${p.y}px)` }}
            >
              <span class="dither-orbit-label" style={{ "animation-duration": `${props.duration}s` }}>
                {p.it}
              </span>
            </span>
          )}
        </For>
      </div>
      {props.children}
    </div>
  )
}
