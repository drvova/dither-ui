import { createMemo, Index, mergeProps } from "solid-js"
import { cn } from "../tailwind/lib"
import "./LogoLoop.css"

export type LogoLoopProps = {
  /** @default ['DITHER', 'BAYER', ...] */
  items?: string[]
  /** @docs number (s) */
  speed?: number
  /** @docs number (px) */
  gap?: number
  class?: string
}

export default function LogoLoop(raw: LogoLoopProps) {
  const props = mergeProps({ items: ["DITHER", "BAYER", "CANVAS", "SOLID", "PIXELS"], speed: 18, gap: 48 }, raw)

  // Duplicated once so translateX(-50%) wraps seamlessly.
  const loop = createMemo(() => [...props.items, ...props.items])

  return (
    <div class={cn("overflow-hidden", props.class)} aria-hidden="true">
      <div class="dither-logoloop flex w-max" style={{ "animation-duration": `${props.speed}s` }}>
        <Index each={loop()}>
          {(it) => (
            <span class="shrink-0 whitespace-nowrap" style={{ "padding-right": `${props.gap}px` }}>
              {it()}
            </span>
          )}
        </Index>
      </div>
    </div>
  )
}
