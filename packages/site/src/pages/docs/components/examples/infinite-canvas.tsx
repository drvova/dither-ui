import { createSignal } from "solid-js"
import { DitherInfiniteCanvas } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [zoom, setZoom] = createSignal(1)

  return (
    <div class="mx-auto max-w-lg">
      <div class="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>drag to pan, wheel to zoom</span>
        <span class="tabular-nums">{Math.round(zoom() * 100)}%</span>
      </div>
      <DitherInfiniteCanvas zoom={zoom()} onUpdateZoom={setZoom} class="mt-2 h-64 rounded-lg border border-border/60">
        <div
          class="absolute w-40 rounded-md border border-border/60 bg-background/80 p-3"
          style={{ left: "32px", top: "32px" }}
        >
          <div class="text-[12px] text-muted-foreground">Artboard A</div>
          <div class="mt-1 text-[12px] text-foreground">Drag the field</div>
        </div>
        <div
          class="absolute w-40 rounded-md border border-border/60 bg-background/80 p-3"
          style={{ left: "280px", top: "150px" }}
        >
          <div class="text-[12px] text-muted-foreground">Artboard B</div>
          <div class="mt-1 text-[12px] text-foreground">Zoom finds me</div>
        </div>
      </DitherInfiniteCanvas>
    </div>
  )
}

export const meta = defineExample({
  component: DitherInfiniteCanvas,
  title: "Infinite canvas",
  studio: {
    group: "structure",
    frame: { w: 360, h: 260 },
    controls: {
      pattern: {},
      cell: { min: 4, max: 64 },
      minZoom: { min: 0.1, max: 1, step: 0.05 },
      maxZoom: { min: 1, max: 8, step: 0.5 },
    },
    slot: "Drag to pan, wheel to zoom",
  },
})
