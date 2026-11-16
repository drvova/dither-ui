import { For } from "solid-js"
import { DitherScrollArea } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const lines = Array.from({ length: 15 }, (_, i) => i + 1)

  return (
    <DitherScrollArea class="mx-auto h-40 max-w-sm rounded-lg border border-border/60 p-3">
      <For each={lines}>
        {(i) => (
          <p class="py-1 text-[12px] text-muted-foreground">Log line {i}: ordered dither keeps the texture coherent.</p>
        )}
      </For>
    </DitherScrollArea>
  )
}

export const meta = defineExample({
  component: DitherScrollArea,
  title: "Scroll area",
  studio: { group: "structure", frame: { w: 280, h: 200 }, controls: {}, slot: "Scrollable content" },
})
