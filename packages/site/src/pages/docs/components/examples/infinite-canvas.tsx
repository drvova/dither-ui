import { createSignal } from "solid-js"
import { DitherInfiniteCanvas } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [zoom, setZoom] = createSignal(1)

  return (
    <>
      {/* drag pans, the wheel zooms toward the cursor, and the dot field
           rides the same transform, so space feels real */}
      <p class="text-[11px]">drag to pan, wheel to zoom: {Math.round(zoom() * 100)}%</p>
      <DitherInfiniteCanvas zoom={zoom()} onUpdateZoom={setZoom} class="mt-2 h-64 rounded-lg border">
        <div class="absolute w-40 rounded-md border bg-background/80 p-3 text-[12px]" style="left: 32px; top: 32px">
          Artboard A
        </div>
        <div class="absolute w-40 rounded-md border bg-background/80 p-3 text-[12px]" style="left: 280px; top: 150px">
          Artboard B
        </div>
      </DitherInfiniteCanvas>
    </>
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
