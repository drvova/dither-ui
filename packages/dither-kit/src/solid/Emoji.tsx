import { mergeProps } from "solid-js"
import { cn } from "../tailwind/lib"

export type EmojiProps = { char?: string; label?: string; class?: string }

/** An emoji as an IMAGE with a real accessible name: `role="img"` +
 * `aria-label` gives screen readers one predictable announcement instead of
 * whatever the glyph's unicode name happens to be. Pass the character, pass
 * what it means here. */
export default function Emoji(raw: EmojiProps) {
  const props = mergeProps({ char: "✨", label: "" }, raw)
  return (
    <span role="img" aria-label={props.label || undefined} class={cn("inline-block leading-none", props.class)}>
      {props.char}
    </span>
  )
}
