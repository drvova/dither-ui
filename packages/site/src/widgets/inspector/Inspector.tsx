// The Studio's inspector: the frame around the selected layer's panel (its
// name, its kind, the lock), the panel itself picked by the layer's kind from
// `panels/` (a widget frame's by its widget's kind).
import { createMemo, Show } from "solid-js"
import { Dynamic } from "solid-js/web"
import { cn } from "@dither-ui/kit/tailwind/lib.ts"
import { editor, selectedArtboard, selectedChart, selectedLayers } from "@/entities/editor"
import { layerSeries } from "./model/series"
import { LAYER_PANELS } from "./panels"

export default function Inspector() {
  const ab = () => selectedArtboard.value
  const chart = () => selectedChart.value
  const layer = createMemo(() => selectedLayers.value.find((l) => l.id === editor.selectedLayerId))
  const kind = createMemo(() => layer()?.kind ?? "root")
  const series = createMemo(() => layerSeries(chart(), layer()))

  const locked = createMemo(() => {
    const c = chart()
    const a = ab()
    if (!c || !a) return false
    switch (kind()) {
      case "root":
        return a.locked
      case "series":
        return series()?.locked ?? false
      case "grid":
        return c.grid.locked
      case "xAxis":
        return c.xAxis.locked
      case "yAxis":
        return c.yAxis.locked
      case "legend":
        return c.legend.locked
      case "tooltip":
        return c.tooltip.locked
      default:
        return false
    }
  })
  function unlock() {
    const c = chart()
    const a = ab()
    if (!c || !a) return
    switch (kind()) {
      case "root":
        a.locked = false
        break
      case "series": {
        const s = series()
        if (s) s.locked = false
        break
      }
      case "grid":
        c.grid.locked = false
        break
      case "xAxis":
        c.xAxis.locked = false
        break
      case "yAxis":
        c.yAxis.locked = false
        break
      case "legend":
        c.legend.locked = false
        break
      case "tooltip":
        c.tooltip.locked = false
        break
    }
  }

  // Inside the panel a frame is selected: these read it as there.
  const A = () => ab()!
  const C = () => chart()!

  return (
    <Show
      when={chart() && ab()}
      fallback={
        <div class="flex h-full items-center justify-center px-4 text-center text-xs text-muted-foreground">
          Select an artboard to edit its properties.
        </div>
      }
    >
      <div class="flex h-full flex-col">
        <div class="flex h-9 shrink-0 items-center justify-between gap-2 border-b border-border/60 px-3">
          <span class="truncate text-[13px] font-medium text-foreground">
            {A().widget ? A().name : (layer()?.label ?? "Inspector")}
          </span>
          <span class="shrink-0 rounded border border-border px-1.5 py-0.5 text-[11px] text-muted-foreground">
            {A().widget?.kind ?? kind()}
          </span>
        </div>
        <Show when={locked()}>
          <div class="mx-4 mt-3 flex items-center justify-between gap-2 rounded-md border border-border bg-card px-2.5 py-1.5 text-[11px] text-muted-foreground">
            <span class="flex items-center gap-1.5">
              <svg
                viewBox="0 0 24 24"
                class="size-3.5 text-foreground"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <rect x="5" y="11" width="14" height="10" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
              </svg>
              Locked
            </span>
            <button
              type="button"
              class="rounded border border-border px-1.5 py-0.5 text-foreground transition-colors hover:bg-background"
              onClick={unlock}
            >
              Unlock
            </button>
          </div>
        </Show>
        <div
          class={cn(
            "flex flex-col gap-5 overflow-y-auto p-4",
            locked() ? "pointer-events-none select-none opacity-50" : "",
          )}
        >
          <Dynamic component={LAYER_PANELS[kind()]} artboard={A()} chart={C()} layer={layer()} />
        </div>
      </div>
    </Show>
  )
}
