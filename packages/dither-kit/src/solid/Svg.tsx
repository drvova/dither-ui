import { createMemo, type JSX } from "solid-js"
import { cn } from "../tailwind/lib"

export type SvgProps = {
  viewBox?: string
  label?: string
  class?: string
  children?: JSX.Element
}

/** Neutral SVG wrapper: no imposed stroke/fill language — the kit's own art
 * direction stays in the components. A11y follows the icon rule: decorative
 * by default (`aria-hidden`), `label` promotes it to an image with a name. */
export default function Svg(props: SvgProps) {
  const a11y = createMemo(() =>
    props.label
      ? ({ role: "img", "aria-label": props.label } as const)
      : ({ "aria-hidden": "true", focusable: "false" } as const),
  )
  return (
    <svg viewBox={props.viewBox} {...a11y()} class={cn("", props.class)}>
      {props.children}
    </svg>
  )
}
