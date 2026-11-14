import { createMemo, For, type JSX, mergeProps } from "solid-js"
import { cn } from "../tailwind/lib"
import "./OrbitImages.css"

export type OrbitImagesProps = {
  /** @default ['A', 'B', 'C', 'D', 'E'] */
  items?: string[]
  /** @docs number (px) */
  radius?: number
  /** @docs number (s) */
  duration?: number
  /** @docs number (px) */
  size?: number
  class?: string
  /** @docs content */
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
      class={cn("relative grid place-items-center", props.class)}
      style={{ width: `${props.size}px`, height: `${props.size}px` }}
      aria-hidden="true"
    >
      <div class="dither-orbit absolute inset-0" style={{ "animation-duration": `${props.duration}s` }}>
        <For each={placed()}>
          {(p) => (
            <span
              class="absolute left-1/2 top-1/2 grid h-9 w-9 place-items-center rounded-full border border-border/60 bg-card text-xs"
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
