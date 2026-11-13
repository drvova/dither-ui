// Generated from dither-kit/solid/Emoji.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { mergeProps } from "solid-js"
import { cn, type StyleProp } from "./lib"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  text: { display: "inline-block", lineHeight: "1" },
})

export type EmojiProps = { char?: string; label?: string; class?: string; xstyle?: StyleProp }

/** An emoji as an IMAGE with a real accessible name: `role="img"` +
 * `aria-label` gives screen readers one predictable announcement instead of
 * whatever the glyph's unicode name happens to be. Pass the character, pass
 * what it means here. */
export default function Emoji(raw: EmojiProps) {
  const props = mergeProps({ char: "✨", label: "" }, raw)
  return (
    <span role="img" aria-label={props.label || undefined} class={cn(styles.text, props.xstyle, props.class)}>
      {props.char}
    </span>
  )
}
