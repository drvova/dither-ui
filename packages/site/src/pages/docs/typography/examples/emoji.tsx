import { DitherEmoji } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return <DitherEmoji char="🚀" label="launch" />
}

export const meta = defineExample({
  component: DitherEmoji,
  title: "Emoji",
  studio: { group: "display", frame: { w: 160, h: 80 }, controls: { char: {}, label: {} } },
})
