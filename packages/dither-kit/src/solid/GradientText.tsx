import { createMemo, type JSX, mergeProps } from "solid-js"
import { cn } from "../tailwind/lib"
import "./GradientText.css"

export type GradientTextProps = {
  /** @docs string[] (hex)
   * @default ['#358ff3', '#7CFF67', '#358ff3'] */
  colors?: string[]
  speed?: number
  /** @default undefined */
  class?: string
  /** @docs text */
  children?: JSX.Element
}

export default function GradientText(raw: GradientTextProps) {
  const props = mergeProps({ colors: ["#358ff3", "#7CFF67", "#358ff3"], speed: 1 }, raw)

  const bg = createMemo(
    () => `linear-gradient(90deg, ${(props.colors.length ? props.colors : ["#ffffff"]).join(", ")})`,
  )
  const dur = createMemo(() => `${Math.max(0.2, 6 / Math.max(0.01, props.speed))}s`)

  return (
    <span
      class={cn("dither-gradient-text", props.class)}
      style={{ "background-image": bg(), "animation-duration": dur() }}
    >
      {props.children}
    </span>
  )
}
