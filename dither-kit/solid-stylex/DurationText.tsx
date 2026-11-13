// Generated from ../solid/DurationText.tsx by src/shared/lib/stylex-layer-solid.ts: edit that
// file, then npx rs test -u tests/stylex-layer-solid.spec.ts
import { createMemo, mergeProps } from "solid-js"
import { cn, type StyleProp } from "./lib"

export type DurationTextProps = { ms?: number; class?: string; xstyle?: StyleProp }

/** Milliseconds → a smart human duration: precision drops as magnitude grows
 * (500ms → 45s → 2m 5s → 22h 20m → 1d 1h), no zero-padding clutter. */
export default function DurationText(raw: DurationTextProps) {
  const props = mergeProps({ ms: 0 }, raw)

  const text = createMemo(() => {
    const ms = props.ms
    const s = Math.floor(ms / 1000)
    if (ms < 1000) return `${ms}ms`
    if (s < 60) return `${s}s`
    const m = Math.floor(s / 60)
    const rs = s % 60
    if (m < 60) return rs > 0 ? `${m}m ${rs}s` : `${m}m`
    const h = Math.floor(m / 60)
    const rm = m % 60
    if (h < 24) return rm > 0 ? `${h}h ${rm}m` : `${h}h`
    const d = Math.floor(h / 24)
    const rh = h % 24
    return rh > 0 ? `${d}d ${rh}h` : `${d}d`
  })

  return <span class={cn(props.xstyle, props.class)}>{text()}</span>
}
