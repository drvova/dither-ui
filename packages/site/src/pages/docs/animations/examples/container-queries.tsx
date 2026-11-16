import { For } from "solid-js"
import { DitherContainer, DitherSequence, quantize } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  // the panel is a native resize box; the steppers are its keyboard path (both feed
  // the ResizeObserver the container listens to): a stepper finds the panel after its row
  function nudgeCq(stepper: HTMLElement, delta: number): void {
    const host = stepper.parentElement?.nextElementSibling as HTMLElement | null | undefined
    if (!host) return
    const w = Math.round(host.getBoundingClientRect().width)
    host.style.width = `${Math.min(580, Math.max(200, w + delta))}px`
  }

  // children read THIS box's width — not the viewport's
  // the stylesheet route, the same scope with zero JS (native @container): @container card
  // (min-width: 520px) { .readout { letter-spacing: 0.12em; } } the motion route, shipped keyframes
  // that measure the container itself: .scan { animation: dither-cq-traverse 2.8s ease-in-out
  // infinite alternate; } the selector route, the engine's active bucket on the host element:
  // .cq-card[data-cq="xs"] .cell { border-color: #d9a441; } .cq-card[data-cq="xl"] .cell {
  // cq-panel, cq-readout, cq-bucket, cq-grid, seq-cell and cq-scan are hooks for your
  // stylesheet: the docs size the panel (a native resize box), lay the grid's columns off the
  // panel's [data-cq] bucket, and run the scan on dither-cq-traverse, which measures 100cqw
  return (
    <>
      <div class="mb-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="rounded border border-border/60 px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-accent/40"
          aria-label="Narrow the container by 40 pixels"
          onClick={(e) => nudgeCq(e.currentTarget, -40)}
        >
          −
        </button>
        <button
          type="button"
          class="rounded border border-border/60 px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-accent/40"
          aria-label="Widen the container by 40 pixels"
          onClick={(e) => nudgeCq(e.currentTarget, 40)}
        >
          +
        </button>
        <span class="text-[11px] text-muted-foreground">
          drag the corner too: every child reads this box, never the viewport
        </span>
      </div>
      <DitherContainer scale={{ xs: 0, sm: 260, md: 360, lg: 450, xl: 530 }} step={8} name="demo" class="cq-panel">
        {(cq) => (
          <>
            <div class="cq-readout">
              <span class="cq-bucket">{cq.size}</span>
              <span>
                {cq.width}px, q8 {quantize(cq.width, 8)}, matches {cq.matches.join(" ")}
              </span>
            </div>
            <DitherSequence
              stagger={0.03 + cq.index * 0.02}
              from={cq.index >= 3 ? "center" : "start"}
              restartKey={cq.size ?? "xs"}
              class="cq-grid"
            >
              <For each={Array.from({ length: 12 }, (_, i) => i + 1)}>{(i) => <div class="seq-cell">{i}</div>}</For>
            </DitherSequence>
            <div class="cq-scan" aria-hidden="true" />
          </>
        )}
      </DitherContainer>
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
