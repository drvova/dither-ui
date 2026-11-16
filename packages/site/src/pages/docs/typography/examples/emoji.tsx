import { DitherEmoji } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <div class="flex items-center justify-center gap-3 text-lg">
      <DitherEmoji char="🚀" label="launch" />
      <DitherEmoji char="🔥" label="trending" />
      <DitherEmoji char="✨" label="new" />
      <DitherEmoji char="⚠️" label="warning" />
    </div>
  )
}

export const meta = defineExample({
  component: DitherEmoji,
  title: "Emoji",
  studio: { group: "display", frame: { w: 160, h: 80 }, controls: { char: {}, label: {} } },
})
