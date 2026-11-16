import { createSignal } from "solid-js"
import { DitherCardStack } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const cards = [
    { title: "Prints: riso on cream", color: "purple" },
    { title: "Frames: oak 24×30", color: "blue" },
    { title: "Zines: issue 04", color: "green" },
    { title: "Stickers: die-cut set", color: "orange" },
  ] as { title: string; color: "purple" | "blue" | "green" | "orange" }[]
  const [index, setIndex] = createSignal(0)

  // drag horizontally, a flick advances, the deck cycles
  return (
    <div class="grid min-h-56 place-items-center">
      <div>
        <DitherCardStack items={cards} class="h-40 w-64" onAdvance={setIndex}>
          {(card) => (
            <article class="flex h-full flex-col justify-between rounded-lg border border-border/60 bg-card/90 p-4">
              <span
                class="size-2 rounded-[2px]"
                style={{ background: `var(--swatch-${card.item.color})` }}
                aria-hidden="true"
              />
              <p class="font-mono text-[13px] text-foreground">{card.item.title}</p>
            </article>
          )}
        </DitherCardStack>
        <p class="mt-3 text-center text-[10px] tabular-nums text-muted-foreground">
          card {index() + 1} of {cards.length}
        </p>
      </div>
    </div>
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
