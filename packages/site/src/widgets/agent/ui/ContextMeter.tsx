import { createMemo } from "solid-js"
import { cn } from "dither-kit/tailwind/lib.ts"
import type { ContextUse } from "@/features/agent/tools"
import "./ContextMeter.css"

// How full the harness's context is, as it reports it: a ring by the send
// key (its share of the window) with the percentage beside it (a ring alone
// reads as a spinner), the figures in words for the title and a screen
// reader. Past `FULL` the ring takes the destructive ink: the harness
// will soon compact or forget the start.
export type ContextMeterProps = { use: ContextUse; class?: string }

const FULL = 0.9
const R = 6
const C = 2 * Math.PI * R
const k = (n: number) => (n >= 1000 ? `${Math.round(n / 100) / 10}k` : String(n))

export default function ContextMeter(props: ContextMeterProps) {
  const share = createMemo(() => Math.min(1, props.use.used / props.use.size))
  const pct = createMemo(() => Math.round(share() * 100))
  const words = createMemo(() => {
    const pct = Math.round(share() * 100)
    const cost = props.use.cost
    const spent = cost
      ? `, ${new Intl.NumberFormat("en", { style: "currency", currency: cost.currency, maximumFractionDigits: cost.amount < 0.01 ? 4 : 2 }).format(cost.amount)}`
      : ""
    return `Context ${pct}% used: ${k(props.use.used)} of ${k(props.use.size)} tokens${spent}`
  })

  return (
    <span
      class={cn("context-meter-scope meter", props.class)}
      role="img"
      aria-label={words()}
      title={words()}
      data-full={share() >= FULL || undefined}
    >
      <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
        <circle cx="8" cy="8" r={R} class="track" />
        <circle cx="8" cy="8" r={R} class="used" stroke-dasharray={`${C * share()} ${C}`} transform="rotate(-90 8 8)" />
      </svg>
      <span class="pct" aria-hidden="true">
        {pct()}%
      </span>
    </span>
  )
}
