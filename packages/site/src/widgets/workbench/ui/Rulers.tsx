// Px rulers along the stage's top and left: ticks every 10, labels every
// 50, the span of what is in focus lit in the highlight, the pointer's
// position marked, and a guide pulled out of either ruler by dragging.
import { createMemo, For, Show } from "solid-js"
import { boxFrom } from "@/shared/lib/inspect/geometry"
import { useBench } from "../context"
import "./Rulers.css"

const marks = (n: number) => Array.from({ length: Math.floor(n / 50) }, (_, i) => (i + 1) * 50)

export default function Rulers() {
  const b = useBench()
  const focus = createMemo(() => {
    const d = b.draft()
    if (d?.kind === "region" || d?.kind === "marquee") return boxFrom(d.from, d.to)
    return b.reading()?.box ?? b.typeReading()?.box ?? b.a11y()?.box ?? null
  })

  return (
    <div class="wb-rulers rulers-scope" aria-hidden="true">
      <div
        class="wb-rule wb-rule-x"
        title="Drag down for a horizontal guide"
        on:pointerdown={(e) => b.pullGuide(e, "y")}
      >
        <For each={marks(b.size().w)}>{(n) => <span style={{ left: `${n}px` }}>{n}</span>}</For>
        <Show when={focus()}>{(f) => <i class="span" style={{ left: `${f().x}px`, width: `${f().w}px` }} />}</Show>
        <Show when={b.pointer()}>{(p) => <i class="at" style={{ left: `${p().x}px` }} />}</Show>
      </div>
      <div
        class="wb-rule wb-rule-y"
        title="Drag right for a vertical guide"
        on:pointerdown={(e) => b.pullGuide(e, "x")}
      >
        <For each={marks(b.size().h)}>{(n) => <span style={{ top: `${n}px` }}>{n}</span>}</For>
        <Show when={focus()}>{(f) => <i class="span" style={{ top: `${f().y}px`, height: `${f().h}px` }} />}</Show>
        <Show when={b.pointer()}>{(p) => <i class="at" style={{ top: `${p().y}px` }} />}</Show>
      </div>
      <div class="wb-corner">px</div>
    </div>
  )
}
