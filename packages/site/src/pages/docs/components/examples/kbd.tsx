import { DitherKbd } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <div class="flex items-center justify-center gap-6 text-xs">
      <div class="flex items-center gap-2">
        <span class="text-muted-foreground">Command menu</span>
        <span class="flex items-center gap-1">
          <DitherKbd>⌘</DitherKbd>
          <DitherKbd>K</DitherKbd>
        </span>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-muted-foreground">Shortcuts</span>
        <DitherKbd>?</DitherKbd>
      </div>
    </div>
  )
}

export const meta = defineExample({
  component: DitherKbd,
  title: "Kbd",
  studio: { group: "display", frame: { w: 140, h: 80 }, slot: "⌘K", controls: {} },
})
