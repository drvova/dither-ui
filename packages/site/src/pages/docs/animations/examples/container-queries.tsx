import { For } from "solid-js"
import { DitherContainer, DitherSequence, quantize } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <>
      {/* children read this box's width, not the viewport's */}
      <DitherContainer scale={{ xs: 0, sm: 260, md: 360, lg: 450, xl: 530 }} step={8} name="card" class="cq-card">
        {(scope) => (
          <>
            <span class="readout">
              {scope.size}, {scope.width}px, q8 {quantize(scope.width, 8)}
            </span>
            <DitherSequence
              stagger={0.03 + scope.index * 0.02}
              from={scope.index >= 3 ? "center" : "start"}
              restartKey={scope.size ?? undefined}
              class="cq-grid"
            >
              <For each={Array.from({ length: 12 }, (_, k) => k + 1)}>{() => <div class="cell" />}</For>
            </DitherSequence>
          </>
        )}
      </DitherContainer>

      {/* the stylesheet route, the same scope with zero JS (native @container):
             @container card (min-width: 520px) { .readout { letter-spacing: 0.12em; } }
           the motion route, shipped keyframes that measure the container itself:
             .scan { animation: dither-cq-traverse 2.8s ease-in-out infinite alternate; }
           the selector route, the engine's active bucket on the host element:
             .cq-card[data-cq="xs"] .cell { border-color: #d9a441; }
             .cq-card[data-cq="xl"] .cell { border-color: #3f8ff3; } */}
    </>
  )
}

export const meta = defineExample({
  component: DitherContainer,
  title: "Container",
  studio: {
    group: "display",
    frame: { w: 300, h: 160 },
    controls: { name: { demo: "dither" }, step: { min: 0, max: 64, step: 1, demo: 0 } },
    slot: "Children style themselves from this box. Resize it.",
  },
})
