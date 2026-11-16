import { createSignal, Show } from "solid-js"
import { DitherOverlay } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [dimmed, setDimmed] = createSignal(true)

  // an overlay covers the screen; absolute positioning keeps it to its box
  // decorative by default; interactive catches presses, so a press closes it
  return (
    <div class="relative isolate grid h-40 place-items-center overflow-hidden rounded-md border border-border/60 bg-card/40">
      <button
        class="rounded-md border border-border/60 px-3 py-1.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
        type="button"
        onClick={() => setDimmed(true)}
      >
        Dim this box
      </button>
      <Show when={dimmed()}>
        <DitherOverlay class="absolute" dim="medium" interactive onClick={() => setDimmed(false)} />
      </Show>
    </div>
  )
}

export const meta = defineExample({
  component: DitherOverlay,
  title: "Overlay",
  studio: {
    group: "overlays",
    frame: { w: 260, h: 120 },
    controls: { dim: { demo: "soft" }, interactive: { demo: false } },
  },
})
