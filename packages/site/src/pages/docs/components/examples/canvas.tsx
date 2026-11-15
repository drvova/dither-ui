import { createSignal, For } from "solid-js"
import { DitherCanvas } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [pattern, setPattern] = createSignal<"dots" | "grid" | "plain">("dots")

  return (
    <>
      <For each={["dots", "grid", "plain"] as const}>
        {(p) => (
          <button type="button" class="px-2 text-[11px]" aria-pressed={pattern() === p} onClick={() => setPattern(p)}>
            {p}
          </button>
        )}
      </For>

      {/* inked with var(--border), content floats above */}
      <DitherCanvas pattern={pattern()} cell={16} class="mt-3 h-56 rounded-lg border p-5">
        <div class="w-40 rounded-md border bg-background/80 p-3 text-[12px]">
          Artboard
          <p class="mt-1">Floats above the field</p>
        </div>
      </DitherCanvas>
    </>
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
