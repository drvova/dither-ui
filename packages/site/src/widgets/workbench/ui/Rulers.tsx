// Px rulers along the stage's top and left, drawn in the overlay's SVG
// layer: ticks every 10, labels every 50, the span of what is in focus lit
// in the highlight, the pointer's position marked, and a guide pulled out
// of either ruler by dragging (the rulers' grounds take the press).
import { createMemo, For, Show } from "solid-js"
import { boxFrom } from "@/shared/lib/inspect/geometry"
import { useBench } from "../context"
import "./Rulers.css"

const RULE = 14
const marks = (n: number) => Array.from({ length: Math.floor(n / 50) }, (_, i) => (i + 1) * 50)

/** One path for every tick of both rulers: 3px each 10, 7px each 50. */
function ticks(w: number, h: number) {
  let d = ""
  for (let x = 10; x < w; x += 10) d += `M${x + 0.5} ${RULE - (x % 50 ? 3 : 7)}V${RULE}`
  for (let y = 10; y < h; y += 10) d += `M${RULE - (y % 50 ? 3 : 7)} ${y + 0.5}H${RULE}`
  return d
}

export default function Rulers() {
  const b = useBench()
  const focus = createMemo(() => {
    const d = b.draft()
    if (d?.kind === "region" || d?.kind === "marquee") return boxFrom(d.from, d.to)
    return b.reading()?.box ?? b.typeReading()?.box ?? b.a11y()?.box ?? null
  })

  return (
    <g class="wb-rulers rulers-scope">
      <rect
        class="rule rule-x"
        x={0}
        y={0}
        width={b.size().w}
        height={RULE}
        on:pointerdown={(e) => b.pullGuide(e, "y")}
      >
        <title>Drag down for a horizontal guide</title>
      </rect>
      <rect
        class="rule rule-y"
        x={0}
        y={0}
        width={RULE}
        height={b.size().h}
        on:pointerdown={(e) => b.pullGuide(e, "x")}
      >
        <title>Drag right for a vertical guide</title>
      </rect>
      <path class="ticks" d={ticks(b.size().w, b.size().h)} />
      <path class="edge" d={`M0 ${RULE - 0.5}H${b.size().w}M${RULE - 0.5} 0V${b.size().h}`} />
      <For each={marks(b.size().w)}>
        {(n) => (
          <text class="n" x={n + 2} y={2} dominant-baseline="hanging">
            {n}
          </text>
        )}
      </For>
      <For each={marks(b.size().h)}>
        {(n) => (
          <text class="n" transform={`translate(2 ${n + 2}) rotate(-90)`} text-anchor="end" dominant-baseline="hanging">
            {n}
          </text>
        )}
      </For>
      <Show when={focus()}>
        {(f) => (
          <>
            <rect class="span" x={f().x} y={0} width={f().w} height={RULE - 1} />
            <rect class="span" x={0} y={f().y} width={RULE - 1} height={f().h} />
            <path
              class="span-edge"
              d={`M${f().x + 0.5} 0V${RULE - 1}M${f().x + f().w - 0.5} 0V${RULE - 1}M0 ${f().y + 0.5}H${RULE - 1}M0 ${f().y + f().h - 0.5}H${RULE - 1}`}
            />
          </>
        )}
      </Show>
      <Show when={b.pointer()}>
        {(p) => <path class="at" d={`M${p().x + 0.5} 0V${RULE}M0 ${p().y + 0.5}H${RULE}`} />}
      </Show>
      <rect class="corner" x={0} y={0} width={RULE} height={RULE} />
      <path class="edge" d={`M0 ${RULE - 0.5}H${RULE - 0.5}V0`} />
      <text class="n" x={RULE / 2} y={RULE / 2} font-size="7" text-anchor="middle" dominant-baseline="central">
        px
      </text>
    </g>
  )
}
