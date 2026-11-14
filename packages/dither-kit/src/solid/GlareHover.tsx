import type { JSX } from "solid-js"
import { cn } from "../tailwind/lib"
import "./GlareHover.css"

export type GlareHoverProps = {
  class?: string
  /** @docs content */
  children?: JSX.Element
}

export default function GlareHover(props: GlareHoverProps) {
  return (
    <div class={cn("dk-glare-hover dither-glare relative inline-block overflow-hidden rounded-[12px]", props.class)}>
      {props.children}
      <div class="glare pointer-events-none absolute inset-0" aria-hidden="true" />
    </div>
  )
}
