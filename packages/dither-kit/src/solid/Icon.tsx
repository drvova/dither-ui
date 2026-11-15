import { createContext, createMemo, For, mergeProps, Show, useContext } from "solid-js"
import { ICONS, type IconName, iconSymbolId } from "../engine/icons"
import { cn } from "../tailwind/lib"

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
}

/** Where the glyphs' `<symbol>`s are: a sprite file's URL, `""` for a
 * `DitherIconSet` mounted in the page, or `null` (the default) for none,
 * every icon drawing its own paths. Under a sprite each icon is one `<use>`;
 * `null` again inside a subtree that is drawn to an image, which cannot
 * fetch the sprite. */
export const IconSprite = createContext<string | null>(null)

export default function Icon(raw: IconProps) {
  const props = mergeProps({ size: 16, strokeWidth: 2 }, raw)
  const sprite = useContext(IconSprite)

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
      class={cn("", props.class)}
    >
      <Show when={sprite !== null && paths()} fallback={<For each={paths()}>{(d) => <path d={d} />}</For>}>
        <use href={`${sprite}#${iconSymbolId(props.name)}`} />
      </Show>
    </svg>
  )
}
