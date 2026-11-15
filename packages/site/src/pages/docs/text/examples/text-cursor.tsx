import { DitherTextCursor } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <div class="h-40">
      <DitherTextCursor text="dither" />
    </div>
  )
}

export const meta = defineExample({
  component: DitherTextCursor,
  title: "Text cursor",
  studio: { group: "display", frame: { w: 280, h: 160 }, controls: { text: {} } },
})
