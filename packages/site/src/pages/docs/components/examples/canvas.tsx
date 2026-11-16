import { createSignal, For } from "solid-js"
import { DitherCanvas } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [pattern, setPattern] = createSignal<"dots" | "grid" | "plain">("dots")

  return (
    <div class="mx-auto max-w-lg">
      <div class="flex gap-1 rounded-md border border-border/60 p-0.5" role="group" aria-label="Pattern">
        <For each={["dots", "grid", "plain"] as const}>
          {(p) => (
            <button
              type="button"
              aria-pressed={pattern() === p}
              class={`rounded px-2 py-0.5 text-[11px] transition-colors ${pattern() === p ? "bg-card text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => setPattern(p)}
            >
              {p}
            </button>
          )}
        </For>
      </div>
      <DitherCanvas pattern={pattern()} class="mt-3 h-56 rounded-lg border border-border/60 p-5">
        <div class="w-40 rounded-md border border-border/60 bg-background/80 p-3">
          <div class="text-[12px] text-muted-foreground">Artboard</div>
          <div class="mt-1 text-[12px] text-foreground">Floats above the field</div>
        </div>
      </DitherCanvas>
    </div>
  )
}

export const meta = defineExample({
  component: DitherCanvas,
  title: "Canvas",
  studio: {
    group: "structure",
    frame: { w: 320, h: 220 },
    controls: { pattern: {}, cell: { min: 4, max: 64 } },
    slot: "Work surface",
  },
})
