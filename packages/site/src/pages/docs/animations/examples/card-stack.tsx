import { createSignal } from "solid-js"
import { DitherCardStack } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const cards = [
    { title: "Prints: riso on cream" },
    { title: "Frames: oak 24×30" },
    { title: "Zines: issue 04" },
    { title: "Stickers: die-cut set" },
  ]
  const [top, setTop] = createSignal(0)

  return (
    <>
      {/* drag horizontally, a flick advances, the deck cycles */}
      <DitherCardStack items={cards} class="h-40 w-64" onAdvance={(i) => setTop(i)}>
        {(scope) => <article class="h-full rounded-lg border bg-card p-4">{scope.item.title}</article>}
      </DitherCardStack>
      <p class="mt-3 text-center text-[10px]">
        card {top() + 1} of {cards.length}
      </p>
    </>
  )
}

export const meta = defineExample({
  component: DitherCardStack<string>,
  title: "Card stack",
  studio: {
    group: "display",
    frame: { w: 300, h: 200 },
    controls: { items: { kind: "list", demo: ["Prints", "Frames", "Zines"] }, depth: { min: 1, max: 4, step: 1 } },
  },
})
