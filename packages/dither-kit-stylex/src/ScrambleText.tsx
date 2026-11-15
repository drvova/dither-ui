// Generated from @dither-ui/kit/solid/ScrambleText.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { mergeProps } from "solid-js"
import { type StyleProp } from "./lib"
import DecryptedText from "./DecryptedText"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  decryptedText: { cursor: "default" },
})

export type ScrambleTextProps = {
  text?: string
  speed?: number
  class?: string
  xstyle?: StyleProp
}

const CHARS = "!<>-_\\/[]{}=+*^?#$%&ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

/** Text that scrambles under the pointer and settles left to right: the
 * decrypt run on hover, over a wider glyph set and a quicker settle. */
export default function ScrambleText(raw: ScrambleTextProps) {
  const props = mergeProps({ text: "Hover to scramble", speed: 1 }, raw)
  return (
    <DecryptedText
      text={props.text}
      speed={props.speed * 1.5}
      trigger="hover"
      chars={CHARS}
      xstyle={[styles.decryptedText, props.xstyle, props.class]}
    />
  )
}
