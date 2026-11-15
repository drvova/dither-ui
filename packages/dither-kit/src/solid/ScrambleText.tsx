import { mergeProps } from "solid-js"
import { cn } from "../tailwind/lib"
import DecryptedText from "./DecryptedText"

export type ScrambleTextProps = {
  text?: string
  speed?: number
  class?: string
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
      class={cn("cursor-default", props.class)}
    />
  )
}
