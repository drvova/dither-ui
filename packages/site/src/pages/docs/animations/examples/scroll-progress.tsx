import { For } from "solid-js"
import { DitherScrollProgress } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  // viewport, fixed top
  // nearest scrollable parent
  return (
    <div class="relative mx-auto h-48 max-w-md overflow-y-auto rounded-lg border border-border/60">
      <DitherScrollProgress attach="parent" color="purple" />
      <div class="grid gap-2 p-4" aria-hidden="true">
        <For each={Array.from({ length: 14 }, (_, i) => i + 1)}>
          {(i) => <div class={`h-2 rounded-sm bg-border/50 ${i % 3 === 0 ? "w-2/3" : "w-full"}`} />}
        </For>
      </div>
    </div>
  )
}

export const meta = defineExample({
  component: DitherScrollProgress,
  title: "Scroll progress",
  studio: {
    group: "display",
    frame: { w: 320, h: 60 },
    controls: { attach: { demo: "parent" }, edge: { options: ["top", "bottom"] }, color: { demo: "blue" } },
  },
})
