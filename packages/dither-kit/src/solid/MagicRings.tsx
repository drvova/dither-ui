import { createMemo, For, type JSX, mergeProps } from "solid-js"
import { cn } from "../tailwind/lib"
import "./MagicRings.css"

export type MagicRingsProps = {
  /** @docs string (hex) */
  color?: string
  count?: number
  /** @docs number (s) */
  duration?: number
  class?: string
  /** @docs content */
  children?: JSX.Element
}

export default function MagicRings(raw: MagicRingsProps) {
  const props = mergeProps({ color: "#7CFF67", count: 4, duration: 3 }, raw)

  const rings = createMemo(() => Math.max(1, Math.round(props.count)))

  return (
    <div class={cn("relative grid place-items-center overflow-hidden", props.class)}>
      {props.children}
      <For each={Array.from({ length: rings() }, (_, n) => n + 1)}>
        {(i) => (
          <span
            class="dither-ring pointer-events-none absolute rounded-full"
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
