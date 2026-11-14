// Generated from @dither-ui/kit/solid/Icon.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createMemo, For, mergeProps } from "solid-js"
import { ICONS, type IconName } from "@dither-ui/kit/engine/icons.ts"
import { cn, type StyleProp } from "./lib"

/** One glyph from the hand-rolled set: 24×24 stroke geometry in currentColor,
 * sized in px (default 16). A11y follows the icon rule — decorative by
 * default, `label` promotes it to role=img with a name. An unknown name is a
 * loud error, never an empty box. */
export type IconProps = {
  /** @docs IconName (glyph list in icons.ts)
   * @default required */
  name: IconName
  /** @docs number (px) */
  size?: number
  /** @docs string (promotes to role=img) */
  label?: string
  strokeWidth?: number
  class?: string
  xstyle?: StyleProp
}

export default function Icon(raw: IconProps) {
  const props = mergeProps({ size: 16, strokeWidth: 2 }, raw)

  const paths = createMemo(() => {
    const glyph = ICONS[props.name]
    if (!glyph) throw new Error(`[dither-kit] unknown icon: "${props.name}"`)
    return [...glyph]
  })

  const a11y = createMemo(() =>
    props.label
      ? ({ role: "img", "aria-label": props.label } as const)
      : ({ "aria-hidden": "true", focusable: "false" } as const),
  )

  return (
    <svg
      width={props.size}
      height={props.size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width={props.strokeWidth}
      stroke-linecap="round"
      stroke-linejoin="round"
      {...a11y()}
      class={cn(null, props.xstyle, props.class)}
    >
      <For each={paths()}>{(d) => <path d={d} />}</For>
    </svg>
  )
}
